import { Router, Request, Response } from 'express';
import { prisma } from '../db';
import { authenticateJWT, AuthenticatedRequest } from './auth';
import fs from 'fs';
import path from 'path';

export const dashboardRouter = Router();

// Helper function to recursively get folder size
function getFolderSize(dirPath: string): number {
  let size = 0;
  try {
    if (!fs.existsSync(dirPath)) return 0;
    const files = fs.readdirSync(dirPath);
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stats = fs.statSync(filePath);
      if (stats.isDirectory()) {
        size += getFolderSize(filePath);
      } else {
        size += stats.size;
      }
    }
  } catch (err) {
    console.error('Error reading folder size:', err);
  }
  return size;
}

// GET /api/dashboard
dashboardRouter.get('/', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const pressReleasesCount = await prisma.pressRelease.count();
    const generatedVideosCount = await prisma.video.count({
      where: { status: 'COMPLETED' }
    });
    const activeQueueCount = await prisma.video.count({
      where: { status: { in: ['PENDING', 'PROCESSING'] } }
    });

    // Storage Usage
    const generatedPath = path.resolve(__dirname, '../../generated');
    const storageBytes = getFolderSize(generatedPath);
    const storageMb = parseFloat((storageBytes / (1024 * 1024)).toFixed(2));

    // Recent releases and videos
    const recentReleases = await prisma.pressRelease.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    const recentVideos = await prisma.video.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    // Languages breakdown
    const videos = await prisma.video.findMany({
      where: { status: 'COMPLETED' },
      select: { language: true }
    });

    const languageBreakdown: { [key: string]: number } = {};
    for (const v of videos) {
      languageBreakdown[v.language] = (languageBreakdown[v.language] || 0) + 1;
    }

    // Recent Logs
    const recentLogs = await prisma.log.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    // AI API usages (simulated estimation or based on generated scenes count)
    const totalScenes = await prisma.scene.count();
    const aiTokensEstimate = totalScenes * 1250; 

    res.json({
      pressReleasesCount,
      generatedVideosCount,
      activeQueueCount,
      storageMb,
      recentReleases,
      recentVideos,
      languageBreakdown,
      recentLogs,
      aiUsage: {
        tokensUsed: aiTokensEstimate,
        apiCostEstimate: parseFloat((aiTokensEstimate * 0.000002).toFixed(4))
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch dashboard stats' });
  }
});
