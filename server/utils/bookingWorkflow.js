// Booking status workflow - decides which status changes are allowed.
// Example: a booking can go Accepted -> In Progress, but never Completed -> Pending.
const AppError = require('./AppError');

const TRANSITIONS = {
  Pending: ['Confirmed', 'Assigned', 'Accepted', 'Rejected', 'Cancelled'],
  Confirmed: ['Assigned', 'Accepted', 'Rejected', 'Cancelled'],
  Assigned: ['Accepted', 'Rejected', 'Cancelled'],
  Accepted: ['In Progress', 'Cancelled'],
  'In Progress': ['Completed'],
  Completed: [],
  Cancelled: [],
  Rejected: ['Assigned'], // admin can give a rejected job to another provider
};

// Statuses in which the customer may still cancel.
const CUSTOMER_CANCELLABLE = ['Pending', 'Confirmed', 'Assigned'];

// Statuses that block the provider's time slot (a second booking cannot use it).
const SLOT_BLOCKING = ['Pending', 'Confirmed', 'Assigned', 'Accepted', 'In Progress'];

function canTransition(from, to) {
  return (TRANSITIONS[from] || []).includes(to);
}

function assertTransition(from, to) {
  if (!canTransition(from, to)) {
    throw new AppError(`A booking that is "${from}" cannot be changed to "${to}"`, 400);
  }
}

module.exports = { TRANSITIONS, CUSTOMER_CANCELLABLE, SLOT_BLOCKING, canTransition, assertTransition };
