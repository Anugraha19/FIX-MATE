// STREAMS example: export all bookings as a CSV file without loading them all into memory.
// A Readable stream produces the CSV text row by row, and pipe/pipeline sends it to a destination
// (the HTTP response, or a file on disk).
const fs = require('fs');
const path = require('path');
const { Readable } = require('stream');
const { pipeline } = require('stream/promises');
const { Booking, Service, User } = require('../models');

const REPORT_DIR = path.join(__dirname, '..', 'reports');
const HEADER = ['Booking ID', 'Customer', 'Service', 'Date', 'Time', 'Status', 'Estimated Price'];

const csvCell = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;

// Async generator: fetches bookings 100 at a time and yields one CSV line per booking.
async function* csvLines() {
  yield HEADER.map(csvCell).join(',') + '\n';
  const pageSize = 100;
  for (let offset = 0; ; offset += pageSize) {
    const rows = await Booking.findAll({
      include: [
        { model: Service, as: 'service', attributes: ['name'] },
        { model: User, as: 'customer', attributes: ['name'] },
      ],
      order: [['id', 'ASC']],
      limit: pageSize,
      offset,
    });
    if (rows.length === 0) return;
    for (const b of rows) {
      yield [b.id, b.customer.name, b.service.name, b.booking_date, b.booking_time, b.status, b.estimated_price].map(csvCell).join(',') + '\n';
    }
  }
}

// Stream the report straight to the browser (res is a writable stream).
async function streamBookingsCsv(res) {
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="fixmate-bookings.csv"');
  await pipeline(Readable.from(csvLines()), res);
}

// Stream the report into a file inside /reports and return its path.
async function saveBookingsCsv() {
  await fs.promises.mkdir(REPORT_DIR, { recursive: true });
  const filePath = path.join(REPORT_DIR, `bookings-${Date.now()}.csv`);
  await pipeline(Readable.from(csvLines()), fs.createWriteStream(filePath));
  return filePath;
}

module.exports = { streamBookingsCsv, saveBookingsCsv };
