import puppeteer, { Page, WaitForOptions } from 'puppeteer';

type Fn = (page: Page) => Promise<void> | void;

export async function openUrl(url: string, fn: Fn = () => {}, options: WaitForOptions = {}) {
  console.log('[utils/puppeteer] open url:', url);
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(url, options);
  await fn(page);
  await browser.close();
}
