import { prisma } from './db';

async function main() {
  console.log("Cleaning up long/corrupted press releases...");
  
  // Find scripts to delete
  const scriptsToDelete = await prisma.script.findMany({
    where: {
      title: {
        contains: "AI Prompt"
      }
    },
    select: { id: true }
  });
  const scriptIds = scriptsToDelete.map(s => s.id);

  // Delete associated scenes
  const deletedScenes = await prisma.scene.deleteMany({
    where: {
      scriptId: {
        in: scriptIds
      }
    }
  });
  console.log("Deleted scenes:", deletedScenes.count);

  // Delete scripts
  const deletedScripts = await prisma.script.deleteMany({
    where: {
      title: {
        contains: "AI Prompt"
      }
    }
  });
  console.log("Deleted scripts:", deletedScripts.count);

  // Delete press releases
  const deletedReleases = await prisma.pressRelease.deleteMany({
    where: {
      title: {
        contains: "AI Prompt"
      }
    }
  });
  console.log("Deleted press releases:", deletedReleases.count);
  
  const allReleases = await prisma.pressRelease.findMany();
  console.log("Current press releases in DB:", allReleases.map(r => ({ id: r.id, title: r.title })));
}

main().catch(console.error).finally(() => prisma.$disconnect());
