const { User } = require('../models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const register = async (req, res) => {
  const { username, password } = req.body;
  try {
    const existUser = await User.findOne({ where: { username } });
    if (existUser) {
      return res.status(400).json({ message: '用户名已存在' });
    }
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ username, password: hash });
    res.status(201).json({ message: '注册成功', user: { id: user.id, username: user.username } });
  } catch (err) {
    res.status(500).json({ message: '注册失败', error: err.message });
  }
};

const login = async (req, res) => {
  const { username, password } = req.body;
  try {
    console.log('尝试登录用户:', username);
    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(400).json({ message: '用户名或密码错误' });
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ message: '用户名或密码错误' });
    }
    const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ message: '登录成功', token, user: { id: user.id, username: user.username } });
  } catch (err) {
    console.error('登录详细错误:', {
      error: err,
      stack: err.stack,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({ message: '登录失败' });
  }
};

module.exports = { register, login };