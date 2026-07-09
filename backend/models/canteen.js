const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Canteen = sequelize.define('Canteen', {
  canteen_id: {
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
    type: DataTypes.GEOMETRY('POINT', 4326),
    allowNull: false,
  },
  address: {
    type: DataTypes.STRING,
  },
}, {
  tableName: 'canteen',
  timestamps: false,
});

module.exports = Canteen; 