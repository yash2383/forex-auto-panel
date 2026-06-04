import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const broadcasts = await prisma.notificationBroadcast.findMany({
    include: {
      channels: true,
      execution: true,
    },
  });
  console.log(JSON.stringify(broadcasts, null, 2));
}

main()
  .catch(e => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
