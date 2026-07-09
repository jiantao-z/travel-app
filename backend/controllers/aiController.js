const axios = require('axios');

/**
 * DeepSeek AI 代理接口
 * 前端不直接持有 API Key，由后端代理转发
 */

const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';

const planTravel = async (req, res) => {
  const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
  if (!DEEPSEEK_API_KEY) {
    return res.status(500).json({ message: '服务器未配置 DEEPSEEK_API_KEY 环境变量' });
  }

  try {
    const { messages, model, temperature, stream } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ message: '缺少 messages 参数' });
    }

    const resp = await axios.post(DEEPSEEK_API_URL, {
      model: model || 'deepseek-chat',
      messages,
      stream: stream || false,
      temperature: temperature ?? 0.3
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      timeout: 120000  // 2分钟超时
    });

    res.json(resp.data);
  } catch (err) {
    console.error('[AI] DeepSeek 请求失败:', err.message);
    if (err.response) {
      console.error('[AI] 响应状态:', err.response.status, err.response.data);
      return res.status(err.response.status).json({
        message: 'AI 服务请求失败',
        error: err.response.data
      });
    }
    res.status(500).json({ message: 'AI 服务请求异常', error: err.message });
  }
};

module.exports = { planTravel };
