// WebDAV 同步引擎（框架无关）：坚果云等标准 WebDAV 服务均可配置使用
// HTTP 层可注入：H5 用 fetch（受 CORS 限制），Capacitor 原生用 CapacitorHttp（绕过 CORS）

import type { Bag, Item, LocationNode } from '../domain/types';
import type { SyncPayload } from '../domain/sync';

export interface WebDavConfig {
  server: string; // 如 https://dav.jianguoyun.com/dav/
  dir: string; // 备份目录名，如 storage-inventory
  username: string;
  password: string; // 坚果云需使用「应用密码」，非登录密码
}

export interface HttpResponse {
  status: number;
  text: string;
  ok: boolean;
}

export interface HttpAdapter {
  request(
    method: string,
    url: string,
    headers: Record<string, string>,
    body?: string
  ): Promise<HttpResponse>;
}

// ---------- HTTP 适配 ----------

export const fetchAdapter: HttpAdapter = {
  async request(method, url, headers, body) {
    try {
      const res = await fetch(url, { method, headers, body });
      const text = await res.text();
      return { status: res.status, text, ok: res.ok };
    } catch (e) {
      // fetch 抛错通常是网络或 CORS 拦截，归一为 status 0
      return { status: 0, text: String(e), ok: false };
    }
  }
};

export function isNativeCapacitor(): boolean {
  try {
    const w = window as any;
    return !!w?.Capacitor?.isNativePlatform?.();
  } catch {
    return false;
  }
}

export function defaultAdapter(): HttpAdapter {
  if (isNativeCapacitor()) {
    // 原生端走 Capacitor 原生网络层，不受浏览器 CORS 限制
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    try {
      const { CapacitorHttp } = require('@capacitor/core');
      return {
        async request(method, url, headers, body) {
          const r = await CapacitorHttp.request({
            method,
            url,
            headers,
            data: body,
            readAsTimeout: 60000
          });
          const text = typeof r.data === 'string' ? r.data : JSON.stringify(r.data);
          return { status: r.status, text, ok: r.status >= 200 && r.status < 300 };
        }
      };
    } catch {
      // Capacitor 不可用时回落 fetch
    }
  }
  return fetchAdapter;
}

// ---------- WebDAV 客户端 ----------

function normalize(config: WebDavConfig): { base: string; fileUrl: string; auth: string } {
  const server = config.server.replace(/\/+$/, '');
  const dir = config.dir.replace(/^\/+|\/+$/g, '') || 'storage-inventory';
  const base = `${server}/${dir}`;
  const token = btoa(`${config.username}:${config.password}`);
  return { base, fileUrl: `${base}/backup.json`, auth: `Basic ${token}` };
}

export class WebDavClient {
  constructor(private config: WebDavConfig, private http: HttpAdapter = defaultAdapter()) {}

  // 测试连接：PROPFIND 目录（已存在 207，不存在 404 都算"连通"）
  async test(): Promise<{ ok: boolean; message: string }> {
    const { base, auth } = normalize(this.config);
    const r = await this.http.request('PROPFIND', base, {
      Authorization: auth,
      Depth: '0'
    });
    if (r.status === 0)
      return {
        ok: false,
        message: '网络被拦截：浏览器端受跨域(CORS)限制，请在 App 内使用同步功能'
      };
    if (r.ok || r.status === 207 || r.status === 404)
      return { ok: true, message: r.status === 404 ? '连接成功（备份目录将自动创建）' : '连接成功' };
    if (r.status === 401) return { ok: false, message: '账号或应用密码错误（坚果云需用应用密码）' };
    return { ok: false, message: `服务器返回 ${r.status}` };
  }

  private async ensureDir(): Promise<void> {
    const { base, auth } = normalize(this.config);
    const r = await this.http.request('MKCOL', base, { Authorization: auth });
    // 405 = 目录已存在；其他非 2xx 也不视为致命（部分服务器 PUT 自动建目录）
    if (r.status !== 0 && !r.ok && r.status !== 405 && r.status !== 301) {
      throw new Error(`创建备份目录失败（${r.status}）`);
    }
  }

  async upload(payload: SyncPayload): Promise<void> {
    const { fileUrl, auth } = normalize(this.config);
    await this.ensureDir();
    const r = await this.http.request(
      'PUT',
      fileUrl,
      {
        Authorization: auth,
        'Content-Type': 'application/json'
      },
      JSON.stringify(payload)
    );
    if (r.status === 0) throw new Error('网络被拦截：请在 App 内使用同步（CORS）');
    if (!r.ok) throw new Error(`上传失败（${r.status}）`);
  }

  async download(): Promise<SyncPayload | null> {
    const { fileUrl, auth } = normalize(this.config);
    const r = await this.http.request('GET', fileUrl, { Authorization: auth });
    if (r.status === 404) return null;
    if (r.status === 0) throw new Error('网络被拦截：请在 App 内使用同步（CORS）');
    if (!r.ok) throw new Error(`下载失败（${r.status}）`);
    try {
      return JSON.parse(r.text) as SyncPayload;
    } catch {
      throw new Error('远端文件不是有效备份');
    }
  }
}
