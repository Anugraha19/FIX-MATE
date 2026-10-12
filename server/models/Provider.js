// Provider model - extra profile details for users whose role is "provider".
module.exports = (sequelize, DataTypes) => {
  const Provider = sequelize.define(
    'Provider',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      user_id: { type: DataTypes.INTEGER, allowNull: false, unique: true }, // User 1 -> 1 Provider
      experience: {
        type: DataTypes.INTEGER, // years
        allowNull: false,
        defaultValue: 0,
        validate: { min: { args: [0], msg: 'Experience cannot be negative' }, max: { args: [60], msg: 'Experience looks too high' } },
      },
      skills: { type: DataTypes.TEXT, allowNull: true }, // comma separated: "Pipe fitting, Leak repair"
      location: { type: DataTypes.STRING(150), allowNull: true },
      availability_status: {
        type: DataTypes.ENUM('available', 'busy', 'unavailable'),
        allowNull: false,
        defaultValue: 'available',
      },
      rating: {
        type: DataTypes.DECIMAL(2, 1), // average of review ratings, 0.0 - 5.0
        allowNull: false,
        defaultValue: 0,
        validate: { min: 0, max: 5 },
      },
    },
    { tableName: 'providers' }
  );
  return Provider;
};
