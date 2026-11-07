import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { Sequelize, QueryTypes } from 'sequelize';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Parse CLI arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const confirmDbArg = args.find((a) => a.startsWith('--confirm-db='));
const confirmedDb = confirmDbArg ? confirmDbArg.split('=')[1] : null;

const expectedDb = process.env.DB_NAME || 'chemistry_db';
const expectedHost = process.env.DB_HOST || '127.0.0.1';

console.log('==============================================');
console.log('       CHEMISTRY PLAYGROUND MIGRATION RUNNER  ');
console.log('==============================================');
console.log(`Database Host: ${expectedHost}`);
console.log(`Database Name: ${expectedDb}`);
console.log(`Execution Mode: ${isDryRun ? 'DRY RUN (no changes applied)' : 'LIVE EXECUTION'}`);
console.log('----------------------------------------------');

// Safety Check 1: Refuse non-local host
if (!['127.0.0.1', 'localhost'].includes(expectedHost)) {
  console.error(`FATAL: DB_HOST is '${expectedHost}'. Safety rule prohibits executing migrations on non-local databases.`);
  process.exit(1);
}

// Safety Check 2: Confirm DB name unless dry-run
if (!isDryRun) {
  if (!confirmedDb || confirmedDb !== expectedDb) {
    console.error(`FATAL: Migration execution requires explicit confirmation.`);
    console.error(`Please provide: --confirm-db=${expectedDb}`);
    process.exit(1);
  }
}

const sequelize = new Sequelize(
  expectedDb,
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: expectedHost,
    dialect: 'mysql',
    logging: false,
  }
);

function parseSqlStatements(sql: string): string[] {
  // Normalize line endings
  const clean = sql.replace(/\r\n/g, '\n');
  const lines = clean.split('\n');
  const nonCommentLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('--') || trimmed.length === 0) {
      continue;
    }
    nonCommentLines.push(line);
  }

  const fullText = nonCommentLines.join('\n');
  // Split on ';' that is followed by whitespace/newline or EOF
  const rawStatements = fullText.split(/;\s*(?:\n|$)/);
  return rawStatements
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

async function runMigrations() {
  await sequelize.authenticate();
  console.log('Connected to MySQL successfully.');

  // 1. Ensure schema_migrations table exists
  if (!isDryRun) {
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS \`schema_migrations\` (
        \`filename\` VARCHAR(255) NOT NULL,
        \`applied_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`filename\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
    `);
  }

  // Fetch applied migrations
  let applied: string[] = [];
  try {
    const records = await sequelize.query<{ filename: string }>(
      'SELECT filename FROM `schema_migrations` ORDER BY filename ASC',
      { type: QueryTypes.SELECT }
    );
    applied = records.map((r) => r.filename);
  } catch (err) {
    // Table may not exist yet in dry run
    applied = [];
  }

  // Check if baseline should be marked as applied
  const [existingTables] = (await sequelize.query(
    `SHOW TABLES LIKE 'users'`
  )) as [unknown[], unknown];
  const usersExists = Array.isArray(existingTables) && existingTables.length > 0;

  if (usersExists && !applied.includes('000_baseline.sql')) {
    console.log("Existing 'users' table detected. Marking '000_baseline.sql' as applied without re-running.");
    if (!isDryRun) {
      await sequelize.query(
        "INSERT INTO `schema_migrations` (`filename`, `applied_at`) VALUES ('000_baseline.sql', NOW()) ON DUPLICATE KEY UPDATE applied_at = applied_at"
      );
    }
    applied.push('000_baseline.sql');
  }

  // Read migrations directory
  const migrationsDir = path.resolve(process.cwd(), 'migrations');
  if (!fs.existsSync(migrationsDir)) {
    console.log('No migrations directory found.');
    return;
  }

  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql') && !fs.statSync(path.join(migrationsDir, f)).isDirectory())
    .sort();

  console.log(`Found ${files.length} migration file(s).`);

  for (const file of files) {
    if (applied.includes(file)) {
      console.log(`[ALREADY APPLIED] ${file}`);
      continue;
    }

    console.log(`\n>>> [PENDING] ${file}`);
    const filePath = path.join(migrationsDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const statements = parseSqlStatements(content);

    if (isDryRun) {
      console.log(`--- SQL to execute for ${file} (${statements.length} statement(s)) ---`);
      for (const stmt of statements) {
        console.log(`${stmt};\n`);
      }
      continue;
    }

    console.log(`Executing ${statements.length} statement(s) for ${file}...`);
    for (const stmt of statements) {
      try {
        await sequelize.query(stmt);
      } catch (err: any) {
        console.error(`ERROR executing statement in ${file}:`);
        console.error(`Statement: ${stmt}`);
        console.error(`Error:`, err.message || err);
        throw err;
      }
    }

    await sequelize.query(
      'INSERT INTO `schema_migrations` (`filename`, `applied_at`) VALUES (?, NOW())',
      { replacements: [file] }
    );
    console.log(`Successfully applied ${file}.`);
  }

  console.log('\nAll migration checks complete.');
}

runMigrations()
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  })
  .finally(() => sequelize.close());
