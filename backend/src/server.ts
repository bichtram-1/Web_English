import { createApp } from './app';
import { config } from './config/env';

const app = createApp();

const server = app.listen(config.port, () => {
  console.log(`🚀 LinguaLeap Backend API Server running on port ${config.port}`);
  console.log(`📍 Environment: ${config.nodeEnv}`);
  console.log(`📡 Base API URL: http://localhost:${config.port}/api/v1`);
  console.log(`🩺 Health Check: http://localhost:${config.port}/api/v1/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});
