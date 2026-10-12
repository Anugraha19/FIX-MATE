// Availability model - time windows a provider marks as free (or blocked) on a date.
module.exports = (sequelize, DataTypes) => {
  const Availability = sequelize.define(
    'Availability',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      provider_id: { type: DataTypes.INTEGER, allowNull: false },
      available_date: { type: DataTypes.DATEONLY, allowNull: false },
      start_time: { type: DataTypes.TIME, allowNull: false },
      end_time: { type: DataTypes.TIME, allowNull: false },
      is_available: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    },
    {
      tableName: 'availability',
      validate: {
        // Model-level validation: the end time must come after the start time.
        endAfterStart() {
          if (this.start_time && this.end_time && String(this.end_time) <= String(this.start_time)) {
            throw new Error('End time must be after start time');
          }
        },
      },
    }
  );
  return Availability;
};
