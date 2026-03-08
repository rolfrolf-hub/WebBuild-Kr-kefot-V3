import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { ProjectStateSchema } from './schema.ts';
import dotenv from 'dotenv';
import helmet from 'helmet';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3015;

// Security Middleware - Relaxed for local development preview
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: false
}));
app.use(cors({
    origin: '*', // Allow all for local dev
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type']
}));
app.use(express.json({ limit: '50mb' }));

// Paths
const BACKUPS_DIR = path.resolve(__dirname, '../backups_hard_copy');
const DATA_DIR = path.resolve(__dirname, '../src/data');
const DEFAULTS_PATH = path.join(DATA_DIR, 'projectDefaults.json');

// Ensure directories exist
async function ensureDirs() {
    try {
        await fs.access(BACKUPS_DIR);
    } catch {
        await fs.mkdir(BACKUPS_DIR, { recursive: true });
    }
    try {
        await fs.access(DATA_DIR);
    } catch {
        await fs.mkdir(DATA_DIR, { recursive: true });
    }
}

// Helper: Create Backup
async function createBackup(sourcePath: string): Promise<string | null> {
    const timestamp = Date.now();
    const backupFilename = `projectDefaults.json.backup.${timestamp}`;
    const backupPath = path.join(BACKUPS_DIR, backupFilename);

    try {
        await fs.copyFile(sourcePath, backupPath);

        // Cleanup old backups (Keep last 10)
        const files = await fs.readdir(BACKUPS_DIR);
        const backups = files
            .filter(f => f.startsWith('projectDefaults.json.backup.'))
            .sort() // Sorts naturally by timestamp if format is consistent
            .reverse(); // Newest first

        for (let i = 10; i < backups.length; i++) {
            await fs.unlink(path.join(BACKUPS_DIR, backups[i]));
        }

        return backupFilename;
    } catch (error) {
        console.warn('Backup warning (first run?):', error);
        return null;
    }
}

// API: Health Check
app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', version: '2.6.0', env: process.env.NODE_ENV });
});

// API: Serve media_manager.php for deployment
app.get('/api/media-manager-php', async (_req: Request, res: Response) => {
    try {
        const phpPath = path.resolve(__dirname, '../server-scripts/media_manager.php');
        const content = await fs.readFile(phpPath, 'utf-8');
        res.setHeader('Content-Type', 'application/x-php');
        res.setHeader('Content-Disposition', 'attachment; filename="media_manager.php"');
        res.send(content);
    } catch (error) {
        res.status(500).json({ error: 'Could not read media_manager.php' });
    }
});

// API: List Backups
app.get('/api/backups', async (_req: Request, res: Response) => {
    try {
        const files = await fs.readdir(BACKUPS_DIR);
        const backups = files
            .filter(f => f.startsWith('projectDefaults.json.backup.'))
            .map(f => {
                const parts = f.split('.');
                const timestamp = parseInt(parts[parts.length - 1]);
                return {
                    filename: f,
                    timestamp,
                    date: new Date(timestamp).toISOString()
                };
            })
            .sort((a, b) => b.timestamp - a.timestamp);

        res.json({ backups });
    } catch (error: any) {
        console.error('List backups error:', error);
        res.status(500).json({ error: 'Failed to list backups' });
    }
});

// API: Restore Backup
app.post('/api/restore-backup', async (req: Request, res: Response) => {
    try {
        const { filename } = req.body;
        if (!filename) return res.status(400).json({ error: 'Filename required' });

        const backupPath = path.join(BACKUPS_DIR, filename);

        // Security check: Traversal prevention
        if (path.relative(BACKUPS_DIR, backupPath).startsWith('..')) {
            return res.status(403).json({ error: 'Invalid path' });
        }

        await fs.access(backupPath);

        // Safety backup of current state
        await createBackup(DEFAULTS_PATH);

        // Restore
        await fs.copyFile(backupPath, DEFAULTS_PATH);

        console.log(`✅ Restored backup: ${filename}`);
        res.json({ success: true, message: 'Restored successfully' });

    } catch (error: any) {
        console.error('Restore error:', error);
        res.status(500).json({ error: error.message });
    }
});

// API: Update Defaults (Main Save Endpoint)
app.post('/api/update-defaults', async (req: Request, res: Response) => {
    try {
        console.log('📥 Received save request. Body keys:', Object.keys(req.body || {}));
        // 1. Validation
        const result = ProjectStateSchema.safeParse(req.body?.brandData);

        if (!result.success) {
            console.error('❌ Validation Failed');
            try {
                if (result.error) {
                    const issues = result.error.issues;
                    console.error('Validation issue count:', issues?.length);
                    if (issues && issues.length > 0) {
                        console.error('First issue message:', issues[0].message);
                        console.error('First issue path:', issues[0].path.join('.'));
                        console.error('Full details:', JSON.stringify(issues, null, 2));
                    }
                }
            } catch (logErr) {
                console.error('Error while logging validation failure:', logErr);
            }

            return res.status(400).json({
                error: 'Validation Error',
                details: result.error?.issues || []
            });
        }

        const validData = req.body?.brandData;

        // Update Meta
        validData.meta = {
            lastModified: Date.now(),
            version: validData.meta?.version || "2.6.0"
        };

        // 2. Backup
        await createBackup(DEFAULTS_PATH);

        // 3. Atomic Write
        const tempPath = DEFAULTS_PATH + '.tmp';
        await fs.writeFile(tempPath, JSON.stringify(validData, null, 2), 'utf-8');
        await fs.rename(tempPath, DEFAULTS_PATH);

        console.log('✅ Saved configuration successfully');
        res.json({ success: true, message: 'Saved' });

    } catch (error: any) {
        console.error('❌ Save Error:', error);

        // Handle Zod or general validation errors specifically
        if (error.name === 'ZodError') {
            return res.status(400).json({
                error: 'Validation Error',
                details: error.errors
            });
        }

        res.status(500).json({
            error: error.message || 'Internal Server Error',
            // Only include stack in dev
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Start Server
async function start() {
    try {
        await ensureDirs();

        const server = app.listen(PORT, () => {
            console.log(`\n🚀 Antigravity Server running on http://localhost:${PORT}`);
            console.log(`🛡️  Environment: ${process.env.NODE_ENV}`);
            console.log(`✅ Server started successfully at ${new Date().toISOString()}`);
        });

        // Handle server errors
        server.on('error', (error: NodeJS.ErrnoException) => {
            if (error.code === 'EADDRINUSE') {
                console.error(`❌ ERROR: Port ${PORT} is already in use!`);
                console.error(`   Try running: npm run stop`);
                process.exit(1);
            } else {
                console.error(`❌ Server error:`, error);
                process.exit(1);
            }
        });

    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

start().catch((error) => {
    console.error('❌ Fatal error during startup:', error);
    process.exit(1);
});

// Graceful Shutdown
process.on('SIGTERM', () => {
    console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
    process.exit(0);
});
process.on('SIGINT', () => {
    console.log('\n🛑 Received SIGINT (Ctrl+C), shutting down gracefully...');
    process.exit(0);
});
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    // In dev, log but keep server alive; in production, exit cleanly
    if (process.env.NODE_ENV !== 'development') {
        process.exit(1);
    }
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    if (process.env.NODE_ENV !== 'development') {
        process.exit(1);
    }
});
