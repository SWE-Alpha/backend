import { Request, Response } from 'express';
const { prisma } = require('../utils/db');

// GET /api/categories
export const getCategories = async (req: Request, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: { products: true }
        }
      }
    });
    return res.json({ success: true, data: categories });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Failed to fetch categories', message: err.message });
  }
};

// GET /api/categories/:id
export const getCategoryById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const category = await prisma.category.findUnique({
      where: { id },
      include: { 
        products: {
          where: { status: 'ACTIVE' },
          include: { images: true }
        },
        _count: {
          select: { products: true }
        }
      }
    });
    if (!category) return res.status(404).json({ success: false, error: 'Category not found' });
    return res.json({ success: true, data: category });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Failed to fetch category', message: err.message });
  }
};

// POST /api/categories
export const createCategory = async (req: Request, res: Response) => {
  try {
    const { name, description, image, sortOrder = 0, isActive = true } = req.body;
    if (!name) return res.status(400).json({ success: false, error: 'Name is required' });
    const category = await prisma.category.create({
      data: { name, description, image, sortOrder, isActive }
    });
    return res.status(201).json({ success: true, data: category });
  } catch (err: any) {
    if (err.code === 'P2002') {
      return res.status(400).json({ success: false, error: 'Category name must be unique' });
    }
    return res.status(500).json({ success: false, error: 'Failed to create category', message: err.message });
  }
};

// PUT /api/categories/:id
export const updateCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, image, sortOrder, isActive } = req.body;
    const category = await prisma.category.update({
      where: { id },
      data: { name, description, image, sortOrder, isActive }
    });
    return res.json({ success: true, data: category });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Failed to update category', message: err.message });
  }
};

// DELETE /api/categories/:id
export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Check if category has products
    const productCount = await prisma.product.count({ where: { categoryId: id } });
    if (productCount > 0) {
      return res.status(400).json({ 
        success: false, 
        error: `Cannot delete category with ${productCount} products. Remove products first.` 
      });
    }
    
    await prisma.category.delete({ where: { id } });
    return res.json({ success: true, message: 'Category deleted' });
  } catch (err: any) {
    if (err.code === 'P2025') {
      return res.status(404).json({ success: false, error: 'Category not found' });
    }
    return res.status(500).json({ success: false, error: 'Failed to delete category', message: err.message });
  }
};