// Small date/time helpers used when validating bookings.

// Today as YYYY-MM-DD in the server's local time zone.
function todayString(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

// "9:00" or "09:00" -> "09:00:00" so times can be compared as strings.
function normalizeTime(value) {
  const parts = String(value).split(':');
  const hh = (parts[0] || '00').padStart(2, '0');
  const mm = (parts[1] || '00').padStart(2, '0');
  const ss = (parts[2] || '00').padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

const isDateString = (value) => /^\d{4}-\d{2}-\d{2}$/.test(String(value)) && !Number.isNaN(Date.parse(value));
const isTimeString = (value) => /^\d{1,2}:\d{2}(:\d{2})?$/.test(String(value));

module.exports = { todayString, normalizeTime, isDateString, isTimeString };
