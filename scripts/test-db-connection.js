require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testConnection() {
  console.log('Testing MySQL Database connection...');
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@') : 'NOT_SET');

  try {
    await prisma.$connect();
    console.log('✅ Successfully connected to MySQL database!');

    const [adminCount, blogCount, jobCount, inqCount] = await Promise.all([
      prisma.admin.count(),
      prisma.blog.count(),
      prisma.jobOpening.count(),
      prisma.contactInquiry.count(),
    ]);

    console.log('📊 Current database record counts:');
    console.log(` - Admins: ${adminCount}`);
    console.log(` - Blogs: ${blogCount}`);
    console.log(` - Jobs: ${jobCount}`);
    console.log(` - Contact Inquiries: ${inqCount}`);
  } catch (error) {
    console.error('❌ Failed to connect to MySQL database:');
    console.error(error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
