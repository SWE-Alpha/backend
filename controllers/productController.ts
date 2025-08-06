import { Request, Response } from 'express';
const { prisma } = require('../utils/db');

// GET /api/products - Get all products
export const getAllProducts = async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      minPrice,
      maxPrice,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where: any = {
      status: 'ACTIVE'
    };

    if (category) {
      where.category = {
        slug: category
      };
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = Number(minPrice);
      if (maxPrice) where.price.lte = Number(maxPrice);
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const orderBy: any = {};
    orderBy[String(sortBy)] = sortOrder;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          category: true,
          images: true
        }
      }),
      prisma.product.count({ where })
    ]);

    const totalPages = Math.ceil(total / take);

    return res.status(200).json({
      success: true,
      data: products,
      pagination: {
        currentPage: Number(page),
        totalPages,
        totalItems: total,
        itemsPerPage: take,
        hasNextPage: Number(page) < totalPages,
        hasPrevPage: Number(page) > 1
      }
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch products',
      message: (error as Error).message
    });
  }
};

// GET /api/products/:id - Get single product
export const getProductById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        images: true,
        variants: true,
        reviews: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                avatar: true
              }
            }
          },
          where: {
            status: 'APPROVED'
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found',
        message: 'The requested product does not exist'
      });
    }

    const avgRating =
      product.reviews.length > 0
        ? product.reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / product.reviews.length
        : 0;

    return res.status(200).json({
      success: true,
      data: {
        ...product,
        avgRating: Math.round(avgRating * 10) / 10,
        reviewCount: product.reviews.length
      }
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch product',
      message: (error as Error).message
    });
  }
};

// POST /api/products - Create product (Admin)
export const createProduct = async (req: Request, res: Response) => {
  try {
    const {
      name,
      description,
      price,
      comparePrice,
      sku,
      barcode,
      stock,
      lowStockThreshold,
      trackQuantity,
      categoryId,
      brand,
      tags,
      slug,
      metaTitle,
      metaDescription,
      featured,
      status,
      images,
      variants
    } = req.body;

    if (!name || !description || !price || !categoryId || !sku || !slug) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Name, description, price, categoryId, sku, and slug are required'
      });
    }


    const existingProduct = await prisma.product.findFirst({
      where: {
        OR: [
          { sku },
          { slug }
        ]
      }
    });

    if (existingProduct) {
      return res.status(400).json({
        success: false,
        error: 'Duplicate Entry',
        message: 'A product with this SKU or slug already exists'
      });
    }

    const product = await prisma.product.create({
      data: {
        name,
        description,
        price,
        comparePrice,
        sku,
        barcode,
        stock: stock || 0,
        lowStockThreshold: lowStockThreshold || 10,
        trackQuantity: trackQuantity !== false,
        categoryId,
        brand,
        tags: tags || [],
        slug,
        metaTitle,
        metaDescription,
        featured: featured || false,
        status: status || 'DRAFT',
        publishedAt: status === 'ACTIVE' ? new Date() : null,
        images: images ? {
          create: images.map((img: any, index: number) => ({
            url: img.url,
            altText: img.altText || name,
            sortOrder: index
          }))
        } : undefined,
        variants: variants ? {
          create: variants.map((variant: any) => ({
            name: variant.name,
            value: variant.value,
            price: variant.price,
            stock: variant.stock,
            sku: variant.sku
          }))
        } : undefined
      },
      include: {
        category: true,
        images: true,
        variants: true
      }
    });

    return res.status(201).json({
      success: true,
      data: product,
      message: 'Product created successfully'
    });

  } catch (error) {
    console.error('Error creating product:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create product',
      message: (error as Error).message
    });
  }
};
