const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Starting settings schema backfill...');
  
  const existing = await prisma.systemSettings.findFirst();
  if (!existing) {
    console.log('No SystemSettings record found. Skipping backfill.');
    return;
  }
  
  console.log('Found existing SystemSettings:', {
    id: existing.id,
    maintenance: existing.maintenance,
    maintenanceMode: existing.maintenanceMode,
    platformFeePct: existing.platformFeePct,
    platformProfitCut: existing.platformProfitCut,
    enableBulkDist: existing.enableBulkDist,
    enableBulkDistribution: existing.enableBulkDistribution,
    allowDuplicateDist: existing.allowDuplicateDist,
    allowDuplicateWeeklyPayouts: existing.allowDuplicateWeeklyPayouts
  });

  const updated = await prisma.systemSettings.update({
    where: { id: existing.id },
    data: {
      maintenanceMode: existing.maintenanceMode ?? existing.maintenance ?? false,
      platformProfitCut: existing.platformProfitCut ?? existing.platformFeePct ?? 30.00,
      enableBulkDistribution: existing.enableBulkDistribution ?? existing.enableBulkDist ?? true,
      allowDuplicateWeeklyPayouts: existing.allowDuplicateWeeklyPayouts ?? existing.allowDuplicateDist ?? false
    }
  });

  console.log('Backfill completed successfully. New canonical settings values are:', {
    maintenanceMode: updated.maintenanceMode,
    platformProfitCut: updated.platformProfitCut,
    enableBulkDistribution: updated.enableBulkDistribution,
    allowDuplicateWeeklyPayouts: updated.allowDuplicateWeeklyPayouts
  });
}

main()
  .catch(err => {
    console.error('Error executing backfill script:', err);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
