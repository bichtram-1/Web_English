"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../.env') });
exports.config = {
    port: parseInt(process.env.PORT || '8000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    jwtSecret: process.env.JWT_SECRET || 'super_secret_jwt_key_datn_2026_lingualeap_english',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
    clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
    dbPath: path_1.default.resolve(__dirname, '../../data/database.json'),
};
