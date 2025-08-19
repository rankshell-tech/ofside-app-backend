import app from './app';
import { config } from './config/env';
import { connectDatabase } from './config/database';

const startServer = async (): Promise<void> => {
  try {
    // Connect to database
    await connectDatabase();
    
    // Start server
    const server = app.listen(config.port, () => {
      console.log(`
╔══════════════════════════════════════════════════════════════════╗
║                 Ofside Management API                      ║
║                                                                  ║
║  🚀 Server running on port ${config.port}                                    ║
║  📚 API Documentation: http://localhost:${config.port}/api-docs          ║
║  🏥 Health Check: http://localhost:${config.port}/health                ║
║  🌍 Environment: ${config.nodeEnv}                                 ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
      `);
    });
    
    // Graceful shutdown
    const gracefulShutdown = (signal: string) => {
      console.log(`\n🔄 Received ${signal}. Starting graceful shutdown...`);
      
      server.close(() => {
        console.log('✅ HTTP server closed');
        
        // Close database connection
        const mongoose = require('mongoose');
        mongoose.connection.close(() => {
          console.log('✅ Database connection closed');
          console.log('👋 Graceful shutdown completed');
          process.exit(0);
        });
      });
      
      // Force exit after 30 seconds
      setTimeout(() => {
        console.error('❌ Forced shutdown after 30 seconds');
        process.exit(1);
      }, 30000);
    };
    
    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
    // Handle uncaught exceptions and rejections
    process.on('uncaughtException', (err) => {
      console.error('❌ Uncaught Exception:', err);
      gracefulShutdown('uncaughtException');
    });
    
    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
      gracefulShutdown('unhandledRejection');
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();