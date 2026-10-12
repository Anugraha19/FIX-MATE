// Join table for the many-to-many link: a provider offers many services, a service has many providers.
module.exports = (sequelize, DataTypes) => {
  const ProviderService = sequelize.define(
    'ProviderService',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      provider_id: { type: DataTypes.INTEGER, allowNull: false },
      service_id: { type: DataTypes.INTEGER, allowNull: false },
    },
    {
      tableName: 'provider_services',
      indexes: [{ unique: true, fields: ['provider_id', 'service_id'] }], // same pair cannot repeat
    }
  );
  return ProviderService;
};
