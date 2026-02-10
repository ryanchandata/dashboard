/**
 * Tests for public/app.js - Frontend application logic
 */

import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const indexHtmlPath = path.join(__dirname, 'index.html');
const appJsPath = path.join(__dirname, 'app.js');

test('Frontend Structure - Index HTML', async (t) => {
  const content = fs.readFileSync(indexHtmlPath, 'utf8');

  await t.test('index.html exists', () => {
    assert.ok(fs.existsSync(indexHtmlPath));
  });

  await t.test('index.html has minimal inline script (only <script src> tag)', () => {
    // Extract content inside <script> tags
    const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/g;
    const inlineScripts = [];
    let match;
    while ((match = scriptRegex.exec(content)) !== null) {
      if (!match[0].includes('src=')) {
        inlineScripts.push(match[1].trim());
      }
    }
    // Should have no inline scripts, only external reference
    assert.equal(inlineScripts.length, 0, 'No inline scripts should exist');
  });

  await t.test('index.html loads app.js via external script tag', () => {
    assert.match(content, /<script\s+src="\/app\.js"><\/script>/, 'Must have <script src="/app.js"></script>');
  });

  await t.test('index.html contains only HTML structure (no onclick/onload attributes in HTML)', () => {
    // Check for HTML event handler attributes (onclick=, onload=, etc.) but not CSS classes like .on
    assert.doesNotMatch(content, /<\w+[^>]*\son\w+\s*=/, 'Should not have inline event handler attributes (onclick=, onload=, etc.)');
  });

  await t.test('index.html has key structural elements', () => {
    assert.match(content, /<div\s+id="grid"\s+class="grid"><\/div>/, 'Must have <div id="grid">');
    assert.match(content, /<div\s+id="logModal"/, 'Must have <div id="logModal">');
    assert.match(content, /<div\s+id="logTitle"/, 'Must have <div id="logTitle">');
    assert.match(content, /<div\s+id="logBody"/, 'Must have <div id="logBody">');
  });

  await t.test('index.html has title tag', () => {
    assert.match(content, /<title>Project Dashboard<\/title>/);
  });

  await t.test('index.html has CSS styling (not removed)', () => {
    assert.match(content, /<style>/);
    assert.match(content, /--accent.*--danger/s);
  });

  await t.test('Buttons do not use onclick attributes', () => {
    assert.doesNotMatch(content, /onclick="/);
  });
});

test('Frontend Structure - App JS', async (t) => {
  const appContent = fs.readFileSync(appJsPath, 'utf8');

  await t.test('app.js exists', () => {
    assert.ok(fs.existsSync(appJsPath));
  });

  await t.test('app.js exports fetchProjects function', () => {
    assert.match(appContent, /async function fetchProjects\s*\(\s*\)/);
  });

  await t.test('app.js exports postAction function', () => {
    assert.match(appContent, /async function postAction\s*\(\s*id\s*,\s*action\s*\)/);
  });

  await t.test('app.js exports viewLog function', () => {
    assert.match(appContent, /async function viewLog\s*\(\s*id\s*,\s*type\s*\)/);
  });

  await t.test('app.js exports closeModal function', () => {
    assert.match(appContent, /function closeModal\s*\(\s*evt\s*\)/);
  });

  await t.test('app.js exports renderCard function', () => {
    assert.match(appContent, /function renderCard\s*\(\s*project\s*\)/);
  });

  await t.test('app.js exports render function', () => {
    assert.match(appContent, /async function render\s*\(\s*\)/);
  });

  await t.test('app.js exports init function', () => {
    assert.match(appContent, /async function init\s*\(\s*\)/);
  });

  await t.test('app.js exports attachEventListeners function', () => {
    assert.match(appContent, /function attachEventListeners\s*\(\s*\)/);
  });

  await t.test('app.js has DOMContentLoaded event listener for init', () => {
    assert.match(appContent, /document\.addEventListener\s*\(\s*['"]DOMContentLoaded['"],\s*init\s*\)/);
  });

  await t.test('app.js calls setInterval for auto-refresh (10 seconds)', () => {
    assert.match(appContent, /setInterval\s*\(\s*render\s*,\s*10000\s*\)/);
  });

  await t.test('fetchProjects calls /api/projects endpoint', () => {
    assert.match(appContent, /fetch\s*\(\s*['"]\/api\/projects['"]\s*\)/);
  });

  await t.test('postAction uses POST method', () => {
    assert.match(appContent, /method\s*:\s*['"]POST['"]/);
  });

  await t.test('viewLog calls /api/projects/:id/logs endpoint', () => {
    assert.match(appContent, /\/api\/projects\/\$\{[a-z]+\}\/logs/);
  });

  await t.test('app.js uses data attributes for button actions', () => {
    assert.match(appContent, /data-action/);
    assert.match(appContent, /data-project-id/);
  });

  await t.test('app.js attaches event listeners via attachEventListeners function', () => {
    assert.match(appContent, /querySelectorAll\s*\(\s*['"]button\[data-action\]/);
  });

  await t.test('app.js calls attachEventListeners in render function', () => {
    assert.match(appContent, /attachEventListeners\s*\(\s*\)\s*;/);
  });

  await t.test('renderCard generates HTML with data attributes', () => {
    assert.match(appContent, /data-action="start"/);
    assert.match(appContent, /data-action="stop"/);
    assert.match(appContent, /data-action="tunnel-start"/);
    assert.match(appContent, /data-action="tunnel-stop"/);
    assert.match(appContent, /data-action="view-log"/);
  });

  await t.test('Modal close button uses data attribute', () => {
    assert.match(appContent, /data-action="close-modal"/);
  });
});

test('Frontend Functionality', async (t) => {
  const appContent = fs.readFileSync(appJsPath, 'utf8');

  await t.test('fetchProjects returns array or empty array', () => {
    assert.match(appContent, /return data\.projects \|\| \[\]/);
  });

  await t.test('postAction re-renders after action', () => {
    assert.match(appContent, /await render\(\)/);
  });

  await t.test('viewLog updates modal title with project id and log type', () => {
    assert.match(appContent, /logTitle.*textContent/s);
  });

  await t.test('viewLog shows modal by adding active class', () => {
    assert.match(appContent, /classList\.add\(['"]active['"]\)/);
  });

  await t.test('closeModal removes active class from modal', () => {
    assert.match(appContent, /classList\.remove\(['"]active['"]\)/);
  });

  await t.test('render fetches projects and populates grid', () => {
    assert.match(appContent, /const projects = await fetchProjects\(\)/);
    assert.match(appContent, /grid\.innerHTML/);
  });

  await t.test('renderCard shows project running status', () => {
    assert.match(appContent, /RUNNING.*STOPPED/s);
  });

  await t.test('renderCard shows tunnel status', () => {
    assert.match(appContent, /TUNNEL ON.*TUNNEL OFF/s);
  });

  await t.test('renderCard displays tunnel URL', () => {
    assert.match(appContent, /project\.tunnelUrl/);
  });

  await t.test('init renders on page load', () => {
    assert.match(appContent, /await render\(\)/);
  });

  await t.test('init sets up auto-refresh interval', () => {
    assert.match(appContent, /setInterval\(render, 10000\)/);
  });
});

test('API Endpoint Compatibility', async (t) => {
  const appContent = fs.readFileSync(appJsPath, 'utf8');

  await t.test('All action endpoints use correct path format', () => {
    // Template literals use ${variable} syntax - need to escape dollar sign in regex
    assert.match(appContent, /\/api\/projects\/\$\{[a-z]+\}\/[a-z-]+/);
  });

  await t.test('Logs endpoint uses correct path and query parameters', () => {
    assert.match(appContent, /\/api\/projects\/\$\{[a-z]+\}\/logs\?type=\$\{[a-z]+\}/);
  });

  await t.test('Response parsing looks for correct field names', () => {
    assert.match(appContent, /data\.projects/);
    assert.match(appContent, /data\.logs/);
  });
});

test('Event Handling', async (t) => {
  const appContent = fs.readFileSync(appJsPath, 'utf8');

  await t.test('Event listeners handle view-log action distinctly', () => {
    assert.match(appContent, /action === 'view-log'/);
  });

  await t.test('Event listeners handle view-log action by calling viewLog', () => {
    assert.match(appContent, /viewLog\(projectId, logType\)/);
  });

  await t.test('Event listeners handle other actions by calling postAction', () => {
    assert.match(appContent, /postAction\(projectId, action\)/);
  });

  await t.test('Modal click-outside-to-close is implemented', () => {
    assert.match(appContent, /modal\.addEventListener/);
  });

  await t.test('Modal close button click handler is attached', () => {
    assert.match(appContent, /closeBtn\.addEventListener/);
  });
});
