import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

  await page.goto('https://manudeep.com/', { waitUntil: 'networkidle0' });
  
  const h1 = await page.$eval('h1', el => {
    const style = window.getComputedStyle(el);
    return { text: el.textContent, opacity: style.opacity, display: style.display, visibility: style.visibility };
  }).catch(e => e.message);
  
  const heroContent = await page.$eval('.hero-content', el => {
    const style = window.getComputedStyle(el);
    return { opacity: style.opacity, transform: style.transform };
  }).catch(e => e.message);

  console.log('H1 Status:', h1);
  console.log('Hero Content Status:', heroContent);

  await browser.close();
})();
