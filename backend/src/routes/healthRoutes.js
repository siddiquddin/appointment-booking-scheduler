import { Router } from 'express';
import { getDbStatus } from '../config/db.js';

const router = Router();

router.get('/', (_req, res) => {
  const db = getDbStatus();
  const statusCode = db.connected ? 200 : 503;

  res.status(statusCode).json({
    success: db.connected,
    status: db.connected ? 'ok' : 'unavailable',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
    database: db
  });
});

export default router;
