'use strict';
// Migration 6: bookings table
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('bookings', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      customer_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      provider_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'providers', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL', // if a provider is removed, the booking stays but becomes unassigned
      },
      service_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'services', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      booking_date: { type: Sequelize.DATEONLY, allowNull: false },
      booking_time: { type: Sequelize.TIME, allowNull: false },
      address: { type: Sequelize.STRING(255), allowNull: false },
      problem_description: { type: Sequelize.TEXT, allowNull: false },
      notes: { type: Sequelize.TEXT, allowNull: true },
      estimated_price: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      status: {
        type: Sequelize.ENUM('Pending', 'Confirmed', 'Assigned', 'Accepted', 'In Progress', 'Completed', 'Cancelled', 'Rejected'),
        allowNull: false,
        defaultValue: 'Pending',
      },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });
    await queryInterface.addIndex('bookings', ['provider_id', 'booking_date', 'booking_time'], { name: 'bookings_provider_slot' });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('bookings');
  },
};
