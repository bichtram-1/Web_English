import dotenv from 'dotenv';
import path from 'path';

// Pre-load environment variables
dotenv.config({ path: path.resolve(__dirname, '../backend/.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { createApp } from '../backend/src/app';

const app = createApp();

export default app;
