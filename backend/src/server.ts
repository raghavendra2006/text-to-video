import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import { prisma } from './db';
import { authRouter } from './routes/auth';
import { releasesRouter } from './routes/releases';
import { pipelineRouter } from './routes/pipeline';
import { dashboardRouter } from './routes/dashboard';

const app = express();
const PORT = process.env.PORT || 5000;

// Setup Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());

// Expose uploaded and generated files as static folders
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));
app.use('/generated', express.static(path.resolve(__dirname, '../generated')));

// Register routes
app.use('/api/auth', authRouter);
app.use('/api/releases', releasesRouter);
app.use('/api/pipeline', pipelineRouter);
app.use('/api/dashboard', dashboardRouter);

// Initialize folders and seed database
async function startServer() {
  // Ensure directories exist
  const folders = [
    'uploads',
    'logs',
    'temp',
    'generated',
    'generated/images',
    'generated/audio',
    'generated/videos',
    'generated/subtitles'
  ];

  folders.forEach(folder => {
    const dir = path.resolve(__dirname, '../', folder);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  // Seed default admin account
  try {
    const adminUser = await prisma.user.findFirst({
      where: { username: 'admin' }
    });

    if (!adminUser) {
      const hashedPassword = await bcrypt.hash('admin', 10);
      await prisma.user.create({
        data: {
          username: 'admin',
          password: hashedPassword,
          role: 'ADMIN'
        }
      });
      console.log('Seeded default admin credentials successfully (admin / admin)');
    }
  } catch (dbErr) {
    console.error('Database connection / migration pending. Run Prisma migrations first.', dbErr);
  }

  app.listen(PORT, () => {
    console.log(`Backend server successfully listening on http://localhost:${PORT}`);
  });
}

startServer();
