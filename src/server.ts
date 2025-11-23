import app from './app';
import http from "http";
import { Server } from "socket.io";
import registerMatchSocket from "./sockets/match.socket";
import { config } from './config/env';
import { connectDatabase } from './config/database';

const startServer = async (): Promise<void> => {
  try {
    // Connect to database
    await connectDatabase();
    
    // Create HTTP server from Express app
    const server = http.createServer(app);
    
    // Initialize Socket.IO on the same server
    const io = new Server(server, {
      cors: {
        origin: process.env.NODE_ENV === 'production' 
          ? ['https://yourdomain.com', 'https://www.yourdomain.com']
          : ['http://localhost:8081', 'http://localhost:19006', '*'],
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    // Register Socket.IO handlers
    registerMatchSocket(io);
    
    // Start server
    server.listen(config.port, () => {
      console.log(`
╔══════════════════════════════════════════════════════════════════╗
║                 Ofside Management API                      ║
║                                                                  ║
║  🚀 Server running on port ${config.port}                                    ║
║  📚 API Documentation: http://localhost:${config.port}/api-docs          ║
║  🏥 Health Check: http://localhost:${config.port}/health                ║
║  🌍 Environment: ${config.nodeEnv}                                 ║
║  🔌 WebSocket enabled on port ${config.port}                            ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
      `);
    });

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