import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Buddies Inn API',
      version: '1.0.0',
      description: 'A comprehensive e-commerce API for the Buddies Inn platform',
      contact: {
        name: 'SWE-Alpha Team',
        email: 'support@buddiesinn.com',
      },
      license: {
        name: 'ISC',
        url: 'https://opensource.org/licenses/ISC',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Unique user identifier',
            },
            number: {
              type: 'string',
              description: 'User phone number',
            },
            userName: {
              type: 'string',
              description: 'User display name',
            },
            phone: {
              type: 'string',
              description: 'User phone number',
            },
            role: {
              type: 'string',
              enum: ['CUSTOMER', 'ADMIN', 'SUPER_ADMIN'],
              description: 'User role',
            },
            isActive: {
              type: 'boolean',
              description: 'Whether user is active',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'User creation timestamp',
            },
          },
        },
        Category: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Unique category identifier',
            },
            name: {
              type: 'string',
              description: 'Category name',
            },
            description: {
              type: 'string',
              description: 'Category description',
            },
            image: {
              type: 'string',
              description: 'Category image URL',
            },
            sortOrder: {
              type: 'integer',
              description: 'Sort order for display',
            },
            isActive: {
              type: 'boolean',
              description: 'Whether category is active',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Category creation timestamp',
            },
          },
        },
        Product: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Unique product identifier',
            },
            name: {
              type: 'string',
              description: 'Product name',
            },
            description: {
              type: 'string',
              description: 'Product description',
            },
            price: {
              type: 'number',
              format: 'decimal',
              description: 'Product price',
            },
            stock: {
              type: 'integer',
              description: 'Available stock quantity',
            },
            featured: {
              type: 'boolean',
              description: 'Whether product is featured',
            },
            status: {
              type: 'string',
              enum: ['DRAFT', 'ACTIVE', 'ARCHIVED', 'OUT_OF_STOCK'],
              description: 'Product status',
            },
            categoryId: {
              type: 'string',
              description: 'Category identifier',
            },
            category: {
              $ref: '#/components/schemas/Category',
            },
            images: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/ProductImage',
              },
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Product creation timestamp',
            },
          },
        },
        ProductImage: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Unique image identifier',
            },
            url: {
              type: 'string',
              description: 'Image URL',
            },
            altText: {
              type: 'string',
              description: 'Alternative text for image',
            },
            sortOrder: {
              type: 'integer',
              description: 'Sort order for display',
            },
          },
        },
        Cart: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Unique cart identifier',
            },
            userId: {
              type: 'string',
              description: 'User identifier',
            },
            subtotal: {
              type: 'number',
              format: 'decimal',
              description: 'Cart subtotal',
            },
            items: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/CartItem',
              },
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Cart creation timestamp',
            },
          },
        },
        CartItem: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Unique cart item identifier',
            },
            productId: {
              type: 'string',
              description: 'Product identifier',
            },
            quantity: {
              type: 'integer',
              description: 'Item quantity',
            },
            price: {
              type: 'number',
              format: 'decimal',
              description: 'Item price',
            },
            product: {
              $ref: '#/components/schemas/Product',
            },
          },
        },
        Order: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Unique order identifier',
            },
            orderNumber: {
              type: 'string',
              description: 'Human-readable order number',
            },
            userId: {
              type: 'string',
              description: 'User identifier',
            },
            customerName: {
              type: 'string',
              description: 'Customer name',
            },
            status: {
              type: 'string',
              enum: ['NEW', 'IN_PROGRESS', 'FULFILLED', 'CANCELLED', 'REFUNDED'],
              description: 'Order status',
            },
            subtotal: {
              type: 'number',
              format: 'decimal',
              description: 'Order subtotal',
            },
            tax: {
              type: 'number',
              format: 'decimal',
              description: 'Tax amount',
            },
            shipping: {
              type: 'number',
              format: 'decimal',
              description: 'Shipping cost',
            },
            total: {
              type: 'number',
              format: 'decimal',
              description: 'Order total',
            },
            paymentStatus: {
              type: 'string',
              enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED'],
              description: 'Payment status',
            },
            items: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/OrderItem',
              },
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Order creation timestamp',
            },
          },
        },
        OrderItem: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Unique order item identifier',
            },
            productId: {
              type: 'string',
              description: 'Product identifier',
            },
            name: {
              type: 'string',
              description: 'Product name at time of order',
            },
            quantity: {
              type: 'integer',
              description: 'Item quantity',
            },
            price: {
              type: 'number',
              format: 'decimal',
              description: 'Item price at time of order',
            },
            total: {
              type: 'number',
              format: 'decimal',
              description: 'Line item total',
            },
          },
        },
        Review: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Unique review identifier',
            },
            userId: {
              type: 'string',
              description: 'User identifier',
            },
            productId: {
              type: 'string',
              description: 'Product identifier',
            },
            rating: {
              type: 'integer',
              minimum: 1,
              maximum: 5,
              description: 'Review rating (1-5)',
            },
            title: {
              type: 'string',
              description: 'Review title',
            },
            comment: {
              type: 'string',
              description: 'Review comment',
            },
            verified: {
              type: 'boolean',
              description: 'Whether review is verified',
            },
            status: {
              type: 'string',
              enum: ['PENDING', 'APPROVED', 'REJECTED'],
              description: 'Review status',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Review creation timestamp',
            },
          },
        },
        ApiResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: 'Whether the request was successful',
            },
            data: {
              type: 'object',
              description: 'Response data',
            },
            error: {
              type: 'string',
              description: 'Error message if request failed',
            },
            message: {
              type: 'string',
              description: 'Additional message',
            },
          },
        },
        PaginationResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: 'Whether the request was successful',
            },
            data: {
              type: 'array',
              items: {
                type: 'object',
              },
              description: 'Array of items',
            },
            pagination: {
              type: 'object',
              properties: {
                currentPage: {
                  type: 'integer',
                  description: 'Current page number',
                },
                itemsPerPage: {
                  type: 'integer',
                  description: 'Items per page',
                },
                totalItems: {
                  type: 'integer',
                  description: 'Total number of items',
                },
                totalPages: {
                  type: 'integer',
                  description: 'Total number of pages',
                },
              },
            },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
              description: 'Whether the request was successful',
            },
            error: {
              type: 'string',
              description: 'Error message',
            },
            message: {
              type: 'string',
              description: 'Detailed error message',
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: [
    './routes/api/*.ts',
    './controllers/*.ts',
    './routes/*.ts',
  ],
};

const specs = swaggerJsdoc(options);

export { specs, swaggerUi };
