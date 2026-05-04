import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { env, isProduction } from './config/env';
import authRoutes from './routes/auth.routes';
import interviewRoutes from './routes/interview.routes';
import postRoutes from './routes/post.routes';
import projectRoutes from './routes/project.routes';
import userRoutes from './routes/user.routes';
import conversationRoutes from './routes/conversation.routes';
import groupRoutes from './routes/group.routes';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.corsOrigin === '*' ? true : env.corsOrigin,
    credentials: true,
  }),
);
app.use(express.json({ limit: '1mb' }));
app.use(morgan(isProduction ? 'combined' : 'dev'));

app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'backend-pathfinder',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/groups', groupRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
