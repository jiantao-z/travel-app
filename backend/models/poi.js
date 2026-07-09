const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const POI = sequelize.define('POI', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  type: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  location: {
    type: DataTypes.GEOGRAPHY('POINT', 4326),
    allowNull: false,
  },
  opening_hours: {
    type: DataTypes.JSONB,
    allowNull: true,
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  popularity: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
}, {
  tableName: 'pois',
  timestamps: false,
});

module.exports = POI; 