import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Sending test notification to Sam...');
  const res = await fetch('http://localhost:4000/api/dev/test-notification', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      event: 'PAYMENT_APPROVED',
      payload: { amount: '1500' },
      userId: '10c873d5-5b6c-4566-94f1-5ab92edf92e7',
    }),
  });

  const responseJson = await res.json();
  console.log('API Response:', responseJson);

  console.log('Waiting 3 seconds for Bull queue to process async channels...');
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Query database for the created notification and its deliveries
  const notificationId = responseJson.id;
  const deliveries = await prisma.notificationDelivery.findMany({
    where: { notificationId },
  });

  console.log('--- DELIVERIES FOR NOTIFICATION ---');
  console.log(deliveries.map(d => ({
    id: d.id,
    channel: d.channel,
    status: d.status,
    retryCount: d.retryCount,
    error: d.error,
  })));
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
