import { Request, Response } from 'express';
const { prisma } = require('../utils/db');

type AuthedRequest = Request & { user?: { id: string } };

const includeCart = {
  items: {
    include: {
      product: {
        select: { 
          id: true, 
          name: true, 
          price: true, 
          stock: true, 
          featured: true, 
          status: true,
          category: {
            select: { id: true, name: true, description: true }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' as const }
  }
};

async function ensureCart(userId: string) {
  console.log('🔍 Ensuring cart exists for user:', userId);
  let cart = await prisma.cart.findUnique({ where: { userId } });
  if (!cart) {
    console.log('🆕 Creating new cart for user:', userId);
    cart = await prisma.cart.create({ data: { userId } });
    console.log('✅ Cart created:', cart.id);
  } else {
    console.log('✅ Found existing cart:', cart.id);
  }
  return cart;
}

async function recalcCart(cartId: string) {
  console.log('🧮 Recalculating cart totals for cart:', cartId);
  const items = await prisma.cartItem.findMany({ where: { cartId } });
  console.log('📦 Found cart items:', items.length);
  const subtotalNum = items.reduce((acc: number, it: { price: any; quantity: number }) => acc + Number(it.price) * it.quantity, 0);
  console.log('💰 Calculated subtotal:', subtotalNum);
  await prisma.cart.update({ where: { id: cartId }, data: { subtotal: subtotalNum } });
  return prisma.cart.findUnique({ where: { id: cartId }, include: includeCart });
}

// GET /api/cart
export const getCart = async (req: AuthedRequest, res: Response) => {
  console.log('\n🛒 === GET CART REQUEST ===');
  console.log('📥 Request headers:', req.headers.authorization ? 'Bearer token present' : 'No auth header');
  
  try {
    const userId = req.user?.id;
    console.log('👤 User ID from token:', userId);
    
    if (!userId) {
      console.log('❌ No user ID found - unauthorized');
      return res.status(401).json({ success: false, error: 'unauthorized' });
    }

    const cart = await ensureCart(userId);
    const full = await prisma.cart.findUnique({ where: { id: cart.id }, include: includeCart });
    console.log('✅ Returning cart data:', { cartId: full?.id, itemCount: full?.items?.length || 0 });
    
    return res.json({ success: true, data: full });
  } catch (err: any) {
    console.error('❌ Error in getCart:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to get cart', message: err.message });
  }
};

// POST /api/cart/items
export const addItem = async (req: AuthedRequest, res: Response) => {
  console.log('\n🛒 === ADD ITEM TO CART REQUEST ===');
  console.log('📥 Request body:', req.body);
  console.log('📥 Request headers auth:', req.headers.authorization ? 'Bearer token present' : 'No auth header');
  console.log('📥 Request params:', req.headers.authorization);
  console.log('📥 Request user:', req.user ? `User ID ${req.user.id}` : 'No user in request');
  
  try {
    const userId = req.user?.id;
    console.log('👤 User ID from token:', userId);
    
    if (!userId) {
      console.log('❌ No user ID found - unauthorized');
      return res.status(401).json({ success: false, error: 'unauthorized' });
    }

    const { productId, quantity = 1 } = req.body || {};
    const qty = Math.max(1, Number(quantity || 1));
    console.log('📦 Product details:', { productId, requestedQuantity: quantity, finalQuantity: qty });
    
    if (!productId) {
      console.log('❌ No productId provided');
      return res.status(400).json({ success: false, error: 'productId required' });
    }

    console.log('🔍 Looking up product:', productId);
    const product = await prisma.product.findUnique({ where: { id: productId } });
    
    if (!product) {
      console.log('❌ Product not found:', productId);
      return res.status(404).json({ success: false, error: 'product not found' });
    }
    
    console.log('✅ Product found:', { id: product.id, name: product.name, status: product.status, stock: product.stock });
    
    if (product.status !== 'ACTIVE') {
      console.log('❌ Product not active:', product.status);
      return res.status(400).json({ success: false, error: 'product not active' });
    }
    
    if (product.stock !== null && product.stock < qty) {
      console.log('❌ Insufficient stock:', { available: product.stock, requested: qty });
      return res.status(400).json({ success: false, error: 'insufficient stock' });
    }

    const cart = await ensureCart(userId);

    console.log('🔍 Checking for existing cart item...');
    const existing = await prisma.cartItem.findUnique({
      where: { cartId_productId: { cartId: cart.id, productId } }
    });

    const price = product.price;
    console.log('💰 Product price:', price);
    
    if (existing) {
      console.log('📦 Found existing cart item:', { id: existing.id, currentQuantity: existing.quantity });
      const newQty = existing.quantity + qty;
      console.log('🔄 Updating quantity to:', newQty);
      
      if (product.stock !== null && product.stock < newQty) {
        console.log('❌ Insufficient stock for total quantity:', { available: product.stock, requested: newQty });
        return res.status(400).json({ success: false, error: 'insufficient stock' });
      }
      
      await prisma.cartItem.update({ where: { id: existing.id }, data: { quantity: newQty, price } });
      console.log('✅ Cart item updated');
    } else {
      console.log('🆕 Creating new cart item');
      await prisma.cartItem.create({ data: { cartId: cart.id, productId, quantity: qty, price } });
      console.log('✅ New cart item created');
    }

    const updated = await recalcCart(cart.id);
    console.log('✅ Cart updated successfully');
    
    return res.status(200).json({ success: true, data: updated, message: 'item added' });
  } catch (err: any) {
    console.error('❌ Error in addItem:', err.message);
    console.error('❌ Error stack:', err.stack);
    return res.status(500).json({ success: false, error: 'Failed to add item', message: err.message });
  }
};

// PUT /api/cart/items/:itemId
export const updateItem = async (req: AuthedRequest, res: Response) => {
  console.log('\n🛒 === UPDATE CART ITEM REQUEST ===');
  console.log('📥 Request params:', req.params);
  console.log('📥 Request body:', req.body);
  
  try {
    const userId = req.user?.id;
    console.log('👤 User ID from token:', userId);
    
    if (!userId) {
      console.log('❌ No user ID found - unauthorized');
      return res.status(401).json({ success: false, error: 'unauthorized' });
    }

    const { itemId } = req.params;
    const { quantity } = req.body || {};
    const qty = Number(quantity);
    console.log('📦 Update details:', { itemId, quantity, parsedQuantity: qty });
    
    if (!itemId || !qty || qty < 1) {
      console.log('❌ Invalid quantity or itemId');
      return res.status(400).json({ success: false, error: 'valid quantity required' });
    }

    console.log('🔍 Looking up cart item:', itemId);
    const item = await prisma.cartItem.findUnique({ where: { id: itemId }, include: { cart: true, product: true } });
    
    if (!item || item.cart.userId !== userId) {
      console.log('❌ Cart item not found or unauthorized:', { found: !!item, userMatch: item?.cart.userId === userId });
      return res.status(404).json({ success: false, error: 'cart item not found' });
    }
    
    console.log('✅ Cart item found:', { id: item.id, currentQuantity: item.quantity, productStock: item.product.stock });
    
    if (item.product.stock !== null && item.product.stock < qty) {
      console.log('❌ Insufficient stock for update:', { available: item.product.stock, requested: qty });
      return res.status(400).json({ success: false, error: 'insufficient stock' });
    }

    console.log('🔄 Updating cart item quantity');
    await prisma.cartItem.update({ where: { id: itemId }, data: { quantity: qty } });
    
    const updated = await recalcCart(item.cartId);
    console.log('✅ Cart item updated successfully');
    
    return res.json({ success: true, data: updated, message: 'item updated' });
  } catch (err: any) {
    console.error('❌ Error in updateItem:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to update item', message: err.message });
  }
};

// DELETE /api/cart/items/:itemId
export const removeItem = async (req: AuthedRequest, res: Response) => {
  console.log('\n🛒 === REMOVE CART ITEM REQUEST ===');
  console.log('📥 Request params:', req.params);
  
  try {
    const userId = req.user?.id;
    console.log('👤 User ID from token:', userId);
    
    if (!userId) {
      console.log('❌ No user ID found - unauthorized');
      return res.status(401).json({ success: false, error: 'unauthorized' });
    }

    const { itemId } = req.params;
    console.log('🗑️ Removing item:', itemId);
    
    const item = await prisma.cartItem.findUnique({ where: { id: itemId }, include: { cart: true } });
    
    if (!item || item.cart.userId !== userId) {
      console.log('❌ Cart item not found or unauthorized:', { found: !!item, userMatch: item?.cart.userId === userId });
      return res.status(404).json({ success: false, error: 'cart item not found' });
    }

    console.log('🗑️ Deleting cart item');
    await prisma.cartItem.delete({ where: { id: itemId } });
    
    const updated = await recalcCart(item.cartId);
    console.log('✅ Cart item removed successfully');
    
    return res.json({ success: true, data: updated, message: 'item removed' });
  } catch (err: any) {
    console.error('❌ Error in removeItem:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to remove item', message: err.message });
  }
};

// DELETE /api/cart
export const clearCart = async (req: AuthedRequest, res: Response) => {
  console.log('\n🛒 === CLEAR CART REQUEST ===');
  
  try {
    const userId = req.user?.id;
    console.log('👤 User ID from token:', userId);
    
    if (!userId) {
      console.log('❌ No user ID found - unauthorized');
      return res.status(401).json({ success: false, error: 'unauthorized' });
    }

    const cart = await ensureCart(userId);
    console.log('🧹 Clearing all items from cart:', cart.id);
    
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    const updated = await recalcCart(cart.id);
    console.log('✅ Cart cleared successfully');
    
    return res.json({ success: true, data: updated, message: 'cart cleared' });
  } catch (err: any) {
    console.error('❌ Error in clearCart:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to clear cart', message: err.message });
  }
};
