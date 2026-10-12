// Entry point: checks settings, connects to MySQL, then starts listening for requests.
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const app = require('./app');
const { sequelize } = require('./models');
const { startReminderJob } = require('./jobs/reminderJob');
require('./events/bookingEvents'); // registers the event listeners

const PORT = process.env.PORT || 5000;

async function start() {
  if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET is missing. Copy .env.example to .env and set it.');
    process.exit(1);
  }

  try {
    await sequelize.authenticate(); // test the MySQL connection
    console.log('MySQL connected');
  } catch (err) {
    console.error('Could not connect to MySQL:', err.message);
    console.error('Check DB_HOST / DB_USER / DB_PASSWORD / DB_NAME in server/.env and that MySQL is running.');
    process.exit(1);
  }

  app.listen(PORT, () => console.log(`FixMate API running on http://localhost:${PORT}/api`));

  if (process.env.ENABLE_CRON !== 'false') startReminderJob();
}

start();
