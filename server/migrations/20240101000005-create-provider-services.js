'use strict';
// Migration 5: provider_services join table (many-to-many)
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('provider_services', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      provider_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'providers', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      service_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'services', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });
    await queryInterface.addIndex('provider_services', ['provider_id', 'service_id'], {
      unique: true,
      name: 'provider_services_unique_pair',
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('provider_services');
  },
};
