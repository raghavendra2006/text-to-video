import { prisma } from './db';

async function check() {
  console.log("=== Last 15 logs ===");
  const logs = await prisma.log.findMany({
    orderBy: { createdAt: 'desc' },
    take: 15
  });
  console.log(logs.map(l => `[${l.createdAt.toISOString()}] ${l.action}: ${l.details}`));

  console.log("\n=== Latest Videos ===");
  const videos = await prisma.video.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  console.log(videos);
}

check().catch(console.error).finally(() => prisma.$disconnect());
