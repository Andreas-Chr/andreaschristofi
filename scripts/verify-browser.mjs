const {chromium}=await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
import {mkdirSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH || (process.platform==='darwin'?'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome':undefined),headless:true});
const out=process.env.QA_OUTPUT || '/private/tmp/handoff-qa';mkdirSync(out,{recursive:true});const report=[];
for(const width of [320,480,768,1024,1440,375,600,900,1200,1920]) {
 const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 for(const path of ['/','/legal/','/404.html']) {
  await page.goto((process.env.QA_ORIGIN || 'http://127.0.0.1:4323')+path);await page.evaluate(()=>document.fonts.ready);await page.waitForSelector('.page-loader',{state:'detached'});
  await page.evaluate(async()=>{const imgs=[...document.images];imgs.forEach(i=>i.loading='eager');await Promise.all(imgs.filter(i=>!i.closest('[hidden]')).map(i=>i.decode().catch(()=>{})));});
  const geometry=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight,failed:[...document.images].filter(i=>!i.closest('[hidden]')&&(!i.complete||!i.naturalWidth)).map(i=>i.src),sections:[...document.querySelectorAll('.hero,.process,.about,.stack-experience,.awards,.footer-contact,.footer-info,.error-page')].map(n=>({name:n.className,y:n.getBoundingClientRect().y+scrollY,height:n.getBoundingClientRect().height})),overflow:[...document.querySelectorAll('main *')].filter(n=>!n.closest('[hidden]')&&getComputedStyle(n).position!=='absolute'&&n.getBoundingClientRect().right>innerWidth+1).slice(0,8).map(n=>({tag:n.tagName,cls:n.className,right:n.getBoundingClientRect().right}))}));
  assert.equal(geometry.scroll,width,`${path} at ${width}: horizontal overflow`);
  assert.deepEqual(geometry.failed,[],`${path}: missing images`);assert.deepEqual(errors,[],`${path}: console errors`);
  report.push({width,path,geometry,errors:[...errors]});
  if([320,480,768,1024,1440].includes(width))await page.screenshot({path:out+'/'+(path==='/'?'home':path.includes('legal')?'legal':'404')+'-'+width+'.png',fullPage:true});
  const trigger=page.locator('.menu-trigger');const rect=await trigger.boundingBox();await trigger.click();assert.deepEqual(await trigger.boundingBox(),rect);assert.equal(await trigger.getAttribute('aria-label'),'Close main menu');await page.keyboard.press('Escape');
  const contact=page.locator('.contact-trigger');await contact.click();assert.equal(await contact.isVisible(),false);assert.equal(await page.locator('.contact-close').evaluate(n=>document.activeElement===n),true);await page.keyboard.press('Escape');assert.equal(await contact.isVisible(),true);
  if(path==='/') {for(const i of [1,2,3,4,0]){await page.locator('.phase-trigger').nth(i).click();assert.equal(await page.locator('.phase-panel:visible').count(),1);assert.equal(await page.locator('[data-phase-art]:visible').getAttribute('data-phase-art'),String(i));}for(const i of [2,4,4,0]){await page.locator('.experience-trigger').nth(i).click();assert.equal(await page.locator('.experience-panel:visible').count(),1);}}
 }
 await page.close();
}
writeFileSync(out+'/report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report.map(r=>({width:r.width,path:r.path,height:r.geometry.height,overflow:r.geometry.scroll-r.width,failed:r.geometry.failed,errors:r.errors}))));await browser.close();
