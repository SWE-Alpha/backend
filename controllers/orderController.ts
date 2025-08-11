import { Request, Response } from 'express';
const { prisma } = require('../utils/db');

type AuthedRequest = Request & { user?: { id: string } };

function genOrderNumber() {
  const rnd = Math.floor(Math.random() * 9000 + 1000);
  return `ORD-${Date.now()}-${rnd}`;
}

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
        customerName: 'Customer', // simple placeholder
        subtotal: subtotalNum,
        tax: taxNum,
        shipping: shippingNum,
        discount: discountNum,
        total: totalNum,
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