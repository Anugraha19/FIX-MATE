// Database settings. Values come from the .env file - nothing secret is written in code.
// This file is used by BOTH the app (config/database.js) and sequelize-cli (migrations/seeders).
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const base = {
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || null,
  database: process.env.DB_NAME || 'fixmate_db',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  dialect: process.env.DB_DIALECT || 'mysql',
  logging: false,
};

// Only used for local smoke tests without MySQL (DB_DIALECT=sqlite). Normal use is MySQL.
if (base.dialect === 'sqlite') {
  base.storage = process.env.DB_STORAGE || ':memory:';
}

module.exports = {
  development: base,
  test: { ...base, database: `${base.database}_test` },
  production: base,
};
