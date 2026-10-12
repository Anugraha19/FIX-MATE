// Loads every model and defines the associations (relationships) between them.
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = require('./User')(sequelize, DataTypes);
const Category = require('./Category')(sequelize, DataTypes);
const Service = require('./Service')(sequelize, DataTypes);
const Provider = require('./Provider')(sequelize, DataTypes);
const ProviderService = require('./ProviderService')(sequelize, DataTypes);
const Booking = require('./Booking')(sequelize, DataTypes);
const Review = require('./Review')(sequelize, DataTypes);
const Availability = require('./Availability')(sequelize, DataTypes);

// ---------- Associations ----------

// User 1 -> 1 Provider
User.hasOne(Provider, { foreignKey: 'user_id', as: 'provider', onDelete: 'CASCADE' });
Provider.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Category 1 -> many Services
Category.hasMany(Service, { foreignKey: 'category_id', as: 'services', onDelete: 'RESTRICT' });
Service.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });

// Provider many <-> many Service (through the provider_services table)
Provider.belongsToMany(Service, { through: ProviderService, foreignKey: 'provider_id', otherKey: 'service_id', as: 'services' });
Service.belongsToMany(Provider, { through: ProviderService, foreignKey: 'service_id', otherKey: 'provider_id', as: 'providers' });

// Customer (User) 1 -> many Bookings
User.hasMany(Booking, { foreignKey: 'customer_id', as: 'bookings' });
Booking.belongsTo(User, { foreignKey: 'customer_id', as: 'customer' });

// Provider 1 -> many Bookings
Provider.hasMany(Booking, { foreignKey: 'provider_id', as: 'bookings' });
Booking.belongsTo(Provider, { foreignKey: 'provider_id', as: 'provider' });

// Service 1 -> many Bookings
Service.hasMany(Booking, { foreignKey: 'service_id', as: 'bookings' });
Booking.belongsTo(Service, { foreignKey: 'service_id', as: 'service' });

// Booking 1 -> 1 Review
Booking.hasOne(Review, { foreignKey: 'booking_id', as: 'review', onDelete: 'CASCADE' });
Review.belongsTo(Booking, { foreignKey: 'booking_id', as: 'booking' });

// Customer (User) 1 -> many Reviews
User.hasMany(Review, { foreignKey: 'customer_id', as: 'reviews' });
Review.belongsTo(User, { foreignKey: 'customer_id', as: 'customer' });

// Provider 1 -> many Reviews
Provider.hasMany(Review, { foreignKey: 'provider_id', as: 'reviews' });
Review.belongsTo(Provider, { foreignKey: 'provider_id', as: 'provider' });

// Provider 1 -> many Availability records
Provider.hasMany(Availability, { foreignKey: 'provider_id', as: 'availability', onDelete: 'CASCADE' });
Availability.belongsTo(Provider, { foreignKey: 'provider_id', as: 'provider' });

module.exports = { sequelize, User, Category, Service, Provider, ProviderService, Booking, Review, Availability };
