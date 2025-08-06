const { PrismaClient } = require('../generated/prisma');

// Create a single Prisma Client instance
const prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
    errorFormat: 'pretty',
});

// Connection test function
const testConnection = async () => {
    try {
        await prisma.$connect();
        console.log('✅ Database connected successfully');

        // Test database with a simple query
        const result = await prisma.$queryRaw`SELECT version()`;
        console.log('📊 Database version:', result[0]?.version);

        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', (error as Error).message);
        return false;
    }
};

// Graceful shutdown function
const disconnectDB = async () => {
    try {
        await prisma.$disconnect();
        console.log('🔌 Database disconnected');
    } catch (error) {
        console.error('❌ Error disconnecting from database:', (error as Error).message);
    }
};

// Handle process termination
process.on('SIGINT', async () => {
    console.log('\n🛑 Received SIGINT, shutting down gracefully...');
    await disconnectDB();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
    await disconnectDB();
    process.exit(0);
});

module.exports = {
    prisma,
    testConnection,
    disconnectDB
};