import { Request, Response } from 'express';
const { prisma } = require('../utils/db');

// GET /api/products
export const getAllProducts = async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      status,
      featured
    } = req.query as any;

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(Math.max(1, Number(limit)), 100);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (status && ['DRAFT', 'ACTIVE', 'ARCHIVED', 'OUT_OF_STOCK'].includes(String(status))) {
      where.status = status;
    }
    if (featured !== undefined) {
      const f = String(featured).toLowerCase();
      where.featured = f === 'true' || f === '1';
    }
    if (search && String(search).trim() !== '') {
      const q = String(search).trim();
      where.OR = [{ name: { contains: q, mode: 'insensitive' } }, { description: { contains: q, mode: 'insensitive' } }];
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
        include: { images: true, variants: true }
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

// GET /api/products/:id
export const getProductById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: { images: true, variants: true }
    });
    if (!product) return res.status(404).json({ success: false, error: 'product not found' });

    return res.json({ success: true, data: product });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Failed to fetch product', message: err.message });
  }
};

// POST /api/products
export const createProduct = async (req: Request, res: Response) => {
  try {
    const { name, description, price, stock = 0, featured = false, status = 'DRAFT', images = [], variants = [] } = req.body || {};
    if (!name || !description || price === undefined) {
      return res.status(400).json({ success: false, error: 'name, description, and price are required' });
    }

    const product = await prisma.product.create({
      data: {
        name,
        description,
        price,
        stock: Number(stock) || 0,
        featured: Boolean(featured),
        status,
        images: images?.length
          ? { create: images.map((img: any) => ({ url: img.url, altText: img.altText ?? null, sortOrder: img.sortOrder ?? 0 })) }
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
      include: { images: true, variants: true }
    });

    return res.status(201).json({ success: true, data: product });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Failed to create product', message: err.message });
  }
};

// PUT /api/products/:id
export const updateProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, price, stock, featured, status, publishedAt } = req.body || {};

    const exists = await prisma.product.findUnique({ where: { id } });
    if (!exists) return res.status(404).json({ success: false, error: 'product not found' });

    const updated = await prisma.product.update({
      where: { id },
      data: {
        name: name ?? undefined,
        description: description ?? undefined,
        price: price ?? undefined,
        stock: stock !== undefined ? Number(stock) : undefined,
        featured: featured !== undefined ? Boolean(featured) : undefined,
        status: status ?? undefined,
        publishedAt: publishedAt ?? undefined
      },
      include: { images: true, variants: true }
    });

    return res.json({ success: true, data: updated });
  } catch (err: any) {
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