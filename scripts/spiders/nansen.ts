import { openUrl, delay } from '../../src/utils';

const startTime = Date.now();

const url = 'https://pro.nansen.ai';
const input = '0xab5c66752a9e8167967685f1450532fb96d5d24f';

openUrl(url, async (page) => {
  // 填写登录表单
  await page.waitForSelector('input[name=password]');
  await page.keyboard.sendCharacter('43506575@qq.com');
  await page.keyboard.press('Tab');
  await page.keyboard.sendCharacter('Wokan1xia~');
  await page.screenshot({ path: 'screenshots/nansen/1-login.png' });

  // 点击登录，跳转页面
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  await page.waitForNavigation();
  await page.screenshot({ path: 'screenshots/nansen/2-login-success.png' });

  // 打开 wallet profiler
  await page.goto(`${url}/wallet-profiler?address=${input}`);
  await delay(10000);
  await page.screenshot({ path: 'screenshots/nansen/3-wallet-profiler.png' });

  // 打开 labels 弹窗（要用会员账号才可以）
  await (await page.waitForSelector('#address_labels button')).click();
  await page.screenshot({ path: 'screenshots/nansen/4-wallet-profiler-labels.png' });

  // 解析 labels
  const labels = await page.evaluate(() =>
    [...document.querySelectorAll('#portal-root span[data-value=label]')].map((s) => (s as HTMLSpanElement).innerText || ''),
  );

  console.log('\ninput:', input);
  console.log('\noutput:', labels);
  console.log(`\ndone 🎉 (use ${(Date.now() - startTime / 1000).toFixed(1)}s)\n`);
});
