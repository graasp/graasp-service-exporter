import Puppeteer from 'puppeteer';
import glob from 'glob';
import { makeElementsLinkAbsolute } from './utils';
import {
  GRAASP_HOST,
  DEFAULT_LANGUAGE,
  TMP_FOLDER,
  SCREENSHOT_FORMAT,
} from '../config';
import { retrieveBaseUrl, getDownloadUrl, screenshotElements } from './export';

let browser;
let page;
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

const closePuppeteer = async () => {
  await browser.close();
};

const containsImgPaths = paths => {
  glob(`${TMP_FOLDER}/*.${SCREENSHOT_FORMAT}`, {}, (err, files) => {
    if (err) {
      throw err;
    }
    expect(files).toEqual(expect.arrayContaining(paths));
  });
};

const getSrcValue = async element => {
  const value = await page.evaluate(el => el.getAttribute('src'), element);
  return value;
};

describe('makeElementsLinkAbsolute', () => {
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
    await makeElementsLinkAbsolute([iframe], 'src', baseUrl, page);
    const url = await getSrcValue(iframe);

    expect(url).toMatch(resultUrl);
  };

  it('if attrName is empty, src url stays unchanged', async () => {
    const iframe = await page.$('#iframe-https');

    await makeElementsLinkAbsolute([iframe], '', 'https://graasp.eu/', page);
    const url = await getSrcValue(iframe);

    expect(url).toMatch('https://graasp.eu/');
  });

  it('if selector is null, no error is thrown', async () => {
    const el = await page.$('no-selector');

    expect(
      makeElementsLinkAbsolute([el], 'src', 'https://graasp.eu/', page)
    ).resolves.not.toThrow();
  });

  it('https:// url stays unchanged ', async () => {
    await evaluateMakeElementLinkAbsolute(
      '#iframe-https',
      'https://graasp.eu/',
      `https://graasp.eu/`
    );
  });

  it('http:// url stays unchanged ', async () => {
    await evaluateMakeElementLinkAbsolute(
      '#iframe-http',
      'https://graasp.eu/',
      `http://graasp.eu/`
    );
  });

  it('missing ending / base url throws error', async () => {
    const iframe = await page.$('#iframe-https');

    expect(
      makeElementsLinkAbsolute([iframe], 'src', 'https:/graasp.eu', page)
    ).rejects.toThrow();
  });

  it('missing beginning http base url throws error', async () => {
    const iframe = await page.$('#iframe-https');

    expect(
      makeElementsLinkAbsolute([iframe], 'src', 'graasp.eu/', page)
    ).rejects.toThrow();
  });

  it('//graasp.eu becomes https://graasp.eu', async () => {
    await evaluateMakeElementLinkAbsolute(
      '#iframe-doubleslash',
      'https://graasp.eu/',
      `https://graasp.eu`
    );
  });

  it('https://graasp.eu/ + graasp.eu becomes https://graasp.eu/graasp.eu', async () => {
    await evaluateMakeElementLinkAbsolute(
      '#iframe-plain',
      'https://graasp.eu/',
      `https://graasp.eu/graasp.eu`
    );
  });

  it('https://graasp.eu/ + ./graasp.eu becomes https://graasp.eu/graasp.eu', async () => {
    await evaluateMakeElementLinkAbsolute(
      '#iframe-point',
      'https://graasp.eu/',
      `https://graasp.eu/graasp.eu`
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
    const href = await retrieveBaseUrl(page, HOST, selector);
    expect(href).toMatch(returnValue);
  };

  it('null base element returns https://', async () => {
    await evaluateRetrieveBaseUrl('no-selector', 'https://');
  });

  it('empty base url returns https://', async () => {
    await evaluateRetrieveBaseUrl('#base-empty', 'https://');
  });

  it('https://.../ base url returns the same https://.../', async () => {
    await evaluateRetrieveBaseUrl('#base-https-slash', 'https://graasp.eu/');
  });

  it('https://... base url returns https://.../', async () => {
    await evaluateRetrieveBaseUrl('#base-https-noslash', 'https://graasp.eu/');
  });

  it('http://.../ base url returns the same http://.../', async () => {
    await evaluateRetrieveBaseUrl('#base-http-slash', 'http://graasp.eu/');
  });

  it('http://... base url returns http://.../', async () => {
    await evaluateRetrieveBaseUrl('#base-http-noslash', 'http://graasp.eu/');
  });

  it('//.../ base url returns https://.../', async () => {
    await evaluateRetrieveBaseUrl(
      '#base-doubleslash-slash',
      'https://graasp.eu/'
    );
  });

  it('//... base url returns https://.../', async () => {
    await evaluateRetrieveBaseUrl(
      '#base-doubleslash-noslash',
      'https://graasp.eu/'
    );
  });
});

describe('getDownloadUrl', () => {
  const metaTags = `<meta name="download" value="https://graasp.eu/"></meta>
    <meta name="download" language="fr" value="https://graasp.eu/fr"></meta>`;

  const metaTagsWithEn = `${metaTags}<meta name="download" language="${DEFAULT_LANGUAGE}" 
    value="https://graasp.eu/${DEFAULT_LANGUAGE}"></meta>`;

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
    expect(url).toMatch(`https://graasp.eu/${DEFAULT_LANGUAGE}`);
  });

  it('language="" returns null if en doesnt exist', async () => {
    const url = await getDownloadUrl(metaTags, '');
    expect(url).toBeFalsy();
  });

  it('default language returns corresponding url if exists', async () => {
    const url = await getDownloadUrl(metaTagsWithEn, DEFAULT_LANGUAGE);
    expect(url).toMatch('https://graasp.eu/en');
  });

  it('default language returns null if doesnt exists', async () => {
    const url = await getDownloadUrl(metaTags, DEFAULT_LANGUAGE);
    expect(url).toBeFalsy();
  });

  it('lang=es returns default language url', async () => {
    const url = await getDownloadUrl(metaTagsWithEn, 'es');
    expect(url).toMatch(`https://graasp.eu/${DEFAULT_LANGUAGE}`);
  });
});

describe('screenshotElements', () => {
  let elements = null;

  beforeAll(async () => {
    await initPuppeteer();
    elements = await page.$$('div.toScreenshot');
  });

  afterAll(async () => {
    await closePuppeteer();
  });

  it('empty elements returns empty paths', async () => {
    const paths = await screenshotElements([], page);
    expect(paths.length).toBe(0);
  });

  it('1 element returns 1 path', async () => {
    const paths = await screenshotElements([elements[0]], page);
    expect(paths.length).toBe(1);
    containsImgPaths(paths);
  });

  it('3 elements returns 3 paths', async () => {
    const paths = await screenshotElements(elements, page);
    expect(paths.length).toBe(3);
    containsImgPaths(paths);
  });
});
