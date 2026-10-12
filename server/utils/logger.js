// File System (fs) example: a tiny logger that appends lines to files inside /logs.
// fs.promises.appendFile is NON-BLOCKING - Node keeps serving other requests while the file is written.
const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, '..', 'logs');

async function writeLog(fileName, message) {
  const line = `[${new Date().toISOString()}] ${message}\n`;
  try {
    await fs.promises.mkdir(LOG_DIR, { recursive: true });
    await fs.promises.appendFile(path.join(LOG_DIR, fileName), line);
  } catch (err) {
    // A logging failure should never crash the API.
    console.error('Could not write log file:', err.message);
  }
}

module.exports = { writeLog, LOG_DIR };
