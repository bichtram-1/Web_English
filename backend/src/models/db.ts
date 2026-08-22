import fs from 'fs';
import path from 'path';
import { config } from '../config/env';
import { User } from '../types/auth.types';
import { Deck } from '../types/deck.types';
import { StudySessionRecord, UserStats } from '../types/study.types';
import { initialUsers, initialDecks, initialStats, initialSessions } from './seedData';

interface DatabaseSchema {
  users: User[];
  decks: Deck[];
  stats: UserStats[];
  sessions: StudySessionRecord[];
}

class JsonDatabase {
  private data: DatabaseSchema;
  private readonly filePath: string;

  constructor() {
    this.filePath = config.dbPath;
    this.data = {
      users: [],
      decks: [],
      stats: [],
      sessions: [],
    };
    this.init();
  }

  private init() {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        this.data = JSON.parse(raw);
      } else {
        // Seed default initial data
        this.data = {
          users: initialUsers,
          decks: initialDecks,
          stats: initialStats,
          sessions: initialSessions,
        };
        this.save();
      }
    } catch (err) {
      console.error('Error initializing database file:', err);
      this.data = {
        users: initialUsers,
        decks: initialDecks,
        stats: initialStats,
        sessions: initialSessions,
      };
    }
  }

  private save() {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving database file:', err);
    }
  }

  // Users
  get users() {
    return this.data.users;
  }

  findUserById(id: string): User | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  findUserByEmail(email: string): User | undefined {
    return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  createUser(user: User): User {
    this.data.users.push(user);
    this.save();
    return user;
  }

  updateUser(id: string, updates: Partial<User>): User | undefined {
    const index = this.data.users.findIndex((u) => u.id === id);
    if (index === -1) return undefined;
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

  findDeckById(id: string): Deck | undefined {
    return this.data.decks.find((d) => d.id === id);
  }

  createDeck(deck: Deck): Deck {
    this.data.decks.unshift(deck);
    this.save();
    return deck;
  }

  updateDeck(id: string, updates: Partial<Deck>): Deck | undefined {
    const index = this.data.decks.findIndex((d) => d.id === id);
    if (index === -1) return undefined;
    this.data.decks[index] = {
      ...this.data.decks[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.save();
    return this.data.decks[index];
  }

  deleteDeck(id: string): boolean {
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

  addSession(session: StudySessionRecord): StudySessionRecord {
    this.data.sessions.unshift(session);
    this.save();
    return session;
  }

  getUserStats(userId: string): UserStats | undefined {
    return this.data.stats.find((s) => s.userId === userId);
  }

  updateUserStats(stats: UserStats): UserStats {
    const index = this.data.stats.findIndex((s) => s.userId === stats.userId);
    if (index >= 0) {
      this.data.stats[index] = stats;
    } else {
      this.data.stats.push(stats);
    }
    this.save();
    return stats;
  }
}

export const db = new JsonDatabase();
