import path from 'path';
import dotenv from 'dotenv';
import { Sequelize } from 'sequelize';
import { User, ensureDbSynced } from '../lib/db';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const args = process.argv.slice(2);
const emailArg = args.find((a) => a.startsWith('--email='));
const confirmDbArg = args.find((a) => a.startsWith('--confirm-db='));

const email = emailArg ? emailArg.split('=')[1]?.trim().toLowerCase() : null;
const confirmedDb = confirmDbArg ? confirmDbArg.split('=')[1]?.trim() : null;
const expectedDb = process.env.DB_NAME || 'chemistry_db';

console.log('==============================================');
console.log('         SEED ADMINISTRATOR ACCOUNT           ');
console.log('==============================================');

if (!email) {
  console.error('FATAL: --email argument is required.');
  console.error('Example: npm run seed:admin -- --email=admin@example.com --confirm-db=chemistry_db');
  process.exit(1);
}

if (!confirmedDb || confirmedDb !== expectedDb) {
  console.error(`FATAL: DB confirmation required. Expected --confirm-db=${expectedDb}`);
  process.exit(1);
}

async function seedAdmin() {
  await ensureDbSynced();

  const targetEmail = email as string;
  const user = await User.findOne({ where: { email: targetEmail } });
  if (!user) {
    console.error(`User with email "${targetEmail}" not found in database.`);
    process.exit(1);
  }

  user.role = 'admin';
  user.status = 'active';
  await user.save();

  console.log(`Successfully elevated user #${user.id} (${user.name}, ${user.email}) to role: 'admin'.`);
  console.log('Password remains untouched.');
}

seedAdmin()
  .catch((err) => {
    console.error('Failed to seed admin:', err);
    process.exit(1);
  })
  .finally(() => process.exit(0));
