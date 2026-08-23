"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const routes_1 = __importDefault(require("./routes"));
const logger_middleware_1 = require("./middlewares/logger.middleware");
const error_middleware_1 = require("./middlewares/error.middleware");
const createApp = () => {
    const app = (0, express_1.default)();
    // Global Middlewares
    app.use((0, cors_1.default)({
        origin: '*', // Allow all origins for dev / capstone presentation
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    }));
    app.use(express_1.default.json({ limit: '10mb' }));
    app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
    app.use(logger_middleware_1.requestLogger);
    // Mount API Router under /api/v1 and /v1 for full backward compatibility
    app.use('/api/v1', routes_1.default);
    app.use('/v1', routes_1.default);
    // Root welcome
    app.get('/', (_req, res) => {
        res.json({
            message: 'LinguaLeap English Learning RESTful API Server (DATN Structure)',
            docs: '/api/v1/health',
            version: '1.0.0',
        });
    });
    // 404 & Global Error Handling
    app.use(error_middleware_1.notFoundHandler);
    app.use(error_middleware_1.errorHandler);
    return app;
};
exports.createApp = createApp;
exports.default = (0, exports.createApp)();
