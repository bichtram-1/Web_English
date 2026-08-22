"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const env_1 = require("../config/env");
const seedData_1 = require("./seedData");
class JsonDatabase {
    data;
    filePath;
    constructor() {
        this.filePath = env_1.config.dbPath;
        this.data = {
            users: [],
            decks: [],
            stats: [],
            sessions: [],
        };
        this.init();
    }
    init() {
        try {
            const dir = path_1.default.dirname(this.filePath);
            if (!fs_1.default.existsSync(dir)) {
                fs_1.default.mkdirSync(dir, { recursive: true });
            }
            if (fs_1.default.existsSync(this.filePath)) {
                const raw = fs_1.default.readFileSync(this.filePath, 'utf-8');
                this.data = JSON.parse(raw);
            }
            else {
                // Seed default initial data
                this.data = {
                    users: seedData_1.initialUsers,
                    decks: seedData_1.initialDecks,
                    stats: seedData_1.initialStats,
                    sessions: seedData_1.initialSessions,
                };
                this.save();
            }
        }
        catch (err) {
            console.error('Error initializing database file:', err);
            this.data = {
                users: seedData_1.initialUsers,
                decks: seedData_1.initialDecks,
                stats: seedData_1.initialStats,
                sessions: seedData_1.initialSessions,
            };
        }
    }
    save() {
        try {
            fs_1.default.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf-8');
        }
        catch (err) {
            console.error('Error saving database file:', err);
        }
    }
    // Users
    get users() {
        return this.data.users;
    }
    findUserById(id) {
        return this.data.users.find((u) => u.id === id);
    }
    findUserByEmail(email) {
        return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    }
    createUser(user) {
        this.data.users.push(user);
        this.save();
        return user;
    }
    updateUser(id, updates) {
        const index = this.data.users.findIndex((u) => u.id === id);
        if (index === -1)
            return undefined;
        this.data.users[index] = {
            ...this.data.users[index],
            ...updates,
            updatedAt: new Date().toISOString(),
        };
        this.save();
        return this.data.users[index];
    }
    // Decks
    get decks() {
        return this.data.decks;
    }
    findDeckById(id) {
        return this.data.decks.find((d) => d.id === id);
    }
    createDeck(deck) {
        this.data.decks.unshift(deck);
        this.save();
        return deck;
    }
    updateDeck(id, updates) {
        const index = this.data.decks.findIndex((d) => d.id === id);
        if (index === -1)
            return undefined;
        this.data.decks[index] = {
            ...this.data.decks[index],
            ...updates,
            updatedAt: new Date().toISOString(),
        };
        this.save();
        return this.data.decks[index];
    }
    deleteDeck(id) {
        const beforeCount = this.data.decks.length;
        this.data.decks = this.data.decks.filter((d) => d.id !== id);
        if (this.data.decks.length !== beforeCount) {
            this.save();
            return true;
        }
        return false;
    }
    // Study Sessions & Stats
    get sessions() {
        return this.data.sessions;
    }
    addSession(session) {
        this.data.sessions.unshift(session);
        this.save();
        return session;
    }
    getUserStats(userId) {
        return this.data.stats.find((s) => s.userId === userId);
    }
    updateUserStats(stats) {
        const index = this.data.stats.findIndex((s) => s.userId === stats.userId);
        if (index >= 0) {
            this.data.stats[index] = stats;
        }
        else {
            this.data.stats.push(stats);
        }
        this.save();
        return stats;
    }
}
exports.db = new JsonDatabase();
