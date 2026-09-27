import { createServer } from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { chromium } from '/Users/conny/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';

const root = '/Users/conny/Documents/Codex/2026-09-15/i-wan';
const require = createRequire(`${root}/MeConny-live/web/package.json`);
const { build } = require('esbuild');
const harness = `${root}/work/editorial-demo/pediatric-harness`;
const assets = `${root}/outputs/editorial-demo/evidence-assets`;
await mkdir(harness, { recursive: true });
await mkdir(assets, { recursive: true });
const entry = `
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import '../sources/Airway-Management-Assistant/src/index.css';
import AuthenticatedApp from '../sources/Airway-Management-Assistant/src/components/AuthenticatedApp.js';
import '../sources/Airway-Management-Assistant/src/styles.css';
function Preview() {
  const [activeInterface, setActiveInterface] = useState('ChatbotUi');
  return <AuthenticatedApp
    user={{picture: 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='}}
    isUserAdmin={true} chatbotLoaded={true} participantID=""
    activeInterface={activeInterface} setActiveInterface={setActiveInterface}
    showParticipantIDPopup={false} setShowParticipantIDPopup={()=>{}}
    isProfileModalVisible={false} setIsProfileModalVisible={()=>{}}
    setParticipantID={()=>{}} setChatbotLoaded={()=>{}} />;
}
createRoot(document.getElementById('root')).render(<Preview />);
`;
await writeFile(`${harness}/preview.jsx`, entry);
await build({
  entryPoints: [`${harness}/preview.jsx`],
  outfile: `${harness}/preview.js`, bundle: true, format: 'iife',
  loader: { '.js': 'jsx' },
  nodePaths: [`${root}/MeConny-live/web/node_modules`],
  define: { 'process.env.REACT_APP_BACKEND_URL': '"/fixture"', 'process.env.NODE_ENV': '"production"' },
  plugins: [{name:'unused-dependencies', setup(builder) {
    builder.onResolve({filter:/^(react-type-animation|@auth0\/auth0-react)$/}, args => ({path:args.path, namespace:'preview-stub'}));
    builder.onLoad({filter:/.*/, namespace:'preview-stub'}, args => ({contents: args.path==='react-type-animation'
      ? 'export const TypeAnimation = () => null;'
      : 'export const useAuth0 = () => ({logout: () => {}});', loader:'js'}));
  }}],
});
const server = createServer(async (req,res) => {
  if (req.url.startsWith('/fixture')) {
    res.setHeader('content-type','application/json');
    res.end(JSON.stringify(req.url==='/fixture/get_cases' ? {cases:[]} : req.url==='/fixture/api/instructions' ? [] : {}));
    return;
  }
  if (req.url==='/preview.js' || req.url==='/preview.css') {
    res.setHeader('content-type',req.url.endsWith('.js')?'application/javascript':'text/css');
    res.end(await readFile(path.join(harness,req.url)));
    return;
  }
  res.setHeader('content-type','text/html');
  res.end('<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="/preview.css"></head><body><div id="root"></div><script src="/preview.js"></script></body></html>');
});
await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
const url = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({channel:'chrome',headless:true});
const page = await browser.newPage({viewport:{width:1440,height:960},deviceScaleFactor:1});
const errors=[];
const external=[];
page.on('pageerror',err=>errors.push(err.message));
await page.route('**/*',route => {
  const target=route.request().url();
  if(target.startsWith(url)||target.startsWith('data:')||target.startsWith('https://fonts.googleapis.com/')||target.startsWith('https://fonts.gstatic.com/')) return route.continue();
  external.push(target);
  return route.abort();
});
try {
  await page.goto(url);
  await page.getByText('Please type "Begin Simulation" to begin').waitFor();
  await page.getByPlaceholder('Say something...').waitFor();
  await page.evaluate(()=>document.fonts.ready);
  await page.screenshot({path:`${assets}/pediatric-source-chat.png`});
  await page.getByRole('button',{name:'Case Editor',exact:true}).click();
  await page.getByRole('button',{name:'Add New Case',exact:true}).click();
  await page.getByPlaceholder('Scenario Outline',{exact:true}).waitFor();
  await page.screenshot({path:`${assets}/pediatric-source-case-editor.png`});
  await page.getByRole('button',{name:'Instruction Editor',exact:true}).click();
  await page.getByRole('button',{name:'Add New Instruction',exact:true}).click();
  await page.getByPlaceholder('Enter instruction content').waitFor();
  await page.screenshot({path:`${assets}/pediatric-source-instruction-editor.png`});
  await writeFile(`${harness}/capture.json`, JSON.stringify({url,errors,externalRequestsBlocked:external,
    sourceCommit:'9edcba81b3535c37852a89d2f6b6fac273843d6b',
    fixture:'No patient, participant, or conversation records. Empty cases. Chat greeting supplied by original source. Local backend fixture acknowledges initialization only. Auth0 logout and unused type animation imports are inert.',
    screenshotFiles:['pediatric-source-chat.png','pediatric-source-case-editor.png','pediatric-source-instruction-editor.png']},null,2));
  console.log(JSON.stringify({errors,output:assets}));
} finally {
  await browser.close();
  await new Promise(resolve=>server.close(resolve));
}
