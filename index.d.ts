declare module 'feishu-notify' {
  export interface BotOptions {
    appId: string;
    appSecret: string;
    baseUrl?: string;
  }

  export interface SendOptions {
    type?: 'text' | 'post' | 'markdown' | 'card' | 'interactive';
    title?: string;
    receiveIdType?: 'open_id' | 'chat_id' | 'user_id' | 'email';
    appId?: string;
    appSecret?: string;
  }

  export class FeishuBot {
    constructor(opts: BotOptions);
    getToken(): Promise<string>;
    send(target: string, content: any, opts?: SendOptions): Promise<any>;
    text(target: string, message: string): Promise<any>;
    markdown(target: string, content: string, title?: string): Promise<any>;
    reply(messageId: string, content: any, opts?: SendOptions): Promise<any>;
  }

  export class FeishuWebhook {
    constructor(webhookUrl: string);
    send(content: any, opts?: SendOptions): Promise<any>;
    text(message: string): Promise<any>;
    markdown(content: string, title?: string): Promise<any>;
  }

  export function notify(
    target: string,
    message: any,
    opts?: SendOptions
  ): Promise<any>;
}
