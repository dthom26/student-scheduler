import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables based on NODE_ENV
const envFile = process.env.NODE_ENV === 'production'
  ? '.env.production.local'
  : '.env.development.local';

config({ path: join(__dirname, '../../', envFile) });

export const { PORT, NODE_ENV, MONGO_URI, MANAGER_PASSWORD, JWT_SECRET } = process.env;
