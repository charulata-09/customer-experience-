import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import { env } from '../src/config/env.js';
import { logger } from '../src/utils/logger.js';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  const migrationPath = path.resolve(__dirname, '../../supabase/migrations/001_initial_schema.sql');
  
  if (!fs.existsSync(migrationPath)) {
    logger.error(`Migration file not found at: ${migrationPath}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(migrationPath, 'utf8');
  logger.info(`Loaded migration file: ${migrationPath} (${(sql.length / 1024).toFixed(1)} KB)`);

  const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

  if (connectionString) {
    logger.info('Connecting to PostgreSQL database via connection string...');
    const client = new Client({
      connectionString,
      ssl: { rejectUnauthorized: false },
    });

    try {
      await client.connect();
      logger.info('Connected to PostgreSQL successfully. Executing migration...');
      await client.query(sql);
      logger.info('✅ Migration applied successfully via PostgreSQL client!');
      await client.end();
      return;
    } catch (err) {
      logger.error({ err }, 'Failed to apply migration via PostgreSQL client');
      await client.end().catch(() => {});
      throw err;
    }
  }

  // Attempt using Supabase Management SQL API / REST
  if (env.SUPABASE_URL && !env.SUPABASE_URL.includes('placeholder')) {
    logger.info(`Attempting to apply migration to Supabase Cloud at ${env.SUPABASE_URL}...`);
    try {
      // Supabase platform provides /pg/query on self-hosted or management endpoints
      const response = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({ query: sql }),
      });

      if (response.ok) {
        logger.info('✅ Migration applied successfully to Supabase via API!');
        return;
      }
    } catch (apiErr) {
      logger.warn(`REST API direct execution attempted: ${apiErr.message}`);
    }
  }

  logger.warn(
    '\n⚠️  Direct database connection string (DATABASE_URL) is not set or using placeholder.\n' +
    'To apply the migration automatically:\n' +
    '  1. Provide DATABASE_URL in backend/.env (e.g. postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres)\n' +
    '  2. Run: npm run migrate in the /backend directory.\n' +
    '\nAlternatively, copy the SQL directly from:\n' +
    `  ${migrationPath}\n` +
    'and paste it into the Supabase Dashboard SQL Editor (https://supabase.com/dashboard/project/_/sql).\n'
  );
}

runMigration().catch((err) => {
  logger.error(err, 'Migration script error');
  process.exit(1);
});
