import Puppeteer from 'puppeteer';
import { evalMakeElementLinkAbsolute } from './utils';
import {
  GRAASP_HOST,
  MODE_INTERACTIVE,
  MODE_READONLY,
  MODE_STATIC,
} from '../config';
import {
  retrieveBaseUrl,
  handleApps,
  handleAudios,
  handleGadgets,
  handleLabs,
  handleVideos,
} from './export';
import {
  APP_ELEMENTS,
  AUDIOS,
  GADGETS,
  LAB_ELEMENTS,
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
  await page.goto(`file://${__dirname}/export.test.html`);
};

const initPuppeteerWithMode = async () => {
  await initBrowser();
  pageStatic = await browser.newPage();
  await pageStatic.goto(`file://${__dirname}/export_static.test.html`);
  pageReadOnly = await browser.newPage();
  await pageReadOnly.goto(`file://${__dirname}/export_readonly.test.html`);
  pageInteractive = await browser.newPage();
  await pageInteractive.goto(
    `file://${__dirname}/export_interactive.test.html`
  );
};

const closePuppeteer = async () => {
  await browser.close();
};

const getSrcValue = async element => {
  const value = await page.evaluate(el => el.getAttribute('src'), element);
  return value;
};

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
  });

  it('static: audios become screenshots', async () => {
    await handleAudios(pageStatic, MODE_STATIC);
    await pageStatic.waitFor(timeout);
    expect(pageStatic.waitForXPath(AUDIOS)).rejects.toThrow();
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
  });

  it('static: videos become screenshots', async () => {
    await handleVideos(pageStatic, MODE_STATIC);
    await pageStatic.waitFor(timeout);
    expect(pageStatic.waitForSelector(VIDEOS)).rejects.toThrow();
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
  });

  it('static: labs become screenshots', async () => {
    await handleLabs(pageStatic, MODE_STATIC);
    await pageStatic.waitFor(timeout);
    expect(pageStatic.waitForSelector(LAB_ELEMENTS)).rejects.toThrow();
  });
});

describe('handleGadgets', () => {
  beforeAll(async () => {
    await initPuppeteerWithMode();
  });

  afterAll(async () => {
    await closePuppeteer();
  });

  it('interactive: labs remain', async () => {
    await handleGadgets(pageInteractive, MODE_INTERACTIVE);
    await pageInteractive.waitFor(timeout);
    expect(pageInteractive.waitForSelector(GADGETS)).resolves.not.toThrow();
  });

  it('read-only: labs become screenshots', async () => {
    await handleGadgets(pageReadOnly, MODE_READONLY);
    await pageReadOnly.waitFor(timeout);
    expect(pageReadOnly.waitForSelector(GADGETS)).rejects.toThrow();
  });

  it('static: labs become screenshots', async () => {
    await handleGadgets(pageStatic, MODE_STATIC);
    await pageStatic.waitFor(timeout);
    expect(pageStatic.waitForSelector(GADGETS)).rejects.toThrow();
  });
});

describe('handleApps', () => {
  beforeAll(async () => {
    await initPuppeteerWithMode();
  });

  afterAll(async () => {
    await closePuppeteer();
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
  });

  it('static: apps become screenshots', async () => {
    await handleApps(pageStatic, MODE_STATIC);
    await pageStatic.waitFor(timeout);
    expect(pageStatic.waitForSelector(APP_ELEMENTS)).rejects.toThrow();
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
