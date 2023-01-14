export * from './puppeteer';

export const isDev = process.env.NODE_ENV !== 'production';

export const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
