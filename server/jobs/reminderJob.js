// CRON JOB: runs every day at 08:00 and writes a reminder line for each booking happening tomorrow.
const cron = require('node-cron');
const { Op } = require('sequelize');
const { Booking, Service, User } = require('../models');
const { writeLog } = require('../utils/logger');
const { todayString } = require('../utils/dateHelpers');

// The actual work. Exported so it can also be run by hand: npm run reminders
async function runReminderCheck() {
  const tomorrow = todayString(1);
  const upcoming = await Booking.findAll({
    where: {
      booking_date: tomorrow,
      status: { [Op.in]: ['Confirmed', 'Assigned', 'Accepted'] },
    },
    include: [
      { model: Service, as: 'service', attributes: ['name'] },
      { model: User, as: 'customer', attributes: ['name', 'phone'] },
    ],
  });

  for (const booking of upcoming) {
    await writeLog(
      'reminders.log',
      `REMINDER: booking #${booking.id} (${booking.service.name}) for ${booking.customer.name} on ${tomorrow} at ${booking.booking_time}`
    );
  }
  await writeLog('reminders.log', `Reminder check finished: ${upcoming.length} booking(s) for ${tomorrow}`);
  return upcoming.length;
}

function startReminderJob() {
  // cron format: minute hour day-of-month month day-of-week
  cron.schedule('0 8 * * *', () => {
    runReminderCheck().catch((err) => console.error('Reminder job failed:', err.message));
  });
  console.log('Cron job scheduled: daily booking reminders at 08:00');
}

module.exports = { startReminderJob, runReminderCheck };
