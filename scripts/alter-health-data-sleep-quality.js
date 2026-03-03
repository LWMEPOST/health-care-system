require('dotenv').config();
const postgres = require('postgres');

const sql = postgres(process.env.DATABASE_URL);

const run = async () => {
  try {
    await sql.unsafe('ALTER TABLE health_data ADD COLUMN IF NOT EXISTS sleep_quality INTEGER');
    await sql.unsafe('ALTER TABLE health_data ADD COLUMN IF NOT EXISTS stress_level INTEGER');
    await sql.unsafe("SELECT pg_notify('pgrst','reload schema')");
    console.log('ok');
  } catch (error) {
    console.error(error?.message || error);
    process.exitCode = 1;
  } finally {
    await sql.end();
  }
};

run();
