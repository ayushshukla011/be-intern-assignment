import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { AppDataSource } from './data-source';

// Import routes
import { userRouter } from './routes/user.routes';
import postRouter from './routes/post.routes';
import likeRouter from './routes/like.routes';
import hashtagRouter from './routes/hashtag.routes';
import followRouter from './routes/follow.routes';
import feedRouter from './routes/feed.routes';
import activityRouter from './routes/activity.routes';

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Add request logger middleware
app.use((req, res, next) => {
  const start = Date.now();
  console.log(`📥 ${new Date().toISOString()} [${req.method}] ${req.url}`);
  
  // Log request body if it exists
  if (req.body && Object.keys(req.body).length) {
    console.log('Request Body:', JSON.stringify(req.body, null, 2));
  }
  
  // Log response when finished
  const originalSend = res.send;
  res.send = function(body) {
    const duration = Date.now() - start;
    console.log(`📤 ${new Date().toISOString()} [${req.method}] ${req.url} ${res.statusCode} - ${duration}ms`);
    return originalSend.call(this, body);
  };
  
  next();
});

// Replace with this synchronous initialization:
(async function initializeApp() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Data Source has been initialized!');
    
    // Welcome route
    app.get('/', (req, res) => {
      res.send('Welcome to the Social Media Platform API! Server is running successfully.');
    });

    // Register all routes
    app.use('/api/users', userRouter);
    app.use('/api/posts', postRouter);
    app.use('/api/likes', likeRouter);
    app.use('/api/hashtags', hashtagRouter);
    app.use('/api/follows', followRouter);
    app.use('/api/feed', feedRouter);
    app.use('/api', activityRouter); // This will handle /api/users/:id/activity

    // Add before app.listen()
    // Global error handler
    app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      console.error('❌ ERROR:', err);
      res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
      });
    });

    // Start server only after DB is connected
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (err) {
    console.error('❌ Error during Data Source initialization:', err);
    process.exit(1);
  }
})();
