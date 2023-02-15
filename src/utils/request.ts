import axios from 'axios';

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  data?: any;
  timeout?: number;
  retry?: number;
}

export async function request<T>(url: string, options: RequestOptions = {}): Promise<T> {
  const { method, headers, data, timeout = 10000, retry = 0 } = options;
  try {
    const res = await axios({
      url,
      data,
      method: method || 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      timeout,
    });
    if (res.status !== 200) throw new Error(`[request] status: ${res.status} ${method} ${url}`);
    return res.data as T;
  } catch (e) {
    if (retry > 0) {
      return tryFn((count) => {
        console.log(`[request] retry (${count}) ${method} ${url}`);
        return request(url, options);
      }, retry);
    }
    throw e;
  }
}

export async function tryFn<T>(fn: (count: number) => Promise<T>, n: number, count = 1): Promise<T> {
  if (n <= 0) throw new Error('[retry] n must > 0');
  if (n < count) throw new Error('[retry] n must >= count');
  try {
    return await fn(count);
  } catch (e) {
    if (count === n) throw e;
    return tryFn(fn, n, count + 1);
  }
}
