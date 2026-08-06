import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import { requestLogger } from './middleware/requestLogger';
import { authMiddleware } from './middleware/auth';
import { asyncHandler } from './middleware/asyncHandler';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { authController } from './controllers/authController';
import { apiRouter } from './routes';

export const app = express();

app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }));
app.use(express.json());
app.use(requestLogger);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// Public: this is the only way to obtain a token, so it must run before authMiddleware.
app.post('/api/v1/auth/login', asyncHandler(authController.login));

app.use('/api/v1', authMiddleware, apiRouter);

app.use(notFoundHandler);
app.use(errorHandler);
