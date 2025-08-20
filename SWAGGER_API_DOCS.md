# Buddies Inn API Documentation

## 📚 Interactive Documentation

Your API now includes comprehensive Swagger documentation!

### Access the Documentation

Once your server is running, you can access the interactive API documentation at:

**🔗 [http://localhost:3000/api-docs](http://localhost:3000/api-docs)**

## 🚀 Quick Start

1. **Start your server:**

   ```bash
   npm run dev
   ```

2. **Open your browser and navigate to:**

   ```
   http://localhost:3000/api-docs
   ```

3. **Explore the API endpoints, test them directly from the browser!**

## 📋 What's Included

### 🔐 Authentication Endpoints

- **POST** `/api/auth/register` - Register new user
- **POST** `/api/auth/login` - Login user
- **GET** `/api/auth/me` - Get current user profile

### 📂 Category Management

- **GET** `/api/categories` - Get all categories
- **GET** `/api/categories/{id}` - Get category by ID
- **POST** `/api/categories` - Create category (Auth required)
- **PUT** `/api/categories/{id}` - Update category (Auth required)
- **DELETE** `/api/categories/{id}` - Delete category (Auth required)

### 📦 Product Catalog

- **GET** `/api/products` - Get products with filtering & pagination
- **GET** `/api/products/{id}` - Get product details
- **POST** `/api/products` - Create product (Auth required)
- **PUT** `/api/products/{id}` - Update product (Auth required)
- **DELETE** `/api/products/{id}` - Delete product (Auth required)

### 🛒 Shopping Cart

- **GET** `/api/cart` - Get user's cart (Auth required)
- **POST** `/api/cart/items` - Add item to cart (Auth required)
- **PUT** `/api/cart/items/{itemId}` - Update cart item (Auth required)
- **DELETE** `/api/cart/items/{itemId}` - Remove cart item (Auth required)
- **DELETE** `/api/cart` - Clear cart (Auth required)

### 📋 Order Management

- **POST** `/api/orders` - Create order from cart (Auth required)
- **GET** `/api/orders` - Get user's orders (Auth required)
- **GET** `/api/orders/{id}` - Get order details (Auth required)

### ⭐ Reviews & Ratings

- **GET** `/api/products/{productId}/reviews` - Get product reviews
- **POST** `/api/products/{productId}/reviews` - Create review (Auth required)
- **DELETE** `/api/reviews/{id}` - Delete review (Auth required)

### 🏥 Health & Status

- **GET** `/api/health` - API health check
- **GET** `/` - Server status

## 🔑 Authentication

The API uses JWT Bearer tokens for authentication.

### How to Test with Authentication:

1. **Register or Login** to get a JWT token
2. **Click "Authorize" button** in Swagger UI
3. **Enter:** `Bearer YOUR_JWT_TOKEN`
4. **Test protected endpoints!**

## 📊 Features

### ✨ Swagger UI Features:

- **Interactive Testing** - Test all endpoints directly from the browser
- **Request/Response Examples** - See example data for all endpoints
- **Authentication Testing** - Built-in auth token management
- **Schema Validation** - See required fields and data types
- **Error Response Examples** - Understand error scenarios

### 🔧 API Features:

- **Pagination** - Efficient data loading with page/limit controls
- **Filtering** - Search and filter products by multiple criteria
- **Sorting** - Flexible sorting options for product listings
- **Error Handling** - Comprehensive error responses with helpful messages
- **Security** - JWT-based authentication for protected routes
- **Validation** - Request validation with detailed error messages

## 📝 Example Usage

### Register a New User

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "number": "1234567890",
    "password": "password123",
    "userName": "John Doe"
  }'
```

### Create a Category

```bash
curl -X POST http://localhost:3000/api/categories \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Electronics",
    "description": "Electronic devices and accessories"
  }'
```

### Add Product to Cart

```bash
curl -X POST http://localhost:3000/api/cart/items \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "productId": "product_id_here",
    "quantity": 2
  }'
```

## 🛠️ Testing Workflow

1. **Start with Health Check** - Verify API is running
2. **Register/Login** - Get authentication token
3. **Create Categories** - Set up product categories
4. **Create Products** - Add products to categories
5. **Test Shopping Flow** - Add to cart, create orders
6. **Add Reviews** - Test review functionality

## 🔧 Development

### Adding New Endpoints

1. **Add Swagger documentation** to your controller functions:

   ```typescript
   /**
    * @swagger
    * /api/your-endpoint:
    *   post:
    *     summary: Your endpoint description
    *     tags: [YourTag]
    *     // ... rest of documentation
    */
   ```

2. **Restart your server** to see the new documentation

### Customizing Documentation

Edit `/config/swagger.ts` to:

- Update API information
- Add new schemas
- Modify security settings
- Add custom styling

## 🎯 Production Notes

- **Security**: Update JWT secrets and remove development tokens
- **Rate Limiting**: Consider adding rate limiting for production
- **Logging**: Implement comprehensive logging
- **Monitoring**: Add health checks and monitoring
- **Documentation**: Keep Swagger docs updated with API changes

## 🤝 Support

- **Interactive Docs**: [http://localhost:3000/api-docs](http://localhost:3000/api-docs)
- **Health Check**: [http://localhost:3000/api/health](http://localhost:3000/api/health)
- **Server Status**: [http://localhost:3000](http://localhost:3000)

---

**Happy Testing! 🚀**
