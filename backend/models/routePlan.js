const sequelize = require('../config/database');
const { DataTypes } = require('sequelize');

const RoutePlan = sequelize.define('RoutePlan', {
  plan_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  route_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'routes',
      key: 'route_id'
    }
  },
  name: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true,
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
    defaultValue: 0,
  },
  estimated_arrival: {
    type: DataTypes.DATE,
    allowNull: false,
    get() {
      const rawValue = this.getDataValue('estimated_arrival');
      return rawValue ? new Date(rawValue).toISOString() : null;
    },
    set(value) {
      this.setDataValue('estimated_arrival', new Date(value));
    }
  },
  duration_minutes: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1
    }
  },
  transportation_mode: {
    type: DataTypes.STRING(50),
    allowNull: true,
    defaultValue: '步行',
  },
}, {
  tableName: 'route_plans',
  timestamps: false,
});

module.exports = RoutePlan;