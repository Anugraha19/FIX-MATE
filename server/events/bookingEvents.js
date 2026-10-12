// EVENT EMITTER example: controllers announce what happened ("bookingCreated"),
// and listeners here react (write an activity log). The controller does not need to know who listens.
const { EventEmitter } = require('events');
const { writeLog } = require('../utils/logger');

class BookingEvents extends EventEmitter {}
const bookingEvents = new BookingEvents();

const EVENT_NAMES = [
  'bookingCreated',
  'bookingAssigned',
  'bookingAccepted',
  'bookingRejected',
  'bookingStarted',
  'bookingCompleted',
  'bookingCancelled',
];

// One listener per event: write a line to logs/booking-activity.log
EVENT_NAMES.forEach((eventName) => {
  bookingEvents.on(eventName, (info) => {
    writeLog(
      'booking-activity.log',
      `${eventName} | booking #${info.bookingId} | customer ${info.customerId} | provider ${info.providerId ?? 'none'} | by ${info.by || 'system'}`
    );
  });
});

// Helper so controllers can write: emitBooking('bookingCreated', booking, req.user)
function emitBooking(eventName, booking, actor) {
  bookingEvents.emit(eventName, {
    bookingId: booking.id,
    customerId: booking.customer_id,
    providerId: booking.provider_id,
    status: booking.status,
    by: actor ? `${actor.role}#${actor.id}` : 'system',
  });
}

module.exports = { bookingEvents, emitBooking, EVENT_NAMES };
