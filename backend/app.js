const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const sequelize = require('./config/database');

// 路由
const authRoutes = require('./routes/auth');
const poisRoutes = require('./routes/pois');
const travelPlansRoutes = require('./routes/travelPlans');
const favoritesRoutes = require('./routes/favorites');
const locationsRoutes = require('./routes/locations');
const directionsRoutes = require('./routes/directions');
const aiRoutes = require('./routes/ai');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// 路由注册
app.use('/api/auth', authRoutes);
app.use('/api/pois', poisRoutes);
app.use('/api/travelPlans', travelPlansRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/locations', locationsRoutes);
app.use('/api/directions', directionsRoutes);
app.use('/api/ai', aiRoutes);

// 数据库连接测试
sequelize.authenticate()
  .then(() => {
    console.log('数据库连接成功');
    // 同步数据库表
    return sequelize.sync({ force: false }); // 使用force: true会删除已有表并重新创建
  })
  .then(() => console.log('数据库表同步成功'))
  .catch(err => console.error('数据库连接或同步失败:', err));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`后端服务已启动，端口：${PORT}`);
});

// Add error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : null
  });
});