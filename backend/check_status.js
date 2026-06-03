const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.user.findFirst().then(u => console.log('STATUS IS:', u.status)).finally(() => {
  prisma.$disconnect();
});
