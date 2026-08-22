"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const env_1 = require("./config/env");
const app = (0, app_1.createApp)();
const server = app.listen(env_1.config.port, () => {
    console.log(`🚀 LinguaLeap Backend API Server running on port ${env_1.config.port}`);
    console.log(`📍 Environment: ${env_1.config.nodeEnv}`);
    console.log(`📡 Base API URL: http://localhost:${env_1.config.port}/api/v1`);
    console.log(`🩺 Health Check: http://localhost:${env_1.config.port}/api/v1/health`);
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
