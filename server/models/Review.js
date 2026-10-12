// Review model - a customer's rating for a completed booking (one review per booking).
module.exports = (sequelize, DataTypes) => {
  const Review = sequelize.define(
    'Review',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      booking_id: { type: DataTypes.INTEGER, allowNull: false, unique: true }, // Booking 1 -> 1 Review
      customer_id: { type: DataTypes.INTEGER, allowNull: false },
      provider_id: { type: DataTypes.INTEGER, allowNull: false },
      rating: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          isInt: { msg: 'Rating must be a whole number' },
          min: { args: [1], msg: 'Rating must be at least 1' },
          max: { args: [5], msg: 'Rating cannot be more than 5' },
        },
      },
      comment: { type: DataTypes.TEXT, allowNull: true },
    },
    { tableName: 'reviews' }
  );
  return Review;
};
