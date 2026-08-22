"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const stats_controller_1 = require("../controllers/stats.controller");
const router = (0, express_1.Router)();
router.get('/summary', stats_controller_1.StatsController.getSummary);
router.get('/leaderboard', stats_controller_1.StatsController.getLeaderboard);
exports.default = router;
