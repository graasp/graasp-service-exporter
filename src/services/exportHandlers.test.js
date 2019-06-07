import Puppeteer from 'puppeteer';
import fs from 'fs';
import glob from 'glob';
import path from 'path';
import {
  GRAASP_HOST,
  MODE_INTERACTIVE,
  MODE_READONLY,
  MODE_STATIC,
  DEFAULT_LANGUAGE,
  TMP_FOLDER,
  SCREENSHOT_FORMAT,
} from '../config';
import {
  handleApps,
  handleAudios,
  handleBackground,
  handleEmbedded,
  handleGadgets,
  handleLabs,
  handleObjects,
  handleOfflineLabs,
  handleUnsupported,
  handleVideos,
  generateEpub,
} from './export';
import {
  APP_ELEMENTS,
  EMBEDDED_ELEMENTS,
  GADGETS,
  LAB_ELEMENTS,
} from './selectors';

let browser;
let page;
let pageStatic;
let pageReadOnly;
let pageInteractive;
const timeout = 1000;

const initBrowser = async () => {
  // set jest timeout
  jest.setTimeout(10000);

  browser = await Puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    timeout: 0,
  });
};

const initPuppeteer = async () => {
  await initBrowser();
  page = await browser.newPage();
  await page.goto(`file://${__dirname}/export.test.html`, {
    waitUntil: 'domcontentloaded',
    timeout: 0,
  });
};

const initPuppeteerWithMode = async () => {
  await initBrowser();
  pageStatic = await browser.newPage();
  await pageStatic.goto(`file://${__dirname}/exportStatic.test.html`, {
    waitUntil: 'domcontentloaded',
    timeout: 0,
  });
  pageReadOnly = await browser.newPage();
  await pageReadOnly.goto(`file://${__dirname}/exportReadOnly.test.html`, {
    waitUntil: 'domcontentloaded',
    timeout: 0,
  });
  pageInteractive = await browser.newPage();
  await pageInteractive.goto(
    `file://${__dirname}/exportInteractive.test.html`,
    { waitUntil: 'domcontentloaded', timeout: 0 }
  );
};

const closePuppeteer = async () => {
  await browser.close();
};

const removeAllImages = async () => {
  const directory = TMP_FOLDER;
  fs.readdir(directory, (err, files) => {
    if (err) {
      throw err;
    }

    files.forEach(file => {
      fs.unlink(path.join(directory, file), error => {
        if (error) {
          throw error;
        }
      });
    });
  });
};

const fileExists = format => {
  glob(`${TMP_FOLDER}/*.${format}`, {}, (err, files) => {
    expect(files).toBeTruthy();
  });
};

describe('handleBackground', () => {
  beforeAll(async () => {
    await initPuppeteer();
  });

  afterAll(async () => {
    await closePuppeteer();
  });

  it('retrieve background', async () => {
    const backgroundUrl = await handleBackground(page, GRAASP_HOST);
    expect(backgroundUrl).toBeTruthy();
  });
});

describe('handleApps', () => {
  beforeAll(async () => {
    await initPuppeteerWithMode();
  });

  afterAll(async () => {
    await closePuppeteer();
  });

  afterEach(async () => {
    removeAllImages();
  });

  it('interactive: apps remain', async () => {
    const screenshots = await handleApps(pageInteractive, MODE_INTERACTIVE);
    await pageInteractive.waitFor(timeout);
    expect(
      pageInteractive.waitForSelector(APP_ELEMENTS)
    ).resolves.not.toThrow();
    expect(screenshots.length).toBe(0);
  });

  it('read-only: apps become screenshots', async () => {
    const screenshots = await handleApps(pageReadOnly, MODE_READONLY);
    fileExists(SCREENSHOT_FORMAT);
    expect(screenshots.length).toBe(2);
  });

  it('static: apps become screenshots', async () => {
    const screenshots = await handleApps(pageStatic, MODE_STATIC);
    fileExists(SCREENSHOT_FORMAT);
    expect(screenshots.length).toBe(2);
  });
});

describe('handleAudios', () => {
  beforeAll(async () => {
    await initPuppeteerWithMode();
  });

  afterAll(async () => {
    await closePuppeteer();
  });

  afterEach(async () => {
    removeAllImages();
  });

  it('interactive: audios remain', async () => {
    const screenshots = await handleAudios(pageInteractive, MODE_INTERACTIVE);
    fileExists(SCREENSHOT_FORMAT);
    expect(screenshots.length).toBe(2);
  });

  it('read-only: audios become screenshots', async () => {
    const screenshots = await handleAudios(pageReadOnly, MODE_READONLY);
    fileExists(SCREENSHOT_FORMAT);
    expect(screenshots.length).toBe(2);
  });

  it('static: audios become screenshots', async () => {
    const screenshots = await handleAudios(pageStatic, MODE_STATIC);
    fileExists(SCREENSHOT_FORMAT);
    expect(screenshots.length).toBe(2);
  });
});

describe('handleVideos', () => {
  beforeAll(async () => {
    await initPuppeteerWithMode();
  });

  afterAll(async () => {
    await closePuppeteer();
  });
  afterEach(async () => {
    removeAllImages();
  });

  it('interactive: videos remain', async () => {
    const screenshots = await handleVideos(pageInteractive, MODE_INTERACTIVE);
    fileExists(SCREENSHOT_FORMAT);
    expect(screenshots.length).toBe(2);
  });

  it('read-only: videos become screenshots', async () => {
    const screenshots = await handleVideos(pageReadOnly, MODE_READONLY);
    fileExists(SCREENSHOT_FORMAT);
    expect(screenshots.length).toBe(2);
  });

  it('static: videos become screenshots', async () => {
    const screenshots = await handleVideos(pageStatic, MODE_STATIC);
    fileExists(SCREENSHOT_FORMAT);
    expect(screenshots.length).toBe(2);
  });
});

describe('handleEmbedded', () => {
  beforeAll(async () => {
    await initPuppeteerWithMode();
  });

  afterAll(async () => {
    await closePuppeteer();
  });
  afterEach(async () => {
    removeAllImages();
  });

  it('interactive: embedded elements remain', async () => {
    const screenshots = await handleEmbedded(pageInteractive, MODE_INTERACTIVE);
    await pageInteractive.waitFor(timeout);
    expect(
      pageInteractive.waitForSelector(EMBEDDED_ELEMENTS)
    ).resolves.not.toThrow();
    expect(screenshots.length).toBe(0);
  });

  it('read-only: embedded elements become screenshots', async () => {
    const screenshots = await handleEmbedded(pageReadOnly, MODE_READONLY);
    fileExists(SCREENSHOT_FORMAT);
    expect(screenshots.length).toBe(2);
  });

  it('static: embedded elements become screenshots', async () => {
    const screenshots = await handleEmbedded(pageStatic, MODE_STATIC);
    fileExists(SCREENSHOT_FORMAT);
    expect(screenshots.length).toBe(2);
  });
});

describe('handleLabs', () => {
  beforeAll(async () => {
    await initPuppeteerWithMode();
  });

  afterAll(async () => {
    await closePuppeteer();
  });
  afterEach(async () => {
    removeAllImages();
  });

  it('interactive: labs remain', async () => {
    const screenshots = await handleLabs(pageInteractive, MODE_INTERACTIVE);
    await pageInteractive.waitFor(timeout);
    expect(
      pageInteractive.waitForSelector(LAB_ELEMENTS)
    ).resolves.not.toThrow();
    expect(screenshots.length).toBe(0);
  });

  it('read-only: labs become screenshots', async () => {
    const screenshots = await handleLabs(pageReadOnly, MODE_READONLY);
    fileExists(SCREENSHOT_FORMAT);
    expect(screenshots.length).toBe(2);
  });

  it('static: labs become screenshots', async () => {
    const screenshots = await handleLabs(pageStatic, MODE_STATIC);
    fileExists(SCREENSHOT_FORMAT);
    expect(screenshots.length).toBe(2);
  });
});

describe('handleObjects', () => {
  beforeAll(async () => {
    await initPuppeteerWithMode();
  });

  afterAll(async () => {
    await closePuppeteer();
  });
  afterEach(async () => {
    removeAllImages();
  });

  it('interactive: object elements become screenshots', async () => {
    const screenshots = await handleObjects(pageInteractive, MODE_INTERACTIVE);
    fileExists(SCREENSHOT_FORMAT);
    expect(screenshots.length).toBe(2);
  });

  it('read-only: object elements become screenshots', async () => {
    const screenshots = await handleObjects(pageReadOnly, MODE_READONLY);
    fileExists(SCREENSHOT_FORMAT);
    expect(screenshots.length).toBe(2);
  });

  it('static: object elements become screenshots', async () => {
    const screenshots = await handleObjects(pageStatic, MODE_STATIC);
    fileExists(SCREENSHOT_FORMAT);
    expect(screenshots.length).toBe(2);
  });
});

describe('handleOfflineLabs', () => {
  const lang = DEFAULT_LANGUAGE;
  const baseUrl = 'https://example.com/';

  beforeAll(async () => {
    await initPuppeteerWithMode();
  });

  afterAll(async () => {
    await closePuppeteer();
  });
  afterEach(async () => {
    removeAllImages();
  });

  it('interactive: offline labs become iframe with srcdoc set', async () => {
    const screenshots = await handleOfflineLabs(
      pageInteractive,
      MODE_INTERACTIVE,
      lang,
      baseUrl
    );
    expect(screenshots.length).toBe(0);
  });

  it('read-only: offline labs become iframe with srcdoc set', async () => {
    const screenshots = await handleOfflineLabs(
      pageReadOnly,
      MODE_READONLY,
      lang,
      baseUrl
    );
    expect(screenshots.length).toBe(0);
  });

  it('static: offline labs become screenshots', async () => {
    const screenshots = await handleOfflineLabs(
      pageStatic,
      MODE_STATIC,
      lang,
      baseUrl
    );
    fileExists(SCREENSHOT_FORMAT);
    expect(screenshots.length).toBe(4);
  });
});

describe('handleUnsupported', () => {
  beforeAll(async () => {
    await initPuppeteerWithMode();
  });

  afterAll(async () => {
    await closePuppeteer();
  });
  afterEach(async () => {
    removeAllImages();
  });

  it('interactive: unsupported elements become screenshots', async () => {
    const screenshots = await handleUnsupported(
      pageInteractive,
      MODE_INTERACTIVE
    );
    fileExists(SCREENSHOT_FORMAT);
    expect(screenshots.length).toBeGreaterThan(0);
  });

  it('read-only: unsupported elements become screenshots', async () => {
    const screenshots = await handleUnsupported(pageReadOnly, MODE_READONLY);
    fileExists(SCREENSHOT_FORMAT);
    expect(screenshots.length).toBe(2);
  });

  it('static: unsupported elements become screenshots', async () => {
    const screenshots = await handleUnsupported(pageStatic, MODE_STATIC);
    fileExists(SCREENSHOT_FORMAT);
    expect(screenshots.length).toBe(2);
  });
});

describe('handleGadgets', () => {
  beforeAll(async () => {
    await initPuppeteerWithMode();
  });

  afterAll(async () => {
    await closePuppeteer();
  });
  afterEach(async () => {
    removeAllImages();
  });

  it('interactive: gadgets remain', async () => {
    const screenshots = await handleGadgets(pageInteractive, MODE_INTERACTIVE);
    await pageInteractive.waitFor(timeout);
    expect(pageInteractive.waitForSelector(GADGETS)).resolves.not.toThrow();
    expect(screenshots.length).toBe(0);
  });

  it('read-only: gadgets become screenshots', async () => {
    const screenshots = await handleGadgets(pageReadOnly, MODE_READONLY);
    fileExists(SCREENSHOT_FORMAT);
    expect(screenshots.length).toBe(2);
  });

  it('static: gadgets become screenshots', async () => {
    const screenshots = await handleGadgets(pageStatic, MODE_STATIC);
    fileExists(SCREENSHOT_FORMAT);
    expect(screenshots.length).toBe(2);
  });
});

describe('generateEpub', () => {
  it('generate epub with default parameters', async () => {
    await generateEpub({});
    fileExists('epub');
  });
});
