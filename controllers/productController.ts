import { Request, Response } from 'express';
const { prisma } = require('../utils/db');

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Get all products
 *     description: Retrieve a paginated list of products with filtering options
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for product name or description
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, price, stock, featured, createdAt, updatedAt]
 *           default: createdAt
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [DRAFT, ACTIVE, ARCHIVED, OUT_OF_STOCK]
 *         description: Filter by product status
 *       - in: query
 *         name: featured
 *         schema:
 *           type: boolean
 *         description: Filter by featured products
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *         description: Filter by category ID
 *     responses:
 *       200:
 *         description: Products retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginationResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
// GET /api/products
export const getAllProducts = async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 100,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      status,
      featured,
      categoryId
    } = req.query as any;

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(Math.max(1, Number(limit)), 100);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (status && ['DRAFT', 'ACTIVE', 'ARCHIVED', 'OUT_OF_STOCK'].includes(String(status))) {
      where.status = status;
    }
    if (featured !== undefined) {
      where.featured = String(featured) === 'true';
    }
    if (categoryId) {
      where.categoryId = String(categoryId);
    }
    if (search && String(search).trim() !== '') {
      const q = String(search).trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } }, 
        { description: { contains: q, mode: 'insensitive' } }
      ];
    }

    const validSort = ['name', 'price', 'stock', 'featured', 'createdAt', 'updatedAt'];
    const safeSortBy = validSort.includes(String(sortBy)) ? String(sortBy) : 'createdAt';
    const safeSortOrder = String(sortOrder).toLowerCase() === 'asc' ? 'asc' : 'desc';

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { [safeSortBy]: safeSortOrder },
        include: { 
          images: true, 
          variants: true,
          category: {
            select: { id: true, name: true, description: true }
          }
        }
      }),
      prisma.product.count({ where })
    ]);

    return res.json({
      success: true,
      data: items,
      pagination: {
        currentPage: pageNum,
        itemsPerPage: limitNum,
        totalItems: total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Failed to fetch products', message: err.message });
  }
};

/**
 * @swagger
 * /api/products/{productId}:
 *   get:
 *     summary: Get product by ID
 *     description: Retrieve detailed information about a specific product
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         description: Unique identifier of the product
 *         schema:
 *           type: string
 *           example: "product_123456789"
 *     responses:
 *       200:
 *         description: Product retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *       404:
 *         description: Product not found
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
// GET /api/products/:id
export const getProductById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: { 
        images: true, 
        variants: true,
        category: {
          select: { id: true, name: true, description: true }
        }
      }
    });
    if (!product) return res.status(404).json({ success: false, error: 'product not found' });

    return res.json({ success: true, data: product });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Failed to fetch product', message: err.message });
  }
};

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Create new product
 *     description: Create a new product with images and variants
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - description
 *               - price
 *               - categoryId
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Wireless Bluetooth Headphones"
 *               description:
 *                 type: string
 *                 example: "High-quality wireless headphones with noise cancellation"
 *               price:
 *                 type: number
 *                 format: decimal
 *                 example: 99.99
 *               categoryId:
 *                 type: string
 *                 example: "category_123456789"
 *               stock:
 *                 type: integer
 *                 default: 0
 *                 example: 50
 *               featured:
 *                 type: boolean
 *                 default: false
 *                 example: true
 *               status:
 *                 type: string
 *                 enum: [DRAFT, ACTIVE, ARCHIVED, OUT_OF_STOCK]
 *                 default: DRAFT
 *                 example: "ACTIVE"
 *               images:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     url:
 *                       type: string
 *                       example: "https://example.com/image.jpg"
 *                     altText:
 *                       type: string
 *                       example: "Product image"
 *                     sortOrder:
 *                       type: integer
 *                       example: 0
 *               variants:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: "Color"
 *                     value:
 *                       type: string
 *                       example: "Black"
 *                     price:
 *                       type: number
 *                       example: 109.99
 *                     stock:
 *                       type: integer
 *                       example: 25
 *                     sku:
 *                       type: string
 *                       example: "WBH-BLK-001"
 *     responses:
 *       201:
 *         description: Product created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *       400:
 *         description: Bad request - missing required fields or invalid category
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
 */
// POST /api/products
export const createProduct = async (req: Request, res: Response) => {
  try {
    const { name, description, price, categoryId, stock = 0, featured = false, status = 'DRAFT', images = [], variants = [] } = req.body || {};
    
    // Validation
    if (!name || !description || price === undefined || !categoryId) {
      return res.status(400).json({ 
        success: false, 
        error: 'name, description, price, and categoryId are required' 
      });
    }

    // Verify category exists
    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid categoryId - category does not exist' 
      });
    }

    const product = await prisma.product.create({
      data: {
        name,
        description,
        price,
        categoryId,
        stock: Number(stock) || 0,
        featured: Boolean(featured),
        status,
        images: images?.length
          ? { create: images.map((img: any) => ({ 
              url: img.url, 
              altText: img.altText ?? null, 
              sortOrder: img.sortOrder ?? 0 
            })) }
          : undefined,
        variants: variants?.length
          ? {
              create: variants.map((v: any) => ({
                name: v.name,
                value: v.value,
                price: v.price ?? null,
                stock: v.stock ?? null,
                sku: v.sku ?? null
              }))
            }
          : undefined
      },
      include: { 
        images: true, 
        variants: true,
        category: {
          select: { id: true, name: true, description: true }
        }
      }
    });

    return res.status(201).json({ success: true, data: product });
  } catch (err: any) {
    if (err.code === 'P2003') {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid categoryId - category does not exist' 
      });
    }
    return res.status(500).json({ success: false, error: 'Failed to create product', message: err.message });
  }
};

/**
 * @swagger
 * /api/products/{productId}:
 *   put:
 *     summary: Update product
 *     description: Update an existing product's information
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         description: Unique identifier of the product to update
 *         schema:
 *           type: string
 *           example: "product_123456789"
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Updated Product Name"
 *               description:
 *                 type: string
 *                 example: "Updated product description"
 *               price:
 *                 type: number
 *                 format: decimal
 *                 example: 129.99
 *               categoryId:
 *                 type: string
 *                 example: "category_987654321"
 *               stock:
 *                 type: integer
 *                 example: 75
 *               featured:
 *                 type: boolean
 *                 example: false
 *               status:
 *                 type: string
 *                 enum: [DRAFT, ACTIVE, ARCHIVED, OUT_OF_STOCK]
 *                 example: "ACTIVE"
 *               publishedAt:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-01-15T10:30:00Z"
 *     responses:
 *       200:
 *         description: Product updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *       400:
 *         description: Bad request - invalid category ID
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
 *       404:
 *         description: Product not found
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
 *   delete:
 *     summary: Delete product
 *     description: Delete a product (only if not referenced by orders)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         description: Unique identifier of the product to delete
 *         schema:
 *           type: string
 *           example: "product_123456789"
 *     responses:
 *       200:
 *         description: Product deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "product deleted"
 *       400:
 *         description: Bad request - product is referenced by orders
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
 *       404:
 *         description: Product not found
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
// PUT /api/products/:id
export const updateProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, price, categoryId, stock, featured, status, publishedAt } = req.body || {};

    const exists = await prisma.product.findUnique({ where: { id } });
    if (!exists) return res.status(404).json({ success: false, error: 'product not found' });

    // If categoryId is being updated, verify it exists
    if (categoryId) {
      const category = await prisma.category.findUnique({ where: { id: categoryId } });
      if (!category) {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid categoryId - category does not exist' 
        });
      }
    }

    const updated = await prisma.product.update({
      where: { id },
      data: {
        name: name ?? undefined,
        description: description ?? undefined,
        price: price ?? undefined,
        categoryId: categoryId ?? undefined,
        stock: stock !== undefined ? Number(stock) : undefined,
        featured: featured !== undefined ? Boolean(featured) : undefined,
        status: status ?? undefined,
        publishedAt: publishedAt ?? undefined
      },
      include: { 
        images: true, 
        variants: true,
        category: {
          select: { id: true, name: true, description: true }
        }
      }
    });

    return res.json({ success: true, data: updated });
  } catch (err: any) {
    if (err.code === 'P2003') {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid categoryId - category does not exist' 
      });
    }
    return res.status(500).json({ success: false, error: 'Failed to update product', message: err.message });
  }
};

// DELETE /api/products/:id
export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Prevent deleting if referenced by order items
    const refs = await prisma.orderItem.count({ where: { productId: id } });
    if (refs > 0) {
      return res.status(400).json({ success: false, error: 'product is referenced by orders' });
    }

    // Clean up cart items then delete
    await prisma.cartItem.deleteMany({ where: { productId: id } });
    await prisma.product.delete({ where: { id } });

    return res.json({ success: true, message: 'product deleted' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Failed to delete product', message: err.message });
  }
};