'use strict';
// Migration 4: providers table (one-to-one with users)
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('providers', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true, // one provider profile per user
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      experience: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      skills: { type: Sequelize.TEXT, allowNull: true },
      location: { type: Sequelize.STRING(150), allowNull: true },
      availability_status: { type: Sequelize.ENUM('available', 'busy', 'unavailable'), allowNull: false, defaultValue: 'available' },
      rating: { type: Sequelize.DECIMAL(2, 1), allowNull: false, defaultValue: 0 },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('providers');
  },
};
