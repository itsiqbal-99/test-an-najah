import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const project = new URL('../', import.meta.url);
const html = readFileSync(new URL('an-najah-4.html', project), 'utf8');
const bootstrap = html.match(/<script>\s*([\s\S]*?)<\/script>/)[1];
const script = readFileSync(new URL('assets/an-najah-v2.js', project), 'utf8');
const css = readFileSync(new URL('assets/an-najah-v2.css', project), 'utf8');
const headerSetup = script.match(/const header = [\s\S]*?(?=\/\/ Pointer depth)/)[0];
const splashSetup = script.match(/const siteContent = [\s\S]*?(?=\nfunction setMenu)/)[0];

function boot({ theme, seen, reduced = false, blockedStorage = false } = {}) {
  const classes = new Set();
  const timers = [];
  const content = { inert: true, removeAttribute: () => { content.inert = false; } };
  const root = {
    dataset: { theme: 'light' },
    classList: {
      contains: (name) => classes.has(name),
      add: (...names) => names.forEach((name) => classes.add(name)),
      remove: (...names) => names.forEach((name) => classes.delete(name))
    }
  };
  const storage = (value) => ({ getItem: () => { if (blockedStorage) throw new Error('Storage unavailable'); return value; } });
  vm.runInNewContext(bootstrap, {
    document: { documentElement: root, getElementById: () => content },
    localStorage: storage(theme), sessionStorage: storage(seen),
    matchMedia: () => ({ matches: reduced }),
    window: { setTimeout: (callback, delay) => { timers.push({ callback, delay }); } }
  });
  return { root, classes, timers, content };
}

test('first visit defaults to light and starts the logo splash', () => {
  const state = boot();
  assert.equal(state.root.dataset.theme, 'light');
  assert.ok(state.classes.has('splash-active'));
});

test('explicit saved dark preference is honored; invalid values use light', () => {
  assert.equal(boot({ theme: 'dark' }).root.dataset.theme, 'dark');
  assert.equal(boot({ theme: 'invalid' }).root.dataset.theme, 'light');
});

test('new page loads replay the splash; reduced motion still skips it', () => {
  assert.equal(boot({ seen: 'seen' }).classes.has('splash-active'), true);
  assert.equal(boot({ reduced: true }).classes.has('splash-active'), false);
});

test('blocked browser storage cannot prevent rendering', () => {
  assert.equal(boot({ blockedStorage: true }).root.dataset.theme, 'light');
});

test('splash watchdog releases the screen within 4600 ms', () => {
  const state = boot();
  assert.equal(state.timers[0].delay, 4600);
  state.timers[0].callback();
  assert.equal(state.classes.has('splash-active'), false);
  assert.equal(state.classes.has('has-js'), false);
  assert.equal(state.content.inert, false);
});

test('company-profile sections exist and registration is absent', () => {
  for (const id of ['tentang', 'program', 'fasilitas', 'galeri', 'kegiatan', 'kehidupan', 'faq', 'media-sosial', 'kontak']) {
    assert.ok(html.includes(`id="${id}"`), `Missing section: ${id}`);
  }
  assert.doesNotMatch(html, /pendaftaran|penerimaan santriwati/i);
  assert.match(html, /Pelajaran Umum/);
  assert.ok((html.match(/<details /g) || []).length >= 5);
});

test('internal links resolve and local visual assets exist', () => {
  const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]));
  for (const [, anchor] of html.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.has(anchor), anchor);
  for (const [, path] of html.matchAll(/(?:src|href)="(assets\/[^"?#]+)(?:\?[^"#]+)?"/g)) {
    assert.ok(existsSync(fileURLToPath(new URL(path, project))), path);
  }
});

test('dummy activities are disclosed and all new windows are protected', () => {
  assert.match(html, /dummy untuk pratinjau desain/);
  assert.doesNotMatch(html, /bukan akun resmi maahad/);
  for (const [link] of html.matchAll(/<a\b[^>]*target="_blank"[^>]*>/g)) {
    assert.match(link, /rel="noopener noreferrer"/);
  }
});

function bootHeader(supported = true) {
  const classes = new Set();
  const sentinel = { id: 'headerSentinel' };
  const header = { classList: {
    add: (name) => classes.add(name),
    toggle: (name, enabled) => enabled ? classes.add(name) : classes.delete(name)
  } };
  const state = { classes, sentinel };
  class Observer {
    constructor(callback, options) { state.update = callback; state.options = options; }
    observe(target) { state.target = target; }
  }
  vm.runInNewContext(headerSetup, {
    document: {
      getElementById: (id) => id === 'siteHeader' ? header : sentinel,
      // A tall hero must not make the top-of-page navigation opaque.
      querySelector: () => ({ clientHeight: 1500 })
    },
    window: supported ? { IntersectionObserver: Observer } : {},
    IntersectionObserver: Observer
  });
  return state;
}

test('header follows the top sentinel and resets when returning to the top', () => {
  const state = bootHeader();
  assert.equal(state.target, state.sentinel);
  assert.equal(state.options.threshold, 0);
  assert.match(html, /id="headerSentinel" aria-hidden="true"/);
  state.update([{ isIntersecting: true }]);
  assert.equal(state.classes.has('is-scrolled'), false);
  state.update([{ isIntersecting: false }]);
  assert.equal(state.classes.has('is-scrolled'), true);
  state.update([{ isIntersecting: true }]);
  assert.equal(state.classes.has('is-scrolled'), false);
});

test('older browsers receive a readable solid navigation fallback', () => {
  assert.equal(bootHeader(false).classes.has('is-scrolled'), true);
});

function bootSplash({ photo = 'ready', reduced = false, legacyMediaQuery = false, missingImage = false } = {}) {
  const state = boot({ reduced });
  const timers = [];
  let now = 0;
  const motion = legacyMediaQuery
    ? { matches: reduced, addListener: (callback) => { state.changeMotion = callback; } }
    : { matches: reduced, addEventListener: (_name, callback) => { state.changeMotion = callback; } };
  const image = { decode: () => {
    if (photo === 'pending') return new Promise(() => {});
    return photo === 'failed' ? Promise.reject(new Error('Image failed')) : Promise.resolve();
  } };
  vm.runInNewContext(splashSetup, {
    root: state.root,
    document: { getElementById: () => state.content, querySelector: () => missingImage ? null : image },
    window: { setTimeout: (callback, delay) => { timers.push({ callback, at: now + delay }); } },
    motionPreference: motion,
    reduceMotion: reduced,
    Promise
  });
  async function flush() { for (let step = 0; step < 8; step++) await Promise.resolve(); }
  state.advance = async (duration) => {
    const end = now + duration;
    await flush();
    timers.sort((a, b) => a.at - b.at);
    while (timers.length && timers[0].at <= end) {
      const timer = timers.shift();
      now = timer.at;
      timer.callback();
      await flush();
      timers.sort((a, b) => a.at - b.at);
    }
    now = end;
    await flush();
  };
  state.motion = motion;
  return state;
}

test('splash holds for 2700 ms and unlocks only after its 740 ms exit', async () => {
  const state = bootSplash();
  await state.advance(2699);
  assert.equal(state.content.inert, true);
  assert.equal(state.classes.has('splash-leaving'), false);
  await state.advance(1);
  assert.ok(state.classes.has('splash-leaving'));
  assert.equal(state.content.inert, true);
  assert.equal(state.classes.has('page-ready'), false);
  await state.advance(739);
  assert.equal(state.content.inert, true);
  await state.advance(1);
  assert.equal(state.content.inert, false);
  assert.equal(state.classes.has('splash-active'), false);
  assert.ok(state.classes.has('page-ready'));
});

test('failed hero decoding does not block the normal splash exit', async () => {
  const state = bootSplash({ photo: 'failed' });
  await state.advance(3440);
  assert.equal(state.content.inert, false);
  assert.ok(state.classes.has('page-ready'));
});

test('a stalled image still releases the page after the bounded intro', async () => {
  const state = bootSplash({ photo: 'pending' });
  await state.advance(3099);
  assert.equal(state.classes.has('splash-leaving'), false);
  await state.advance(741);
  assert.equal(state.content.inert, false);
  assert.equal(state.classes.has('splash-active'), false);
});

test('official location, caretaker, and social channels are present', () => {
  assert.match(html, /Halaman SDN 019, Tembesi, Kec\. Sagulung, Kota Batam, Kepulauan Riau 29424/);
  assert.match(html, /Ust\. Said Salamah, S\.Pd\. M\.Pd/);
  assert.match(html, /google\.com\/maps\/embed\?pb=/);
  assert.match(html, /instagram\.com\/ppannajahbatam\//);
  assert.match(html, /whatsapp\.com\/channel\/0029VbB4FSZGpLHUtwvs5p0P/);
  assert.match(html, /facebook\.com\/p\/PP-An-Najah-Batam-100076337484506\//);
  assert.doesNotMatch(html, /youtube\.com/);
});

test('mobile splash has viewport fallbacks and visible frame motion', () => {
  assert.match(css, /min-height:\s*100vh;\s*min-height:\s*100svh/);
  assert.match(css, /height:\s*min\(80vh, 660px\);\s*height:\s*min\(80dvh, 660px\)/);
  assert.match(css, /botanical-frame-left/);
  assert.match(css, /botanical-frame-right/);
  assert.match(script, /heroPhoto\?\.decode/);
  assert.match(script, /motionPreference\.addListener/);
});

test('mobile splash survives a missing hero image and legacy media-query listeners', async () => {
  const state = bootSplash({ missingImage: true, legacyMediaQuery: true });
  await state.advance(3440);
  assert.equal(state.content.inert, false);
  assert.ok(state.classes.has('page-ready'));
  assert.equal(typeof state.changeMotion, 'function');
});

test('reduced motion opens the page immediately', () => {
  const state = bootSplash({ reduced: true });
  assert.equal(state.content.inert, false);
  assert.ok(state.classes.has('page-ready'));
});

test('enabling reduced motion during the splash releases the page immediately', async () => {
  const state = bootSplash({ photo: 'pending' });
  state.motion.matches = true;
  state.changeMotion({ matches: true });
  assert.equal(state.content.inert, false);
  assert.equal(state.classes.has('splash-active'), false);
  await state.advance(4000);
  assert.equal(state.content.inert, false);
  assert.equal(state.classes.has('splash-leaving'), false);
});
