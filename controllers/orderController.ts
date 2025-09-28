import { Request, Response } from 'express';
import { string } from 'joi/lib';
const { prisma } = require('../utils/db');

type AuthedRequest = Request & { user?: { id: string } };

function genOrderNumber() {
  const rnd = Math.floor(Math.random() * 9000 + 1000);
  return `ORD-${Date.now()}-${rnd}`;
}

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Create order from cart
 *     description: Create a new order using items from the user's cart
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               shippingAddress:
 *                 type: object
 *                 properties:
 *                   firstName:
 *                     type: string
 *                     example: "John"
 *                   lastName:
 *                     type: string
 *                     example: "Doe"
 *                   address1:
 *                     type: string
 *                     example: "123 Main St"
 *                   address2:
 *                     type: string
 *                     example: "Apt 4B"
 *                   city:
 *                     type: string
 *                     example: "New York"
 *                   state:
 *                     type: string
 *                     example: "NY"
 *                   zipCode:
 *                     type: string
 *                     example: "10001"
 *                   country:
 *                     type: string
 *                     example: "USA"
 *                   phone:
 *                     type: string
 *                     example: "+1234567890"
 *               billingAddress:
 *                 type: object
 *                 description: Billing address (same structure as shipping address)
 *               paymentMethod:
 *                 type: string
 *                 example: "credit_card"
 *               notes:
 *                 type: string
 *                 example: "Please deliver after 5 PM"
 *     responses:
 *       201:
 *         description: Order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Order'
 *                 message:
 *                   type: string
 *                   example: "order created"
 *       400:
 *         description: Bad request - cart is empty, product not active, or insufficient stock
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized - missing or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   get:
 *     summary: Get user's orders
 *     description: Retrieve all orders for the authenticated user
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Order'
 *       401:
 *         description: Unauthorized - missing or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
// POST /api/orders - create order from cart
export const createOrder = async (req: AuthedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, error: 'unauthorized' });

    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: { items: { include: { product: true } } }
    });
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, error: 'cart is empty' });
    }

    // Validate stock and compute totals
    for (const it of cart.items) {
      if (it.product.status !== 'ACTIVE') {
        return res.status(400).json({ success: false, error: `product not active: ${it.product.name}` });
      }
      if (it.product.stock !== null && it.product.stock < it.quantity) {
        return res.status(400).json({ success: false, error: `insufficient stock: ${it.product.name}` });
      }
    }

    const subtotalNum = cart.items.reduce((acc:any, it:any) => acc + Number(it.price) * it.quantity, 0);
    const taxNum = 0;
    const shippingNum = 0;
    const discountNum = 0;
    const totalNum = subtotalNum + taxNum + shippingNum - discountNum;

    // Create order with items
    const order = await prisma.order.create({
      data: {
        orderNumber: genOrderNumber(),
        userId,
        customerName: req.body.customerName || 'User',
        subtotal: subtotalNum,
        tax: taxNum,
        shipping: req.body.shipping || shippingNum,
        discount: discountNum,
        total: totalNum,
        shippingAddress: req.body.shippingAddress || {},
        billingAddress: req.body.billingAddress || {},
        items: {
          create: cart.items.map((it:any) => ({
            productId: it.productId,
            name: it.product.name,
            quantity: it.quantity,
            price: it.price,
            total: Number(it.price) * it.quantity
          }))
        }
      },
      include: { items: true }
    });

    // Decrement product stock
    await Promise.all(
      cart.items.map((it: any) =>
        prisma.product.update({
          where: { id: it.productId },
          data: { stock: Math.max(0, (it.product.stock || 0) - it.quantity) }
        })
      )
    );

    // Clear cart
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    await prisma.cart.update({ where: { id: cart.id }, data: { subtotal: 0 } });

    return res.status(201).json({ success: true, data: order, message: 'order created' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Failed to create order', message: err.message });
  }
};

// GET /api/orders - my orders
export const getMyOrders = async (req: AuthedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, error: 'unauthorized' });

    const orders = await prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { items: true }
    });

    return res.json({ success: true, data: orders });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Failed to fetch orders', message: err.message });
  }
};

/**
 * @swagger
 * /api/orders/{orderId}:
 *   get:
 *     summary: Get order by ID
 *     description: Retrieve a specific order by its ID (user can only access their own orders)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         description: Unique identifier of the order
 *         schema:
 *           type: string
 *           example: "order_123456789"
 *     responses:
 *       200:
 *         description: Order retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Order'
 *       401:
 *         description: Unauthorized - missing or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Order not found or doesn't belong to user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
// GET /api/orders/:id
export const getOrderById = async (req: AuthedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    if (!userId) return res.status(401).json({ success: false, error: 'unauthorized' });

    const order = await prisma.order.findFirst({ where: { id, userId }, include: { items: true } });
    if (!order) return res.status(404).json({ success: false, error: 'order not found' });

    return res.json({ success: true, data: order });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Failed to fetch order', message: err.message });
  }
};