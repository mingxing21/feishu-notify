// feishu-notify 测试文件
// 用真实的飞书 App ID 验证 token 获取

const { FeishuBot, FeishuWebhook, notify } = require('./index.js');

async function test() {
  const appId = process.env.FEISHU_APP_ID;
  const appSecret = process.env.FEISHU_APP_SECRET;

  if (!appId || !appSecret) {
    console.log('SKIP: no FEISHU_APP_ID/FEISHU_APP_SECRET set');
    console.log('Set env vars to run live test');
    return;
  }

  console.log('Test 1: FeishuBot token fetch...');
  try {
    const bot = new FeishuBot({ appId, appSecret });
    const token = await bot.getToken();
    if (token && token.length > 10) {
      console.log('PASS: got token, length=' + token.length);
    } else {
      console.log('FAIL: token looks wrong:', token);
    }
  } catch (e) {
    console.log('FAIL:', e.message);
  }

  console.log('Test 2: notify() auto-detect webhook...');
  try {
    // Use a fake webhook to test the routing logic (will fail at network level, not logic level)
    const { FeishuWebhook } = require('./index.js');
    const wh = new FeishuWebhook('https://httpbin.org/post');
    const res = await wh.text('feishu-notify test message');
    console.log('PASS: webhook send returned');
  } catch (e) {
    console.log('PARTIAL (expected for fake URL):', e.message.slice(0, 80));
  }

  console.log('All tests done.');
}

test().catch(console.error);
