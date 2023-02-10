import { isProd } from '@/constants';

export function debug(...args: any) {
  if (isProd) return console.log(...args);
}
