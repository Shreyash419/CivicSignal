import express from 'express';
import cors from 'cors';
import { complaintsRouter } from './routes/complaints';
import { dashboardRouter } from './routes/dashboard';
import { analyticsRouter } from './routes/analytics';
import { recommendationsRouter } from './routes/recommendations';
import { regionsRouter } from './routes/regions';
import { plansRouter } from './routes/plans';

export const app = express();

// Middleware
app.use(cors({ origin: true }));
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ limit: '25mb', extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'CivicSignal Firebase Backend',
    timestamp: new Date().toISOString(),
  });
});
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'CivicSignal Firebase Backend',
    timestamp: new Date().toISOString(),
  });
});

// Mount routes under both /api and root / for flexible base URLs
const apiRouter = express.Router();
apiRouter.use('/complaints', complaintsRouter);
apiRouter.use(dashboardRouter);
apiRouter.use(analyticsRouter);
apiRouter.use(recommendationsRouter);
apiRouter.use(regionsRouter);
apiRouter.use(plansRouter);

// Attach under both /api and root
app.use('/api', apiRouter);
app.use('/', apiRouter);
