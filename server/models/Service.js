// Service model - a repair job customers can book (e.g. "Leaking Tap Repair").
module.exports = (sequelize, DataTypes) => {
  const Service = sequelize.define(
    'Service',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      category_id: { type: DataTypes.INTEGER, allowNull: false },
      name: {
        type: DataTypes.STRING(150),
        allowNull: false,
        validate: { notEmpty: { msg: 'Service name is required' } },
      },
      description: { type: DataTypes.TEXT, allowNull: true },
      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: { min: { args: [1], msg: 'Price must be greater than 0' } },
      },
      duration: {
        type: DataTypes.INTEGER, // minutes
        allowNull: false,
        defaultValue: 60,
        validate: { min: { args: [15], msg: 'Duration must be at least 15 minutes' } },
      },
      image: { type: DataTypes.STRING(255), allowNull: true }, // icon key such as "tap"
      is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    },
    { tableName: 'services' }
  );
  return Service;
};
