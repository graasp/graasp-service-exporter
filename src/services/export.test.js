import Puppeteer from 'puppeteer';
import { makeElementLinkAbsolute, retrieveBaseUrl } from './export';

let browser;
let page;

const initPuppeteer = async () => {
  // set jest timeout
  jest.setTimeout(10000);

  browser = await Puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    timeout: 0,
  });
  page = await browser.newPage();
  await page.goto(`file://${__dirname}/export.test.html`);
  return { browser, page };
};

const closePuppeteer = async () => {
  await browser.close();
};

const getSrcValue = async element => {
  const value = await page.evaluate(el => el.getAttribute('src'), element);
  return value;
};

describe('makeElementLinkAbsolute', () => {
  beforeAll(async () => {
    ({ browser, page } = await initPuppeteer());
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

    await page.evaluate(makeElementLinkAbsolute, iframe, 'src', baseUrl);
    const url = await getSrcValue(iframe);

    expect(url).toMatch(resultUrl);
  };

  it('if attrName is empty, src url stays unchanged', async () => {
    const iframe = await page.$('#iframe-https');

    await page.evaluate(
      makeElementLinkAbsolute,
      iframe,
      '',
      'https://example.com/'
    );
    const url = await getSrcValue(iframe);

    expect(url).toMatch('https://example.com/');
  });

  it('if selector is null, no error is thrown', async () => {
    const el = await page.$('no-selector');

    expect(
      page.evaluate(makeElementLinkAbsolute, el, 'src', 'https://example.com/')
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
      page.evaluate(
        makeElementLinkAbsolute,
        iframe,
        'src',
        'https:/example.com'
      )
    ).rejects.toThrow();
  });

  it('missing beginning http base url throws error', async () => {
    const iframe = await page.$('#iframe-https');

    expect(
      page.evaluate(makeElementLinkAbsolute, iframe, 'src', 'example.com/')
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
    ({ browser, page } = await initPuppeteer());
  });

  afterAll(async () => {
    await closePuppeteer();
  });

  const evaluateRetrieveBaseUrl = async (selector, returnValue) => {
    const base = await page.$(selector);

    const href = await page.evaluate(retrieveBaseUrl, base);
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
