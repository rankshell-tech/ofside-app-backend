import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import path from 'path';
import { setupSwagger } from './config/swagger';
import { errorHandler, notFound } from './middlewares/errorHandler';
import { generalLimiter } from './middlewares/rateLimiter';

// Import routes
import userMatchesRoutes from './routes/userMatches.routes';
import authRoutes from './routes/auth.routes';
import venueRoutes from './routes/venue.routes';
import courtRoutes from './routes/court.routes';
import bookingRoutes from './routes/booking.routes';
import rulebookRoutes from './routes/rulebook.routes';
import uploadRoutes from './routes/upload.routes';
import matchRoutes from './routes/match.routes';
import leaderboardRoutes from './routes/leaderboard.routes';
import userRoutes from './routes/user.routes';





const app = express();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com', 'https://www.yourdomain.com']
    : ['http://localhost:8081', 'http://localhost:8081'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// General middleware
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// Rate limiting
app.use('/api/', generalLimiter);

// Health check endpoint
app.get('/health', (_, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
  });
});

// API documentation
setupSwagger(app);

// API routes
app.use("/api/users", userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/venues', venueRoutes);
app.use('/api/courts', courtRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/rulebook', rulebookRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/leaderboards', leaderboardRoutes);
app.use('/api/userMatches', userMatchesRoutes);

// Welcome endpoint
app.get('/', (_, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to Ofside Management API...',
    documentation: '/api-docs',
    version: '1.0.0',
  });
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

export default app;