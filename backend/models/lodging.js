const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Lodging = sequelize.define('Lodging', {
  lodging_id: {
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
  star_rating: {
    type: DataTypes.INTEGER,
  },
  coordinates: {
    type: DataTypes.GEOMETRY('POINT', 4326),
    allowNull: false,
  },
  address: {
    type: DataTypes.STRING,
  },
}, {
  tableName: 'lodging',
  timestamps: false,
});

module.exports = Lodging; 