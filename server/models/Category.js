// Category model - e.g. Plumbing, Electrical. One category has many services.
module.exports = (sequelize, DataTypes) => {
  const Category = sequelize.define(
    'Category',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        validate: { notEmpty: { msg: 'Category name is required' } },
      },
      description: { type: DataTypes.TEXT, allowNull: true },
      image: { type: DataTypes.STRING(255), allowNull: true }, // icon key such as "wrench"
    },
    { tableName: 'categories' }
  );
  return Category;
};
