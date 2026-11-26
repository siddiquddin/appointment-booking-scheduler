import dotenv from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import app from './app.js';
import { connectDB, disconnectDB } from './config/db.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
// Support .env either in /backend or at monorepo root
dotenv.config({ path: resolve(__dirname, '../../.env') });
dotenv.config({ path: resolve(__dirname, '../.env') });

const PORT = Number(process.env.PORT) || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

let server = null;

async function startServer() {
  try {
    await connectDB(MONGODB_URI);
    server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`[API] Server listening on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
    });
  } catch (err) {
    console.error('[Startup] Failed to start server:', err.message);
    process.exit(1);
  }
}

async function shutdown(signal) {
  console.log(`[Shutdown] Received ${signal}, draining connections...`);
  if (server) {
    await new Promise((resolveClose) => server.close(resolveClose));
  }
  await disconnectDB();
  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

startServer();
