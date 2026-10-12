// Creates the single Sequelize connection used by the whole backend.
const { Sequelize } = require('sequelize');
const configs = require('./config');

const env = process.env.NODE_ENV || 'development';
const cfg = configs[env];

const options = {
  host: cfg.host,
  port: cfg.port,
  dialect: cfg.dialect,
  logging: cfg.logging,
};
if (cfg.storage) options.storage = cfg.storage;

const sequelize = new Sequelize(cfg.database, cfg.username, cfg.password, options);

module.exports = sequelize;
