// Booking model - a customer's request for a service on a date/time.
const BOOKING_STATUSES = ['Pending', 'Confirmed', 'Assigned', 'Accepted', 'In Progress', 'Completed', 'Cancelled', 'Rejected'];

module.exports = (sequelize, DataTypes) => {
  const Booking = sequelize.define(
    'Booking',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      customer_id: { type: DataTypes.INTEGER, allowNull: false },
      provider_id: { type: DataTypes.INTEGER, allowNull: true }, // empty until a provider is chosen / assigned
      service_id: { type: DataTypes.INTEGER, allowNull: false },
      booking_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate: { isDate: { msg: 'Enter a valid booking date' } },
      },
      booking_time: { type: DataTypes.TIME, allowNull: false },
      address: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: { notEmpty: { msg: 'Address is required' } },
      },
      problem_description: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: { len: { args: [5, 2000], msg: 'Describe the problem (at least 5 characters)' } },
      },
      notes: { type: DataTypes.TEXT, allowNull: true },
      estimated_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: { min: { args: [0], msg: 'Price cannot be negative' } },
      },
      status: {
        type: DataTypes.ENUM(...BOOKING_STATUSES),
        allowNull: false,
        defaultValue: 'Pending',
      },
    },
    { tableName: 'bookings' }
  );
  Booking.STATUSES = BOOKING_STATUSES;
  return Booking;
};
