import Puppeteer from 'puppeteer';
import fs from 'fs';
import glob from 'glob';
import path from 'path';
import {
  GRAASP_HOST,
  MODE_INTERACTIVE_ONLINE,
  MODE_INTERACTIVE_OFFLINE,
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
  await pageReadOnly.goto(
    `file://${__dirname}/exportInteractiveOffline.test.html`,
    {
      waitUntil: 'domcontentloaded',
      timeout: 0,
    }
  );
  pageInteractive = await browser.newPage();
  await pageInteractive.goto(
    `file://${__dirname}/exportInteractiveOnline.test.html`,
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

  it('interactive online: apps remain', async () => {
    const screenshots = await handleApps(
      pageInteractive,
      MODE_INTERACTIVE_ONLINE
    );
    await pageInteractive.waitFor(timeout);
    expect(
      pageInteractive.waitForSelector(APP_ELEMENTS)
    ).resolves.not.toThrow();
    expect(screenshots.length).toBe(0);
  });

  it('interactive offline: apps become screenshots', async () => {
    const screenshots = await handleApps(
      pageReadOnly,
      MODE_INTERACTIVE_OFFLINE
    );
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

  it('interactive online: audios remain', async () => {
    const screenshots = await handleAudios(
      pageInteractive,
      MODE_INTERACTIVE_ONLINE
    );
    fileExists(SCREENSHOT_FORMAT);
    expect(screenshots.length).toBe(2);
  });

  it('interactive offline: audios become screenshots', async () => {
    const screenshots = await handleAudios(
      pageReadOnly,
      MODE_INTERACTIVE_OFFLINE
    );
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

  it('interactive online: videos remain', async () => {
    const screenshots = await handleVideos(
      pageInteractive,
      MODE_INTERACTIVE_ONLINE
    );
    fileExists(SCREENSHOT_FORMAT);
    expect(screenshots.length).toBe(2);
  });

  it('interactive offline: videos become screenshots', async () => {
    const screenshots = await handleVideos(
      pageReadOnly,
      MODE_INTERACTIVE_OFFLINE
    );
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

  it('interactive online: embedded elements remain', async () => {
    const screenshots = await handleEmbedded(
      pageInteractive,
      MODE_INTERACTIVE_ONLINE
    );
    await pageInteractive.waitFor(timeout);
    expect(
      pageInteractive.waitForSelector(EMBEDDED_ELEMENTS)
    ).resolves.not.toThrow();
    expect(screenshots.length).toBe(0);
  });

  it('interactive offline: embedded elements become screenshots', async () => {
    const screenshots = await handleEmbedded(
      pageReadOnly,
      MODE_INTERACTIVE_OFFLINE
    );
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

  it('interactive online: labs remain', async () => {
    const screenshots = await handleLabs(
      pageInteractive,
      MODE_INTERACTIVE_ONLINE
    );
    await pageInteractive.waitFor(timeout);
    expect(
      pageInteractive.waitForSelector(LAB_ELEMENTS)
    ).resolves.not.toThrow();
    expect(screenshots.length).toBe(0);
  });

  it('interactive offline: labs become screenshots', async () => {
    const screenshots = await handleLabs(
      pageReadOnly,
      MODE_INTERACTIVE_OFFLINE
    );
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

  it('interactive online: object elements become screenshots', async () => {
    const screenshots = await handleObjects(
      pageInteractive,
      MODE_INTERACTIVE_ONLINE
    );
    fileExists(SCREENSHOT_FORMAT);
    expect(screenshots.length).toBe(2);
  });

  it('interactive offline: object elements become screenshots', async () => {
    const screenshots = await handleObjects(
      pageReadOnly,
      MODE_INTERACTIVE_OFFLINE
    );
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

  it('interactive online: offline labs become iframe with srcdoc set', async () => {
    const screenshots = await handleOfflineLabs(
      pageInteractive,
      MODE_INTERACTIVE_ONLINE,
      lang,
      baseUrl
    );
    expect(screenshots.length).toBe(0);
  });

  it('interactive offline: offline labs become iframe with srcdoc set', async () => {
    const screenshots = await handleOfflineLabs(
      pageReadOnly,
      MODE_INTERACTIVE_OFFLINE,
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

  it('interactive online: unsupported elements become screenshots', async () => {
    const screenshots = await handleUnsupported(
      pageInteractive,
      MODE_INTERACTIVE_ONLINE
    );
    fileExists(SCREENSHOT_FORMAT);
    expect(screenshots.length).toBeGreaterThan(0);
  });

  it('interactive offline: unsupported elements become screenshots', async () => {
    const screenshots = await handleUnsupported(
      pageReadOnly,
      MODE_INTERACTIVE_OFFLINE
    );
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

  it('interactive online: gadgets remain', async () => {
    const screenshots = await handleGadgets(
      pageInteractive,
      MODE_INTERACTIVE_ONLINE
    );
    await pageInteractive.waitFor(timeout);
    expect(pageInteractive.waitForSelector(GADGETS)).resolves.not.toThrow();
    expect(screenshots.length).toBe(0);
  });

  it('interactive offline: gadgets become screenshots', async () => {
    const screenshots = await handleGadgets(
      pageReadOnly,
      MODE_INTERACTIVE_OFFLINE
    );
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
