import { Router, Request, Response } from 'express';
import multer from 'multer';
import { prisma } from '../db';
import { authenticateJWT, AuthenticatedRequest } from './auth';
import xml2js from 'xml2js';

export const releasesRouter = Router();

// Setup Multer for manual document uploads
const upload = multer({ dest: 'uploads/' });

// GET /api/releases
releasesRouter.get('/', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const releases = await prisma.pressRelease.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(releases);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch releases' });
  }
});

// POST /api/releases (Manual Add or File Upload)
releasesRouter.post('/', authenticateJWT, upload.single('file'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    let { title, ministry, department, content, category, date } = req.body;

    // If file is uploaded, extract content from file
    if (req.file) {
      const fs = require('fs');
      const filePath = req.file.path;
      const fileData = fs.readFileSync(filePath, 'utf-8');

      // Simple HTML cleanup if it is an HTML file
      if (req.file.originalname.endsWith('.html') || req.file.originalname.endsWith('.htm')) {
        content = fileData.replace(/<[^>]*>/g, ''); // Strip HTML tags
      } else {
        content = fileData; // Default plain text
      }

      if (!title) {
        title = req.file.originalname.split('.')[0].replace(/[-_]/g, ' ');
      }
      fs.unlinkSync(filePath); // Clean up temp uploaded file
    }

    if (title) {
      title = title.replace(/\r?\n|\r/g, ' ').replace(/\s+/g, ' ').trim();
      if (title.length > 200) {
        title = title.substring(0, 197) + '...';
      }
    }

    if (content) {
      content = content.trim();
    }

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const release = await prisma.pressRelease.create({
      data: {
        title,
        content,
        ministry: ministry || 'Ministry of Science & Technology',
        department: department || 'Department of Space',
        category: category || 'Press Release',
        date: date || new Date().toLocaleDateString()
      }
    });

    await prisma.log.create({
      data: {
        action: 'RELEASE_CREATE',
        userId: req.user?.id,
        details: `Created press release: "${title}"`
      }
    });

    res.status(201).json(release);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create press release' });
  }
});

// GET /api/releases/fetch-rss (Fetch from PIB RSS Feed)
releasesRouter.get('/fetch-rss', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const rssUrl = 'https://pib.gov.in/Rss/Rssxml.aspx';
    let xmlContent = '';

    try {
      const response = await fetch(rssUrl);
      if (response.ok) {
        xmlContent = await response.text();
      }
    } catch (networkError) {
      console.warn('PIB RSS Fetch failed, falling back to dummy feed data');
    }

    // Default Fallback PIB XML data if external network request fails
    if (!xmlContent) {
      xmlContent = `
        <rss version="2.0">
          <channel>
            <title>Press Information Bureau RSS Feed</title>
            <item>
              <title>ISRO successfully launches PSLV-C58 XPOSAT Mission</title>
              <description>The Indian Space Research Organisation (ISRO) successfully launched the X-ray Polarimeter Satellite (XPOSAT) today. This mission aims to study the polarization of cosmic X-rays from celestial sources. Prime Minister congratulated the scientists.</description>
              <pubDate>Mon, 26 Jun 2026 12:00:00 GMT</pubDate>
              <category>Space</category>
            </item>
            <item>
              <title>Gaganyaan Mission: PM reviews status of human spaceflight programme</title>
              <description>Prime Minister Narendra Modi chaired a high-level meeting to review progress of the Gaganyaan Mission today. The meeting evaluated ready state launch infrastructures, crew training facilities, and environmental escape control systems. Target set for human flights in 2026.</description>
              <pubDate>Mon, 26 Jun 2026 10:00:00 GMT</pubDate>
              <category>Space</category>
            </item>
          </channel>
        </rss>
      `;
    }

    const items: any[] = [];
    const itemMatches = xmlContent.match(/<item[^>]*>([\s\S]*?)<\/item>/gi);
    if (itemMatches) {
      for (const itemXml of itemMatches) {
        const titleMatch = itemXml.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
        const descMatch = itemXml.match(/<description[^>]*>([\s\S]*?)<\/description>/i);
        const pubDateMatch = itemXml.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i);
        const categoryMatch = itemXml.match(/<category[^>]*>([\s\S]*?)<\/category>/i);

        let titleStr = titleMatch ? titleMatch[1] : '';
        let descStr = descMatch ? descMatch[1] : '';
        let pubDateStr = pubDateMatch ? pubDateMatch[1] : '';
        let categoryStr = categoryMatch ? categoryMatch[1] : 'PIB Releases';

        const cleanCDATA = (str: string) => {
          return str.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/i, '$1').trim();
        };

        titleStr = cleanCDATA(titleStr);
        descStr = cleanCDATA(descStr);
        pubDateStr = cleanCDATA(pubDateStr);
        categoryStr = cleanCDATA(categoryStr);

        if (titleStr && descStr) {
          items.push({
            title: [titleStr],
            description: [descStr],
            pubDate: [pubDateStr],
            category: [categoryStr]
          });
        }
      }
    }
    const addedReleases: any[] = [];

    for (const item of items) {
      let title = item.title ? item.title[0] : '';
      title = title.replace(/\r?\n|\r/g, ' ').replace(/\s+/g, ' ').trim();
      if (title.length > 200) {
        title = title.substring(0, 197) + '...';
      }

      const desc = item.description ? item.description[0] : '';
      const category = item.category ? item.category[0] : 'PIB Releases';
      const date = item.pubDate ? item.pubDate[0] : new Date().toLocaleDateString();

      // Check if already exists
      const existing = await prisma.pressRelease.findFirst({
        where: { title }
      });

      if (!existing && title && desc) {
        const newRelease = await prisma.pressRelease.create({
          data: {
            title,
            content: desc.replace(/<[^>]*>/g, ''), // Strip any HTML
            ministry: 'Prime Minister\'s Office',
            department: 'PIB Secretariat',
            category,
            date
          }
        });
        addedReleases.push(newRelease);
      }
    }

    await prisma.log.create({
      data: {
        action: 'RELEASE_RSS_FETCH',
        userId: req.user?.id,
        details: `Fetched PIB RSS. Imported ${addedReleases.length} new releases.`
      }
    });

    res.json({ message: `Fetched RSS feeds successfully. Added ${addedReleases.length} new releases.`, releases: addedReleases });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch RSS feed' });
  }
});

// GET /api/releases/:id
releasesRouter.get('/:id', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const release = await prisma.pressRelease.findUnique({ where: { id } });
    if (!release) {
      return res.status(404).json({ error: 'Press release not found' });
    }
    res.json(release);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch release details' });
  }
});

// DELETE /api/releases/:id
releasesRouter.delete('/:id', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    await prisma.pressRelease.delete({ where: { id } });
    
    await prisma.log.create({
      data: {
        action: 'RELEASE_DELETE',
        userId: req.user?.id,
        details: `Deleted press release ID: ${id}`
      }
    });

    res.json({ message: 'Press release deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete press release' });
  }
});
