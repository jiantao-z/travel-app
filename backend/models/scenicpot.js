const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Scenicpot = sequelize.define('Scenicpot', {
  scenic_id: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  province: {
    type: DataTypes.STRING,
  },
  city: {
    type: DataTypes.STRING,
  },
  district: {
    type: DataTypes.STRING,
  },
  type: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  coordinates: {
    type: DataTypes.GEOMETRY('POLYGON', 4326),
  },
  address: {
    type: DataTypes.STRING,
  },
  geo_point: {
    type: DataTypes.GEOMETRY('POINT', 4326),
  },
}, {
  tableName: 'scenicpot',
  timestamps: false,
});

module.exports = Scenicpot; 