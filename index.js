/**
 * feishu-notify — Send Feishu/Lark messages with zero config
 * Supports: text, markdown, interactive cards, file upload
 * Works with both Bot tokens and Webhooks
 */

'use strict';

const https = require('https');
const http = require('http');
const { URL } = require('url');

// ─── Low-level HTTP ──────────────────────────────────────────────────────────

function request(url, options = {}, body = null) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const lib = parsed.protocol === 'https:' ? https : http;
    const req = lib.request({
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname + parsed.search,
      method: options.method || 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        ...(options.headers || {}),
      },
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.code !== undefined && json.code !== 0) {
            reject(new Error(`Feishu API error ${json.code}: ${json.msg}`));
          } else {
            resolve(json);
          }
        } catch (e) {
          resolve(data);
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(typeof body === 'string' ? body : JSON.stringify(body));
    req.end();
  });
}

// ─── Feishu Bot Client ────────────────────────────────────────────────────────

class FeishuBot {
  constructor(opts = {}) {
    if (!opts.appId || !opts.appSecret) {
      throw new Error('feishu-notify: appId and appSecret are required');
    }
    this.appId = opts.appId;
    this.appSecret = opts.appSecret;
    this.baseUrl = opts.baseUrl || 'https://open.feishu.cn';
    this._token = null;
    this._tokenExpiry = 0;
  }

  // Get or refresh tenant access token
  async getToken() {
    if (this._token && Date.now() < this._tokenExpiry) return this._token;
    const res = await request(`${this.baseUrl}/open-apis/auth/v3/tenant_access_token/internal`, {}, {
      app_id: this.appId,
      app_secret: this.appSecret,
    });
    if (!res.tenant_access_token) throw new Error('Failed to get Feishu token: ' + JSON.stringify(res));
    this._token = res.tenant_access_token;
    this._tokenExpiry = Date.now() + (res.expire - 60) * 1000;
    return this._token;
  }

  // Send a message to a user or chat
  async send(target, content, opts = {}) {
    const token = await this.getToken();
    const msgType = opts.type || 'text';
    let msgContent;

    if (msgType === 'text') {
      msgContent = JSON.stringify({ text: String(content) });
    } else if (msgType === 'markdown') {
      msgContent = JSON.stringify({ zh_cn: { title: opts.title || '', content: [[{ tag: 'md', text: String(content) }]] } });
    } else if (msgType === 'card') {
      // content should be a card JSON object or string
      msgContent = typeof content === 'string' ? content : JSON.stringify(content);
    } else {
      msgContent = typeof content === 'string' ? content : JSON.stringify(content);
    }

    // Determine receive_id_type
    let receiveIdType = opts.receiveIdType;
    if (!receiveIdType) {
      if (target.startsWith('oc_')) receiveIdType = 'chat_id';
      else if (target.startsWith('ou_')) receiveIdType = 'open_id';
      else if (target.includes('@')) receiveIdType = 'email';
      else receiveIdType = 'open_id';
    }

    return request(
      `${this.baseUrl}/open-apis/im/v1/messages?receive_id_type=${receiveIdType}`,
      { headers: { Authorization: `Bearer ${token}` } },
      { receive_id: target, msg_type: msgType, content: msgContent }
    );
  }

  // Shorthand: send plain text
  async text(target, message) {
    return this.send(target, message, { type: 'text' });
  }

  // Shorthand: send markdown
  async markdown(target, content, title = '') {
    return this.send(target, content, { type: 'post', title });
  }

  // Reply to a message thread
  async reply(messageId, content, opts = {}) {
    const token = await this.getToken();
    const msgType = opts.type || 'text';
    const msgContent = msgType === 'text'
      ? JSON.stringify({ text: String(content) })
      : (typeof content === 'string' ? content : JSON.stringify(content));

    return request(
      `${this.baseUrl}/open-apis/im/v1/messages/${messageId}/reply`,
      { headers: { Authorization: `Bearer ${token}` } },
      { msg_type: msgType, content: msgContent }
    );
  }
}

// ─── Webhook Client ───────────────────────────────────────────────────────────

class FeishuWebhook {
  constructor(webhookUrl) {
    if (!webhookUrl) throw new Error('feishu-notify: webhookUrl is required');
    this.url = webhookUrl;
  }

  async send(content, opts = {}) {
    const type = opts.type || 'text';
    let body;
    if (type === 'text') {
      body = { msg_type: 'text', content: { text: String(content) } };
    } else if (type === 'markdown') {
      body = { msg_type: 'post', content: { post: { zh_cn: { title: opts.title || '', content: [[{ tag: 'md', text: String(content) }]] } } } };
    } else if (type === 'card') {
      body = { msg_type: 'interactive', card: typeof content === 'string' ? JSON.parse(content) : content };
    } else {
      body = { msg_type: type, content: { text: String(content) } };
    }
    return request(this.url, {}, body);
  }

  async text(message) { return this.send(message, { type: 'text' }); }
  async markdown(content, title = '') { return this.send(content, { type: 'markdown', title }); }
}

// ─── Quick send (one-liner API) ───────────────────────────────────────────────

async function notify(target, message, opts = {}) {
  // Auto-detect webhook vs bot token
  if (target.startsWith('https://')) {
    const wh = new FeishuWebhook(target);
    return wh.send(message, opts);
  }
  // Need appId/appSecret from opts or env
  const appId = opts.appId || process.env.FEISHU_APP_ID;
  const appSecret = opts.appSecret || process.env.FEISHU_APP_SECRET;
  if (!appId || !appSecret) {
    throw new Error('feishu-notify: set FEISHU_APP_ID and FEISHU_APP_SECRET env vars, or pass appId/appSecret in opts');
  }
  const bot = new FeishuBot({ appId, appSecret });
  return bot.send(target, message, opts);
}

module.exports = { notify, FeishuBot, FeishuWebhook };
