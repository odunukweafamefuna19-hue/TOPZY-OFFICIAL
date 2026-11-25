import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import refundRoutes from './routes/refundRoutes.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.get('/health', (_req, res) => res.json({ service: 'TOPZY Refund Engine', ok: true }));
app.use('/api/refunds', refundRoutes);

app.listen(config.port, () => console.log(`TOPZY Refund Engine listening on port ${config.port}`));
