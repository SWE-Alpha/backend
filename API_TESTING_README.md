# Buddies Inn API Testing Guide

## Overview

This directory contains a comprehensive Postman collection and environment for testing all the Buddies Inn API endpoints.

## Files Included

- `BuddiesInn_API_Collection.postman_collection.json` - Complete API collection
- `BuddiesInn_Environment.postman_environment.json` - Environment variables

## Setup Instructions

### 1. Import into Postman

1. Open Postman
2. Click "Import" button
3. Upload both JSON files:
   - `BuddiesInn_API_Collection.postman_collection.json`
   - `BuddiesInn_Environment.postman_environment.json`

### 2. Select Environment

1. In Postman, select "Buddies Inn Environment" from the environment dropdown
2. Update the `BASE_URL` if your server runs on a different port

### 3. Start Your Server

```bash
npm run dev
```

## API Endpoints Overview

### 🏥 Health Check

- **GET** `/` - Root endpoint
- **GET** `/api/health` - Health check with system info
- **GET** `/api/test` - Test route

### 🔐 Authentication

- **POST** `/api/auth/register` - Register new user
- **POST** `/api/auth/login` - Login user
- **GET** `/api/auth/me` - Get current user profile

### 📂 Categories

- **GET** `/api/categories` - Get all categories
- **GET** `/api/categories/:id` - Get category by ID
- **POST** `/api/categories` - Create category (Auth required)
- **PUT** `/api/categories/:id` - Update category (Auth required)
- **DELETE** `/api/categories/:id` - Delete category (Auth required)

### 📦 Products

- **GET** `/api/products` - Get all products with filtering
- **GET** `/api/products/:id` - Get product by ID
- **POST** `/api/products` - Create product (Auth required)
- **PUT** `/api/products/:id` - Update product (Auth required)
- **DELETE** `/api/products/:id` - Delete product (Auth required)

### 🛒 Shopping Cart

- **GET** `/api/cart` - Get user's cart (Auth required)
- **POST** `/api/cart/items` - Add item to cart (Auth required)
- **PUT** `/api/cart/items/:itemId` - Update cart item (Auth required)
- **DELETE** `/api/cart/items/:itemId` - Remove cart item (Auth required)
- **DELETE** `/api/cart` - Clear entire cart (Auth required)

### 📋 Orders

- **POST** `/api/orders` - Create order from cart (Auth required)
- **GET** `/api/orders` - Get user's orders (Auth required)
- **GET** `/api/orders/:id` - Get order by ID (Auth required)

### ⭐ Reviews

- **GET** `/api/products/:productId/reviews` - Get product reviews
- **POST** `/api/products/:productId/reviews` - Create review (Auth required)
- **DELETE** `/api/reviews/:id` - Delete review (Auth required)

## Testing Workflow

### Step 1: Authentication

1. **Register a new user** using the "Register User" request
   - The auth token will be automatically saved to environment variables
2. Or **Login** with existing credentials
3. The token is automatically used for subsequent authenticated requests

### Step 2: Create Test Data

1. **Create categories** first (required for products)
2. **Create products** using the category IDs
3. Save the returned IDs in environment variables for further testing

### Step 3: Test Shopping Flow

1. **Add items to cart** using product IDs
2. **Update cart items** to test quantity changes
3. **Create an order** from the cart
4. **View orders** to verify creation

### Step 4: Test Reviews

1. **Create reviews** for products you've ordered
2. **View product reviews** to see them listed
3. **Delete reviews** if needed

## Sample Data Examples

### Register User

```json
{
  "number": "+1234567890",
  "password": "password123",
  "userName": "testuser",
  "phone": "+1234567890"
}
```

### Create Category

```json
{
  "name": "Electronics",
  "description": "Electronic devices and accessories",
  "image": "https://example.com/electronics.jpg",
  "sortOrder": 1,
  "isActive": true
}
```

### Create Product

```json
{
  "name": "iPhone 15",
  "description": "Latest iPhone with advanced features",
  "price": 999.99,
  "categoryId": "your_category_id_here",
  "stock": 100,
  "featured": true,
  "status": "ACTIVE",
  "images": [
    {
      "url": "https://example.com/iphone15.jpg",
      "altText": "iPhone 15",
      "sortOrder": 0
    }
  ]
}
```

## Environment Variables

The following variables are automatically managed:

- `BASE_URL` - API base URL (default: http://localhost:3000)
- `AUTH_TOKEN` - Automatically set after login/register
- `USER_ID` - User ID for reference
- `PRODUCT_ID` - Product ID for testing
- `CATEGORY_ID` - Category ID for testing
- `CART_ITEM_ID` - Cart item ID for testing
- `ORDER_ID` - Order ID for testing
- `REVIEW_ID` - Review ID for testing

## Error Testing

The collection includes error test cases:

- **404 errors** - Non-existent routes
- **400 errors** - Invalid JSON, validation errors
- **401 errors** - Unauthorized access
- **500 errors** - Server errors

## Notes

### Updated Schema Fields

- User authentication now uses `number` field instead of `email`
- Make sure your database schema matches the updated Prisma schema

### Authentication

- All authenticated endpoints require a Bearer token
- Tokens are automatically managed by the collection
- Tokens expire after 7 days (configurable in backend)

### Database Requirements

- Ensure your PostgreSQL database is running
- Run migrations: `npx prisma migrate dev`
- Generate client: `npx prisma generate`

## Troubleshooting

### Common Issues

1. **Connection refused** - Make sure your server is running on the correct port
2. **Authentication errors** - Check if the token is valid and not expired
3. **Database errors** - Ensure PostgreSQL is running and migrations are applied
4. **Validation errors** - Check request body format matches the expected schema

### Debug Mode

Run your server in development mode to see detailed logs:

```bash
npm run dev
```

### Database Studio

Use Prisma Studio to inspect your database:

```bash
npx prisma studio
```

## Support

If you encounter any issues:

1. Check the server logs for detailed error messages
2. Verify database connection and schema
3. Ensure all required environment variables are set
4. Check that all required fields are included in request bodies
