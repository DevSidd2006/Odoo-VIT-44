import prisma from '../src/config/prisma.js';

async function testConnection() {
  console.log('🚀 Starting Database Connection Test...');
  
  try {
    // 1. Test Connection
    await prisma.$connect();
    console.log('✅ Connection Successful!');

    // 2. Count Tables
    const tableCount = await prisma.$queryRaw`
      SELECT count(*) 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      AND table_name NOT LIKE '_prisma_migrations'
    `;
    console.log(`📊 Tables in Database: ${tableCount[0].count}`);

    // 3. Verify the "User" table exists
    const users = await prisma.user.count();
    console.log(`👤 Current User Count: ${users}`);

    // 4. Test a "Ping" query
    const now = await prisma.$queryRaw`SELECT NOW()`;
    console.log(`🕒 Database Server Time: ${now[0].now}`);

    console.log('\n🌟 RESULT: DATABASE IS 100% OPERATIONAL!');
  } catch (error) {
    console.error('❌ DATABASE ERROR:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
