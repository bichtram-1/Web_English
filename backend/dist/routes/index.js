"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_routes_1 = __importDefault(require("./auth.routes"));
const deck_routes_1 = __importDefault(require("./deck.routes"));
const card_routes_1 = __importDefault(require("./card.routes"));
const study_routes_1 = __importDefault(require("./study.routes"));
const stats_routes_1 = __importDefault(require("./stats.routes"));
const rootRouter = (0, express_1.Router)();
// Health Check
rootRouter.get('/health', (_req, res) => {
    res.json({
        status: 'OK',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        service: 'LinguaLeap Backend API (DATN)',
    });
});
// API Routes
rootRouter.use('/auth', auth_routes_1.default);
rootRouter.use('/decks', deck_routes_1.default);
rootRouter.use('/cards', card_routes_1.default);
rootRouter.use('/study', study_routes_1.default);
rootRouter.use('/stats', stats_routes_1.default);
exports.default = rootRouter;
