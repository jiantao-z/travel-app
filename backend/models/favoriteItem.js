const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const FavoriteItem = sequelize.define('FavoriteItem', {
  item_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  fav_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  name: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  longitude: {
    type: DataTypes.DOUBLE,
    allowNull: true,
  },
  latitude: {
    type: DataTypes.DOUBLE,
    allowNull: true,
  },
  sort_order: {
    type: DataTypes.INTEGER,
    allowNull: false,
    // defaultValue: 1,
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'favorite_items',
  timestamps: false,
});

module.exports = FavoriteItem; 