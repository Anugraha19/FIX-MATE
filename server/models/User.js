// User model - one table for customers, providers and admins (the "role" column tells them apart).
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    'User',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: { notEmpty: { msg: 'Name is required' }, len: { args: [2, 100], msg: 'Name must be 2-100 characters' } },
      },
      email: {
        type: DataTypes.STRING(150),
        allowNull: false,
        unique: true, // constraint: no two users can share an email
        validate: { isEmail: { msg: 'Enter a valid email address' } },
      },
      phone: {
        type: DataTypes.STRING(20),
        allowNull: false,
        validate: { is: { args: /^[0-9+\-\s]{7,15}$/, msg: 'Enter a valid phone number (7-15 digits)' } },
      },
      password: { type: DataTypes.STRING(255), allowNull: false }, // always a bcrypt hash
      role: {
        type: DataTypes.ENUM('customer', 'provider', 'admin'),
        allowNull: false,
        defaultValue: 'customer',
        validate: { isIn: { args: [['customer', 'provider', 'admin']], msg: 'Invalid role' } },
      },
      address: { type: DataTypes.STRING(255), allowNull: true },
      city: { type: DataTypes.STRING(100), allowNull: true },
      profile_image: { type: DataTypes.STRING(255), allowNull: true },
      is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    },
    {
      tableName: 'users',
      // By default the password hash is never returned. Login asks for it with User.scope('withPassword').
      defaultScope: { attributes: { exclude: ['password'] } },
      scopes: { withPassword: { attributes: {} } },
    }
  );
  return User;
};
