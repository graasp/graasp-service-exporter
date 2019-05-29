import Puppeteer from 'puppeteer';
import fs from 'fs';
import glob from 'glob';
import path from 'path';
import { evalMakeElementLinkAbsolute } from './utils';
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
  retrieveBaseUrl,
  getDownloadUrl,
  handleApps,
  handleAudios,
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
  AUDIOS,
  EMBEDDED_ELEMENTS,
  GADGETS,
  LAB_ELEMENTS,
  OBJECT_ELEMENTS,
  OFFLINE_READY_IFRAMES,
  UNSUPPORTED_ELEMENTS,
  VIDEOS,
} from './selectors';

let browser;
let page;
let pageStatic;
let pageReadOnly;
let pageInteractive;
const timeout = 1000;
const HOST = GRAASP_HOST;

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
  await pageReadOnly.goto(`file://${__dirname}/exportReadonly.test.html`, {
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

const getSrcValue = async element => {
  const value = await page.evaluate(el => el.getAttribute('src'), element);
  return value;
};

const fileExists = format => {
  glob(`${TMP_FOLDER}/*.${format}`, {}, (err, files) => {
    expect(files).toBeTruthy();
  });
};

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
    await handleApps(pageInteractive, MODE_INTERACTIVE);
    await pageInteractive.waitFor(timeout);
    expect(
      pageInteractive.waitForSelector(APP_ELEMENTS)
    ).resolves.not.toThrow();
  });

  it('read-only: apps become screenshots', async () => {
    await handleApps(pageReadOnly, MODE_READONLY);
    await pageReadOnly.waitFor(timeout);
    expect(pageReadOnly.waitForSelector(APP_ELEMENTS)).rejects.toThrow();
    fileExists(SCREENSHOT_FORMAT);
  });

  it('static: apps become screenshots', async () => {
    await handleApps(pageStatic, MODE_STATIC);
    await pageStatic.waitFor(timeout);
    expect(pageStatic.waitForSelector(APP_ELEMENTS)).rejects.toThrow();
    fileExists(SCREENSHOT_FORMAT);
  });
});

describe('handleAudios', () => {
  beforeAll(async () => {
    await initPuppeteerWithMode();
  });

  afterAll(async () => {
    await closePuppeteer();
  });

  it('interactive: audios remain', async () => {
    await handleAudios(pageInteractive, MODE_INTERACTIVE);
    await pageInteractive.waitFor(timeout);
    expect(pageInteractive.waitForXPath(AUDIOS)).resolves.not.toThrow();
  });

  it('read-only: audios become screenshots', async () => {
    await handleAudios(pageReadOnly, MODE_READONLY);
    await pageReadOnly.waitFor(timeout);
    expect(pageReadOnly.waitForXPath(AUDIOS)).rejects.toThrow();
    fileExists(SCREENSHOT_FORMAT);
  });

  it('static: audios become screenshots', async () => {
    await handleAudios(pageStatic, MODE_STATIC);
    await pageStatic.waitFor(timeout);
    expect(pageStatic.waitForXPath(AUDIOS)).rejects.toThrow();
    fileExists(SCREENSHOT_FORMAT);
  });
});

describe('handleVideos', () => {
  beforeAll(async () => {
    await initPuppeteerWithMode();
  });

  afterAll(async () => {
    await closePuppeteer();
  });

  it('interactive: videos remain', async () => {
    await handleVideos(pageInteractive, MODE_INTERACTIVE);
    await pageInteractive.waitFor(timeout);
    expect(pageInteractive.waitForSelector(VIDEOS)).resolves.not.toThrow();
  });

  it('read-only: videos become screenshots', async () => {
    await handleVideos(pageReadOnly, MODE_READONLY);
    await pageReadOnly.waitFor(timeout);
    expect(pageReadOnly.waitForSelector(VIDEOS)).rejects.toThrow();
    fileExists(SCREENSHOT_FORMAT);
  });

  it('static: videos become screenshots', async () => {
    await handleVideos(pageStatic, MODE_STATIC);
    await pageStatic.waitFor(timeout);
    expect(pageStatic.waitForSelector(VIDEOS)).rejects.toThrow();
    fileExists(SCREENSHOT_FORMAT);
  });
});

describe('handleEmbedded', () => {
  beforeAll(async () => {
    await initPuppeteerWithMode();
  });

  afterAll(async () => {
    await closePuppeteer();
  });

  it('interactive: embedded elements remain', async () => {
    await handleEmbedded(pageInteractive, MODE_INTERACTIVE);
    await pageInteractive.waitFor(timeout);
    expect(
      pageInteractive.waitForSelector(EMBEDDED_ELEMENTS)
    ).resolves.not.toThrow();
  });

  it('read-only: embedded elements become screenshots', async () => {
    await handleEmbedded(pageReadOnly, MODE_READONLY);
    await pageReadOnly.waitFor(timeout);
    expect(pageReadOnly.waitForSelector(EMBEDDED_ELEMENTS)).rejects.toThrow();
    fileExists(SCREENSHOT_FORMAT);
  });

  it('static: embedded elements become screenshots', async () => {
    await handleEmbedded(pageStatic, MODE_STATIC);
    await pageStatic.waitFor(timeout);
    expect(pageStatic.waitForSelector(EMBEDDED_ELEMENTS)).rejects.toThrow();
    fileExists(SCREENSHOT_FORMAT);
  });
});

describe('handleLabs', () => {
  beforeAll(async () => {
    await initPuppeteerWithMode();
  });

  afterAll(async () => {
    await closePuppeteer();
  });

  it('interactive: labs remain', async () => {
    await handleLabs(pageInteractive, MODE_INTERACTIVE);
    await pageInteractive.waitFor(timeout);
    expect(
      pageInteractive.waitForSelector(LAB_ELEMENTS)
    ).resolves.not.toThrow();
  });

  it('read-only: labs become screenshots', async () => {
    await handleLabs(pageReadOnly, MODE_READONLY);
    await pageReadOnly.waitFor(timeout);
    expect(pageReadOnly.waitForSelector(LAB_ELEMENTS)).rejects.toThrow();
    fileExists(SCREENSHOT_FORMAT);
  });

  it('static: labs become screenshots', async () => {
    await handleLabs(pageStatic, MODE_STATIC);
    await pageStatic.waitFor(timeout);
    expect(pageStatic.waitForSelector(LAB_ELEMENTS)).rejects.toThrow();
    fileExists(SCREENSHOT_FORMAT);
  });
});

describe('handleObjects', () => {
  beforeAll(async () => {
    await initPuppeteerWithMode();
  });

  afterAll(async () => {
    await closePuppeteer();
  });

  it('interactive: object elements become screenshots', async () => {
    await handleObjects(pageInteractive, MODE_INTERACTIVE);
    await pageInteractive.waitFor(timeout);
    expect(pageReadOnly.waitForSelector(OBJECT_ELEMENTS)).rejects.toThrow();
    fileExists(SCREENSHOT_FORMAT);
  });

  it('read-only: object elements become screenshots', async () => {
    await handleObjects(pageReadOnly, MODE_READONLY);
    await pageReadOnly.waitFor(timeout);
    expect(pageReadOnly.waitForSelector(OBJECT_ELEMENTS)).rejects.toThrow();
    fileExists(SCREENSHOT_FORMAT);
  });

  it('static: object elements become screenshots', async () => {
    await handleObjects(pageStatic, MODE_STATIC);
    await pageStatic.waitFor(timeout);
    expect(pageStatic.waitForSelector(OBJECT_ELEMENTS)).rejects.toThrow();
    fileExists(SCREENSHOT_FORMAT);
  });
});

describe('handleOfflineLabs', () => {
  beforeAll(async () => {
    await initPuppeteerWithMode();
  });

  afterAll(async () => {
    await closePuppeteer();
  });

  it('interactive: offline labs become iframe with srcdoc set', async () => {
    await handleOfflineLabs(pageInteractive, MODE_INTERACTIVE);
    await pageInteractive.waitFor(timeout);
    expect(
      pageInteractive.waitForSelector(OFFLINE_READY_IFRAMES)
    ).rejects.toThrow();
    fileExists(SCREENSHOT_FORMAT);
  });

  it('read-only: offline labs become iframe with srcdoc set', async () => {
    await handleOfflineLabs(pageReadOnly, MODE_READONLY);
    await pageReadOnly.waitFor(timeout);
    expect(
      pageReadOnly.waitForSelector(OFFLINE_READY_IFRAMES)
    ).rejects.toThrow();
    fileExists(SCREENSHOT_FORMAT);
  });

  it('static: offline labs become screenshots', async () => {
    await handleOfflineLabs(pageStatic, MODE_STATIC);
    await pageStatic.waitFor(timeout);
    expect(pageStatic.waitForSelector(OFFLINE_READY_IFRAMES)).rejects.toThrow();
    fileExists(SCREENSHOT_FORMAT);
  });
});

describe('handleUnsupported', () => {
  beforeAll(async () => {
    await initPuppeteerWithMode();
  });

  afterAll(async () => {
    await closePuppeteer();
  });

  it('interactive: unsupported elements become screenshots', async () => {
    await handleUnsupported(pageInteractive, MODE_INTERACTIVE);
    await pageInteractive.waitFor(timeout);
    expect(
      pageInteractive.waitForSelector(UNSUPPORTED_ELEMENTS)
    ).rejects.toThrow();
    fileExists(SCREENSHOT_FORMAT);
  });

  it('read-only: unsupported elements become screenshots', async () => {
    await handleUnsupported(pageReadOnly, MODE_READONLY);
    await pageReadOnly.waitFor(timeout);
    expect(
      pageReadOnly.waitForSelector(UNSUPPORTED_ELEMENTS)
    ).rejects.toThrow();
    fileExists(SCREENSHOT_FORMAT);
  });

  it('static: unsupported elements become screenshots', async () => {
    await handleUnsupported(pageStatic, MODE_STATIC);
    await pageStatic.waitFor(timeout);
    expect(pageStatic.waitForSelector(UNSUPPORTED_ELEMENTS)).rejects.toThrow();
    fileExists(SCREENSHOT_FORMAT);
  });
});

describe('handleGadgets', () => {
  beforeAll(async () => {
    await initPuppeteerWithMode();
  });

  afterAll(async () => {
    await closePuppeteer();
  });

  it('interactive: gadgets remain', async () => {
    await handleGadgets(pageInteractive, MODE_INTERACTIVE);
    await pageInteractive.waitFor(timeout);
    expect(pageInteractive.waitForSelector(GADGETS)).resolves.not.toThrow();
  });

  it('read-only: gadgets become screenshots', async () => {
    await handleGadgets(pageReadOnly, MODE_READONLY);
    await pageReadOnly.waitFor(timeout);
    expect(pageReadOnly.waitForSelector(GADGETS)).rejects.toThrow();
    fileExists(SCREENSHOT_FORMAT);
  });

  it('static: gadgets become screenshots', async () => {
    await handleGadgets(pageStatic, MODE_STATIC);
    await pageStatic.waitFor(timeout);
    expect(pageStatic.waitForSelector(GADGETS)).rejects.toThrow();
    fileExists(SCREENSHOT_FORMAT);
  });
});

describe('makeElementLinkAbsolute', () => {
  beforeAll(async () => {
    await initPuppeteer();
  });

  afterAll(async () => {
    await closePuppeteer();
  });

  const evaluateMakeElementLinkAbsolute = async (
    selector,
    baseUrl,
    resultUrl
  ) => {
    const iframe = await page.$(selector);

    await evalMakeElementLinkAbsolute(page, iframe, 'src', baseUrl);
    const url = await getSrcValue(iframe);

    expect(url).toMatch(resultUrl);
  };

  it('if attrName is empty, src url stays unchanged', async () => {
    const iframe = await page.$('#iframe-https');

    await evalMakeElementLinkAbsolute(page, iframe, '', 'https://example.com/');
    const url = await getSrcValue(iframe);

    expect(url).toMatch('https://example.com/');
  });

  it('if selector is null, no error is thrown', async () => {
    const el = await page.$('no-selector');

    expect(
      evalMakeElementLinkAbsolute(page, el, 'src', 'https://example.com/')
    ).resolves.not.toThrow();
  });

  it('https:// url stays unchanged ', async () => {
    await evaluateMakeElementLinkAbsolute(
      '#iframe-https',
      'https://example.com/',
      `https://example.com`
    );
  });

  it('http:// url stays unchanged ', async () => {
    await evaluateMakeElementLinkAbsolute(
      '#iframe-http',
      'https://example.com/',
      `http://example.com`
    );
  });

  it('missing ending / base url throws error', async () => {
    const iframe = await page.$('#iframe-https');

    expect(
      evalMakeElementLinkAbsolute(page, iframe, 'src', 'https:/example.com')
    ).rejects.toThrow();
  });

  it('missing beginning http base url throws error', async () => {
    const iframe = await page.$('#iframe-https');

    expect(
      evalMakeElementLinkAbsolute(page, iframe, 'src', 'example.com/')
    ).rejects.toThrow();
  });

  it('//example.com becomes https://example.com', async () => {
    await evaluateMakeElementLinkAbsolute(
      '#iframe-doubleslash',
      'https://example.com/',
      `https://example.com`
    );
  });

  it('https://example.com/ + example.com becomes https://example.com/example.com', async () => {
    await evaluateMakeElementLinkAbsolute(
      '#iframe-plain',
      'https://example.com/',
      `https://example.com/example.com`
    );
  });

  it('https://example.com/ + ./example.com becomes https://example.com/example.com', async () => {
    await evaluateMakeElementLinkAbsolute(
      '#iframe-point',
      'https://example.com/',
      `https://example.com/example.com`
    );
  });
});

describe('retrieveBaseUrl', () => {
  beforeAll(async () => {
    await initPuppeteer();
  });

  afterAll(async () => {
    await closePuppeteer();
  });

  const evaluateRetrieveBaseUrl = async (selector, returnValue) => {
    const base = await page.$(selector);

    const href = await retrieveBaseUrl(base, HOST);
    expect(href).toMatch(returnValue);
  };

  it('null base element returns https://', async () => {
    await evaluateRetrieveBaseUrl('no-selector', 'https://');
  });

  it('empty base url returns https://', async () => {
    await evaluateRetrieveBaseUrl('#base-empty', 'https://');
  });

  it('https://.../ base url returns the same https://.../', async () => {
    await evaluateRetrieveBaseUrl('#base-https-slash', 'https://example.com/');
  });

  it('https://... base url returns https://.../', async () => {
    await evaluateRetrieveBaseUrl(
      '#base-https-noslash',
      'https://example.com/'
    );
  });

  it('http://.../ base url returns the same http://.../', async () => {
    await evaluateRetrieveBaseUrl('#base-http-slash', 'http://example.com/');
  });

  it('http://... base url returns http://.../', async () => {
    await evaluateRetrieveBaseUrl('#base-http-noslash', 'http://example.com/');
  });

  it('//.../ base url returns https://.../', async () => {
    await evaluateRetrieveBaseUrl(
      '#base-doubleslash-slash',
      'https://example.com/'
    );
  });

  it('//... base url returns https://.../', async () => {
    await evaluateRetrieveBaseUrl(
      '#base-doubleslash-noslash',
      'https://example.com/'
    );
  });
});

describe('getDownloadUrl', () => {
  const metaTags = `<meta name="download" value="https://example.com/"></meta>
  <meta name="download" language="fr" value="https://example.com/fr"></meta>`;

  const metaTagsWithEn = `${metaTags}<meta name="download" language="${DEFAULT_LANGUAGE}" 
  value="https://example.com/${DEFAULT_LANGUAGE}"></meta>`;

  it('content="" returns null', async () => {
    const url = await getDownloadUrl('', DEFAULT_LANGUAGE);
    expect(url).toBeFalsy();
  });

  it('content=null returns null', async () => {
    const url = await getDownloadUrl('', DEFAULT_LANGUAGE);
    expect(url).toBeFalsy();
  });

  it('language="" returns default language content if exist', async () => {
    const url = await getDownloadUrl(metaTagsWithEn, '');
    expect(url).toMatch(`https://example.com/${DEFAULT_LANGUAGE}`);
  });

  it('language="" returns null if en doesnt exist', async () => {
    const url = await getDownloadUrl(metaTags, '');
    expect(url).toBeFalsy();
  });

  it('default language returns corresponding url if exists', async () => {
    const url = await getDownloadUrl(metaTagsWithEn, DEFAULT_LANGUAGE);
    expect(url).toMatch('https://example.com/en');
  });

  it('default language returns null if doesnt exists', async () => {
    const url = await getDownloadUrl(metaTags, DEFAULT_LANGUAGE);
    expect(url).toBeFalsy();
  });

  it('lang=es returns default language url', async () => {
    const url = await getDownloadUrl(metaTagsWithEn, 'es');
    expect(url).toMatch(`https://example.com/${DEFAULT_LANGUAGE}`);
  });
});

describe('generateEpub', () => {
  it('generate epub with default parameters', async () => {
    await generateEpub({});
    fileExists('epub');
  });
});
