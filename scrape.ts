import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.goto('https://ncfu.ru/university/struct/');
  
  // click on all elements that might open an accordion
  await page.evaluate(() => {
    document.querySelectorAll('.accordion, .card-header, div').forEach(el => {
      if (el.textContent.includes('Институты') || el.textContent.includes('Факультеты')) {
        try { el.click() } catch (e) {}
      }
    });
  });
  
  await new Promise(r => setTimeout(r, 2000));
  
  const text = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('li, div.name, .title, a'))
      .map(el => el.textContent?.trim())
      .filter(text => text && (text.includes('Институт') || text.includes('Факультет') || text.includes('Школа') || text.includes('школа')));
  });
  
  console.log(Array.from(new Set(text)));
  await browser.close();
})();
