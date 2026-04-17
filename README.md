# feishu-notify

Send Feishu/Lark messages with zero boilerplate. Text, markdown, cards — one line.

[![npm version](https://badge.fury.io/js/feishu-notify.svg)](https://www.npmjs.com/package/feishu-notify)

## Install

```bash
npm install feishu-notify
```

## Quick Start

```js
const { notify } = require('feishu-notify');

// Set env vars: FEISHU_APP_ID, FEISHU_APP_SECRET
await notify('ou_xxxxxx', 'Hello from feishu-notify!');
```

Or with a webhook URL:
```js
await notify('https://open.feishu.cn/open-apis/bot/v2/hook/xxx', 'Deploy complete!');
```

## API

### `notify(target, message, opts?)`

One-liner shorthand. Auto-detects webhook vs bot.

- `target` — open_id (ou_xxx), chat_id (oc_xxx), email, or webhook URL
- `message` — string or card object
- `opts.type` — `'text'` (default) | `'markdown'` | `'card'`

```js
// Text
await notify('ou_xxx', 'Build failed on main branch');

// Markdown
await notify('ou_xxx', '**Error** in `utils.js` line 42', { type: 'markdown' });

// Webhook
await notify('https://open.feishu.cn/open-apis/bot/v2/hook/xxx', 'Job done');
```

### `FeishuBot`

For repeated sends — reuses token automatically.

```js
const { FeishuBot } = require('feishu-notify');

const bot = new FeishuBot({
  appId: process.env.FEISHU_APP_ID,
  appSecret: process.env.FEISHU_APP_SECRET,
});

await bot.text('ou_xxx', 'Hello!');
await bot.markdown('ou_xxx', '## Deploy Done\n- version: 1.2.3');
await bot.reply('om_xxx_message_id', 'Got it');
```

### `FeishuWebhook`

```js
const { FeishuWebhook } = require('feishu-notify');

const wh = new FeishuWebhook('https://open.feishu.cn/open-apis/bot/v2/hook/xxx');
await wh.text('Server restarted');
await wh.markdown('**Alert**: CPU > 90%', 'System Alert');
```

## Environment Variables

| Variable | Description |
|---|---|
| `FEISHU_APP_ID` | Your Feishu app ID (cli_xxx) |
| `FEISHU_APP_SECRET` | Your Feishu app secret |

## Why feishu-notify?

- Zero dependencies (pure Node.js built-ins only)
- Auto token refresh — never worry about expiry
- Works with both Bot API and Webhooks
- TypeScript types included
- Node 14+, no transpile needed

## License

MIT
