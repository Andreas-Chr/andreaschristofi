import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { Window } from 'happy-dom';
import ts from 'typescript';
import { setPanel, resizeCards } from '../src/scripts/disclosure.ts';
import { setMenuPanel } from '../src/scripts/menu.ts';
import { animateMenuIcon } from '../src/scripts/menu-icon.ts';
import { setContactPanel } from '../src/scripts/contact.ts';

const html = readFileSync(new URL('../dist/index.html', import.meta.url), 'utf8');
function fixture(source=html) {
  const window=new Window({url:'https://andreaschristofi.com',settings:{disableJavaScriptEvaluation:true,disableCSSFileLoading:true,disableJavaScriptFileLoading:true}});
  window.document.write(source);
  globalThis.window=window;
  globalThis.document=window.document;
  globalThis.matchMedia=()=>({matches:true});
  globalThis.getComputedStyle=window.getComputedStyle.bind(window);
  window.HTMLElement.prototype.getAnimations=()=>[];
  return window;
}
function enhance(name) {
  const source=readFileSync(new URL(`../src/components/${name}.astro`,import.meta.url),'utf8');
  const script=source.match(/<script>([\s\S]*?)<\/script>/)[1].replace(/import\s+\{\s*setPanel(?:, resizeCards)?\s*\}\s+from\s+['"][^'"]+['"];?/, '');
  const code=ts.transpileModule(script.replace(/import\s+\{\s*(?:setMenuPanel|animateMenuIcon|setContactPanel)\s*\}\s+from\s+['"][^'"]+['"];?/g, ''),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
  new Function('setPanel','resizeCards','setMenuPanel','animateMenuIcon','setContactPanel',code)(setPanel,resizeCards,setMenuPanel,animateMenuIcon,setContactPanel);
}

test('static output keeps the menu closed and exposes page content and native links',()=>{
  const w=fixture();
  assert.equal(document.querySelectorAll('main').length,1);
  assert.equal(document.querySelectorAll('h1').length,1);
  assert.equal(document.querySelector('.menu-panel').hidden,true);
  assert.equal(document.querySelector('.menu-panel').inert,true);
  assert.equal(document.querySelector('.menu-trigger').getAttribute('aria-expanded'),'false');
  for(const selector of ['.contact-panel','.phase-panel','.experience-panel']) {
    const panels=[...document.querySelectorAll(selector)];assert.ok(panels.length);
    panels.forEach(panel=>assert.equal(panel.hidden,false,selector));
  }
  assert.equal(document.querySelectorAll('.phase-panel').length,5);
  assert.equal(document.querySelectorAll('.experience-panel').length,8);
  assert.ok(document.querySelector('a[href="mailto:hello@andreaschristofi.com"]'));
  assert.ok(document.querySelector('a[download]'));
  assert.equal(document.querySelector('a[href^="/work"]'),null);
  w.close();
});

test('menu is non-modal; Escape restores focus and links retain navigation',()=>{
  const w=fixture();enhance('Header');
  const trigger=document.querySelector('.menu-trigger');
  const panel=document.querySelector('.menu-panel');
  assert.equal(panel.hidden,true);assert.equal(trigger.getAttribute('aria-expanded'),'false');
  trigger.dispatchEvent(new w.MouseEvent('mouseenter'));
  trigger.focus();
  window.dispatchEvent(new w.Event('resize'));
  document.body.click();
  assert.equal(panel.hidden,true);assert.equal(trigger.getAttribute('aria-expanded'),'false');
  trigger.focus();trigger.click();
  assert.equal(panel.hidden,false);assert.equal(document.activeElement,trigger);
  assert.equal(document.querySelector('[aria-modal],dialog,[role="menu"]'),null);
  panel.querySelector('a').focus();
  document.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
  assert.equal(panel.hidden,true);assert.equal(document.activeElement,trigger);
  trigger.click();
  const anchor=panel.querySelector('a[href="/#process"]');
  const click=new w.MouseEvent('click',{bubbles:true,cancelable:true});anchor.dispatchEvent(click);
  assert.equal(click.defaultPrevented,false);assert.equal(panel.hidden,true);
  w.close();
});

test('process always has exactly one selected phase and matching artwork',()=>{
  const w=fixture();enhance('Process');
  const buttons=[...document.querySelectorAll('.phase-trigger')];
  for(const index of [0,1,2,3,4,4,0]) {
    buttons[index].click();
    assert.equal(document.querySelectorAll('.phase-trigger[aria-expanded="true"]').length,1);
    assert.equal(document.querySelectorAll('.phase-panel:not([hidden])').length,1);
    assert.equal(document.querySelector(`.phase-panel:not([hidden])`).id,`phase-panel-${index}`);
    assert.equal(document.querySelector('[data-phase-art]:not([hidden])').dataset.phaseArt,String(index));
  }
  w.close();
});

test('experience keeps exactly one card open, including repeated selection',()=>{
  const w=fixture();enhance('Experience');
  const buttons=[...document.querySelectorAll('.experience-trigger')];
  assert.equal(document.querySelectorAll('.experience-panel:not([hidden])').length,1);
  buttons[1].click();buttons[3].click();
  assert.equal(document.querySelectorAll('.experience-panel:not([hidden])').length,1);
  assert.equal(document.querySelector('.experience-panel:not([hidden])').id,'experience-panel-3');
  [0,1,3].forEach(i=>buttons[i].click());
  assert.equal(document.querySelectorAll('.experience-panel:not([hidden])').length,1);
  w.close();
});

test('footer contact closes with Escape and restores trigger focus',()=>{
  const w=fixture();enhance('SiteFooter');
  const trigger=document.querySelector('.contact-trigger'), panel=document.querySelector('.contact-panel');
  trigger.click();assert.equal(panel.hidden,false);
  assert.equal(trigger.hidden,true);assert.equal(document.activeElement,document.querySelector('.contact-close'));
  panel.querySelector('a').focus();
  panel.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
  assert.equal(panel.hidden,true);assert.equal(document.activeElement,trigger);
  assert.equal(trigger.hidden,false);assert.equal(panel.inert,true);
  w.close();
});

test('closing panels become inert immediately and hide when the animation finishes',async()=>{
  const w=fixture('<button id="trigger" aria-expanded="true">Toggle</button><div id="panel"><a href="#">Link</a></div>');
  globalThis.matchMedia=()=>({matches:false});
  const panel=document.querySelector('#panel'),trigger=document.querySelector('#trigger');
  let finish;
  panel.animate=()=>({finished:new Promise(resolve=>{finish=resolve;})});
  panel.querySelector('a').focus();
  setPanel(panel,trigger,false);
  assert.equal(panel.hidden,false);assert.equal(panel.inert,true);
  assert.equal(document.activeElement,trigger);assert.equal(trigger.getAttribute('aria-expanded'),'false');
  finish();await Promise.resolve();assert.equal(panel.hidden,true);
  w.close();
});

test('routes, canonical URLs, policy anchors, and every local asset resolve in the build',()=>{
  const routes=['index.html','legal/index.html','404.html'];
  for(const file of routes) {
    const w=fixture(readFileSync(new URL(`../dist/${file}`,import.meta.url),'utf8'));
    const wave=document.querySelector('.top-background img.wave-fallback');
    assert.ok(wave, `${file}: static wave must render without JavaScript`);
    assert.equal(wave.getAttribute('alt'), '');
    assert.equal(wave.closest('astro-island'), null, 'fallback must survive renderer failure');
    assert.equal(document.querySelectorAll('h1').length,1,file);
    const ids=[...document.querySelectorAll('[id]')].map(n=>n.id);
    assert.equal(new Set(ids).size,ids.length,`duplicate IDs: ${file}`);
    for(const el of document.querySelectorAll('[src],[href],source[srcset]')) {
      const values=[el.getAttribute('src'),el.getAttribute('href'),...(el.getAttribute('srcset')||'').split(',').map(v=>v.trim().split(' ')[0])].filter(Boolean);
      for(const value of values) {
        if(value.startsWith('#')) { assert.ok(document.getElementById(value.slice(1)),`${file}: missing anchor ${value}`); continue; }
        if(!value.startsWith('/')||value.startsWith('//'))continue;
        const path=value.split('#')[0].split('?')[0];
        const target=resolve('dist',`.${path}`,path.endsWith('/')?'index.html':'');
        assert.ok(existsSync(target),`${file}: missing ${path}`);
      }
    }
    if(file==='404.html') assert.equal(document.querySelector('meta[name="robots"]').content,'noindex,follow');
    else assert.ok(document.querySelector('link[rel="canonical"]').href.startsWith('https://andreaschristofi.com/'));
    w.close();
  }
  const sitemap=readFileSync(new URL('../dist/sitemap-0.xml',import.meta.url),'utf8');
  assert.ok(!sitemap.includes('/404'));assert.ok(!sitemap.includes('/work'));assert.ok(sitemap.includes('/legal/'));
  assert.ok(!readdirSync('dist').includes('work'));
});
