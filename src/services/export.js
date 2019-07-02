import chromium from 'chrome-aws-lambda';
import Epub from '@graasp/epub';
import S3 from 'aws-sdk/clients/s3';
import fs from 'fs';
import rimraf from 'rimraf';
import request from 'request-promise-native';
import cheerio from 'cheerio';
import { XmlEntities } from 'html-entities';
import {
  GRAASP_HOST,
  GRAASP_VIEWER,
  GRAASP_CLOUD,
  S3_BUCKET,
  S3_PORT,
  TMP_FOLDER,
  AUTH_TYPE_ANONYMOUS,
  AUTH_TYPE_USERNAME,
  AUTH_TYPE_PASSWORD,
  AUTH_TYPE_HOST,
  TIMEOUT,
  ELEMENTS_TIMEOUT,
  COVER_DEFAULT_PATH,
  COVER_PATH,
  MODE_INTERACTIVE_ONLINE,
  MODE_INTERACTIVE_OFFLINE,
  MODE_STATIC,
  DEFAULT_LANGUAGE,
  CSS_STYLES_FILE,
  VIEWPORT_WIDTH,
  SCREENSHOT_FORMAT,
  NETWORK_PRESETS,
  DEFAULT_NETWORK_PRESET,
  GRAASP,
  VIEWER_SUBDOMAIN,
  LOGIN_TIMEOUT,
  FRAMES_TIMEOUT,
} from '../config';
import Logger from '../utils/Logger';
import isLambda from '../utils/isLambda';
import coverImage from './cover';
import {
  AUDIOS,
  APP_ELEMENTS,
  BASE,
  EMBEDDED_ELEMENTS,
  GADGETS,
  HEADER,
  INTRODUCTION,
  LAB_ELEMENTS,
  META_DOWNLOAD,
  OBJECT_ELEMENTS,
  OFFLINE_READY_IFRAMES,
  PHASE_DESCRIPTIONS,
  PHASE_TITLES,
  RESOURCES,
  ROOT,
  SPACE_TITLE,
  SUBPAGES,
  TOOLS,
  UNSUPPORTED_ELEMENTS,
  CLOUD_LOGIN,
  CLOUD_PASSWORD,
  CLOUD_USERNAME,
  VIEWER_LOGIN,
  VIEWER_USERNAME,
  VIEWER_PASSWORD,
  VIDEOS,
} from './selectors';
import {
  addSrcdocWithContentToIframes,
  adjustHeightForElements,
  replaceElementsWithScreenshots,
  evalGetSrcFromElement,
  evalSetIdToElement,
  getSubpagesContent,
  makeElementsLinkAbsolute,
  evalBackground,
} from './utils';

const puppeteerErrors = chromium.puppeteer.errors;

const s3 = new S3({
  s3ForcePathStyle: isLambda ? undefined : true,
  endpoint: isLambda ? undefined : `http://localhost:${S3_PORT}`,
});

const generateRandomString = () =>
  Math.random()
    .toString(36)
    .slice(2);

const exportLink = (origin, languageCode, id) => {
  return `${origin}/${languageCode}/pages/${id}/export`;
};

const instantiatePuppeteer = async () => {
  Logger.debug('instantiating puppeteer');
  chromium.args.push('--unlimited-storage');
  const browser = await chromium.puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath,
    // always run headless
    headless: true,
  });
  return browser;
};

const generateEpub = async ({
  title = 'Untitled',
  author = 'Anonymous',
  username = 'Anonymous',
  chapters = [],
  background = COVER_DEFAULT_PATH,
  screenshots = [],
}) => {
  Logger.debug('generating epub');
  // main options
  const main = {
    title,
    author,
    publisher: 'Graasp',
    cover: COVER_PATH,
  };

  // generate cover image
  // @TODO refactor cover data (date, student name)
  Logger.debug('Generating cover image');
  const metadata = {
    date: new Date(),
    username,
    publisher: main.publisher,
  };
  // we wait for the cover image because it loads asynchronously the bakground image file
  await coverImage(background, title, author, metadata);

  // make sure that all content sections have data
  const content = chapters.filter(chapter => chapter.data);

  // css styles
  const styles = fs.readFileSync(CSS_STYLES_FILE);

  const output = `${TMP_FOLDER}/${generateRandomString()}.epub`;

  const options = {
    ...main,
    content,
    output,
    css: styles,
    tempDir: TMP_FOLDER,
  };

  // disable this lint because of our epub generation library
  // eslint-disable-next-line no-new
  return new Epub(options).promise.then(
    () =>
      new Promise((resolve, reject) => {
        const stream = fs.createReadStream(output);

        const epub = [];
        stream.on('data', chunk => epub.push(chunk));
        stream.on('error', () => reject(new Error()));
        stream.on('end', () => {
          const rvalue = Buffer.concat(epub);
          rimraf(output, error => {
            Logger.debug(`info: deleting temporary epub ${output}`);
            if (error) {
              console.error(error);
            }
          });
          screenshots.forEach(path => {
            Logger.debug(`info: deleting temporary screenshot ${path}`);
            rimraf(path, error => {
              if (error) {
                console.error(error);
              }
            });
          });
          Logger.debug(`info: deleting temporary cover ${COVER_PATH}`);
          rimraf(COVER_PATH, error => {
            if (error) {
              console.error(error);
            }
          });
          resolve(rvalue);
        });
      })
  );
};

const retrieveBaseUrl = async (page, host, selector = '') => {
  Logger.debug(`retrieve base url`);

  const baseElement = await page.$(`${BASE}${selector}`);
  let url = 'https://';
  if (baseElement) {
    url = await (await baseElement.getProperty('href')).jsonValue();

    // cases which might happen because of getting a property (=/= attribute)
    if (url.startsWith('file:///')) {
      url = 'https://';
    } else if (url.startsWith('file://')) {
      url = url.slice(5);
    }

    if (url === null || url === '') {
      url = 'https://';
    } else if (url.startsWith('//')) {
      url = `https:${url}`;
    } else if (url.startsWith('/')) {
      url = `${host}${url}`;
    }

    // add an ending slash if necessary
    if (!url.endsWith('/')) {
      url += '/';
    }
  }

  return url;
};

const screenshotElements = async (elements, page) => {
  const paths = [];
  // using for-of-loop for readability when using await inside a loop
  // where await is needed due to requirement of sequential steps
  // check for discussion: http://bit.ly/2JcMMLk
  // eslint-disable-next-line no-restricted-syntax
  for (const element of elements) {
    // get id property and resolve it as a string
    // eslint-disable-next-line no-await-in-loop
    let id = await (await element.getProperty('id')).jsonValue();

    // if there is no id create a random id and set it in the dom
    if (!id || id === '') {
      id = generateRandomString();
      // eslint-disable-next-line no-await-in-loop
      await evalSetIdToElement(page, element, id);
    }
    // save screenshot with id as filename
    const path = `${TMP_FOLDER}/${id}.${SCREENSHOT_FORMAT}`;
    // eslint-disable-next-line no-await-in-loop
    await element.screenshot({
      path,
      // eslint-disable-next-line no-await-in-loop
    });
    paths.push(path);
  }
  return paths;
};

const retrieveUrls = async (iframes, page) => {
  const urls = [];

  // using for-of-loop for readability when using await inside a loop
  // where await is needed due to requirement of sequential steps
  // check for discussion: http://bit.ly/2JcMMLk
  // eslint-disable-next-line no-restricted-syntax
  for (const iframe of iframes) {
    // eslint-disable-next-line no-await-in-loop
    const url = await evalGetSrcFromElement(page, iframe);
    urls.push(url);
  }
  return urls;
};

const getDownloadUrl = async (content, lang) => {
  let url = null;
  if (content) {
    const $ = cheerio.load(content);

    // look for the url corresponding with the language
    const elem = $(`${META_DOWNLOAD}[language=${lang}]`);
    if (elem.length) {
      url = elem.attr('value');
    }
    // fall back on the default language
    else if (lang !== DEFAULT_LANGUAGE) {
      const elemDefaultLang = $(
        `${META_DOWNLOAD}[language=${DEFAULT_LANGUAGE}]`
      );
      if (elemDefaultLang) {
        url = elemDefaultLang.attr('value');
      }
    }
  }
  return url;
};

// fall back on lab content with the corresponding language
const retrieveContentBasedOnLanguage = async (url, lang) => {
  let content = await request(url);
  const downloadUrl = await getDownloadUrl(content, lang);
  if (downloadUrl) {
    content = await request(downloadUrl);
  }
  return content;
};

const replaceSrcWithSrcdocInIframe = async (elements, page, lang, baseUrl) => {
  Logger.debug('replace iframes src with srcdoc content');

  await makeElementsLinkAbsolute(elements, 'src', baseUrl, page);

  // wait for iframes to reload
  await page.waitFor(4000);

  // obtain wanted iframe ids
  const urls = await retrieveUrls(elements, page);

  // collect all useful frames content
  const iframesSrcdoc = {};

  // encode special characters into xml entities
  const entities = new XmlEntities();

  // using for-of-loop for readability when using await inside a loop
  // where await is needed due to requirement of sequential steps
  // check for discussion: http://bit.ly/2JcMMLk
  // eslint-disable-next-line no-restricted-syntax
  for (const url of urls) {
    // eslint-disable-next-line no-await-in-loop
    let content = await retrieveContentBasedOnLanguage(url, lang);

    // xml entities encoding
    content = entities.encode(content);
    iframesSrcdoc[url] = content;
  }

  // replace iframes with corresponding contents
  await addSrcdocWithContentToIframes(elements, iframesSrcdoc, page);
};

const handleBackground = async (page, baseUrl) => {
  let background = COVER_DEFAULT_PATH;
  try {
    await page.waitForSelector(HEADER, { timeout: ELEMENTS_TIMEOUT });
    background = await evalBackground(page, baseUrl);
    if (!(background instanceof String) && typeof background !== 'string') {
      background = COVER_DEFAULT_PATH;
    }
  } catch (error) {
    if (error instanceof puppeteerErrors.TimeoutError) {
      Logger.debug('no background image found');
    } else {
      throw error;
    }
  }
  return background;
};

const handleAudios = async (page, mode) => {
  Logger.debug(`handling audios`);
  let audioScreenshots = [];
  try {
    await page.waitForXPath(AUDIOS, {
      timeout: ELEMENTS_TIMEOUT,
    });
    const audios = await page.$x(AUDIOS);
    switch (mode) {
      case MODE_INTERACTIVE_ONLINE:
      // we let the element as it is
      // falls through
      case MODE_INTERACTIVE_OFFLINE:
      // falls through
      case MODE_STATIC:
      default:
        audioScreenshots = await screenshotElements(audios, page);
        await replaceElementsWithScreenshots(audios, page);
    }
  } catch (error) {
    if (error instanceof puppeteerErrors.TimeoutError) {
      Logger.debug('no audios found');
    } else {
      throw error;
    }
  }
  return audioScreenshots;
};

const handleVideos = async (page, mode) => {
  Logger.debug(`handling videos`);
  let videoScreenshots = [];
  try {
    await page.waitForSelector(VIDEOS, {
      timeout: ELEMENTS_TIMEOUT,
    });
    const videos = await page.$$(VIDEOS);
    switch (mode) {
      case MODE_INTERACTIVE_ONLINE:
      // we let the element as it is
      // falls through
      case MODE_INTERACTIVE_OFFLINE:
      // falls through
      case MODE_STATIC:
      default:
        videoScreenshots = await screenshotElements(videos, page);
        await replaceElementsWithScreenshots(videos, page);
    }
  } catch (error) {
    if (error instanceof puppeteerErrors.TimeoutError) {
      Logger.debug('no videos found');
    } else {
      throw error;
    }
  }
  return videoScreenshots;
};

const handleOfflineLabs = async (page, mode, lang, baseUrl) => {
  Logger.debug(`handling offline labs`);
  let offlineIframeScreenshots = [];
  try {
    await page.waitForSelector(OFFLINE_READY_IFRAMES, {
      timeout: ELEMENTS_TIMEOUT,
    });
    const offlineIframes = await page.$$(OFFLINE_READY_IFRAMES);
    switch (mode) {
      case MODE_INTERACTIVE_ONLINE:
      // @TODO: handle phet lab - interactive link does not work
      // height is adjusted in the export view
      // falls through
      case MODE_INTERACTIVE_OFFLINE:
        // we need embed content in iframe srcdoc
        await replaceSrcWithSrcdocInIframe(offlineIframes, page, lang, baseUrl);
        // height is adjusted in the export view
        break;
      case MODE_STATIC:
      default:
        offlineIframeScreenshots = await screenshotElements(
          offlineIframes,
          page
        );
        await replaceElementsWithScreenshots(offlineIframes, page);
    }
  } catch (error) {
    if (error instanceof puppeteerErrors.TimeoutError) {
      Logger.debug('no offline labs found');
    } else {
      // Logger.debug('There is an error with offline labs');
      throw error;
    }
  }

  // this code here is to handle the exception from offline labs
  // try {
  //   await page.waitForSelector('body', {
  //     timeout: ELEMENTS_TIMEOUT,
  //   });
  // } catch (error) {
  //   // if(error instanceof puppeteerErrors.TimeoutError) {
  //   Logger.debug('error catched');
  //   // }
  // }

  return offlineIframeScreenshots;
};

const handleLabs = async (page, mode) => {
  Logger.debug(`handling online labs`);
  let labScreenshots = [];
  try {
    await page.waitForSelector(LAB_ELEMENTS, {
      timeout: ELEMENTS_TIMEOUT,
    });
    const labs = await page.$$(LAB_ELEMENTS);
    switch (mode) {
      case MODE_INTERACTIVE_ONLINE:
        // we need to adjust the height of iframe
        await adjustHeightForElements(labs, page);
        break;
      case MODE_INTERACTIVE_OFFLINE:
      // falls through
      case MODE_STATIC:
      default:
        labScreenshots = await screenshotElements(labs, page);
        await replaceElementsWithScreenshots(labs, page);
    }
  } catch (error) {
    if (error instanceof puppeteerErrors.TimeoutError) {
      Logger.debug('no online labs found');
    } else {
      throw error;
    }
  }
  return labScreenshots;
};

const handleApps = async (page, mode) => {
  Logger.debug(`handling apps`);
  let appScreenshots = [];
  try {
    await page.waitForSelector(APP_ELEMENTS, {
      timeout: ELEMENTS_TIMEOUT,
    });
    const apps = await page.$$(APP_ELEMENTS);
    switch (mode) {
      case MODE_INTERACTIVE_ONLINE:
        // we need to adjust the height of iframe
        await adjustHeightForElements(apps, page);
        break;
      case MODE_INTERACTIVE_OFFLINE:
      // falls through
      case MODE_STATIC:
      default:
        appScreenshots = await screenshotElements(apps, page);
        await replaceElementsWithScreenshots(apps, page);
    }
  } catch (error) {
    if (error instanceof puppeteerErrors.TimeoutError) {
      Logger.debug('no apps found');
    } else {
      throw error;
    }
  }
  return appScreenshots;
};

const handleGadgets = async (page, mode) => {
  Logger.debug(`handling online gadgets`);
  let gadgetScreenshots = [];
  try {
    await page.waitForSelector(GADGETS, {
      timeout: ELEMENTS_TIMEOUT,
    });
    const gadgets = await page.$$(GADGETS);
    switch (mode) {
      case MODE_INTERACTIVE_ONLINE:
        // we need to adjust the height of gadget iframe
        await adjustHeightForElements(gadgets, page);
        break;
      case MODE_INTERACTIVE_OFFLINE:
      // falls through
      case MODE_STATIC:
      default:
        gadgetScreenshots = await screenshotElements(gadgets, page);
        await replaceElementsWithScreenshots(gadgets, page);
    }
  } catch (error) {
    if (error instanceof puppeteerErrors.TimeoutError) {
      Logger.debug('no online gadgets found');
    } else {
      throw error;
    }
  }
  return gadgetScreenshots;
};

const handleObjects = async (page, mode) => {
  Logger.debug(`handling objects (docs)`);
  let objectScreenshots = [];
  try {
    await page.waitForSelector(OBJECT_ELEMENTS, {
      timeout: ELEMENTS_TIMEOUT,
    });
    const objects = await page.$$(OBJECT_ELEMENTS);
    switch (mode) {
      case MODE_INTERACTIVE_ONLINE:
      // @TODO : handle unauthorized response
      // we need to adjust the height of gadget iframe
      // await adjustHeightForElements(objects, page);
      // falls through
      case MODE_INTERACTIVE_OFFLINE:
      // falls through
      case MODE_STATIC:
      default:
        objectScreenshots = await screenshotElements(objects, page);
        await replaceElementsWithScreenshots(objects, page);
    }
  } catch (error) {
    if (error instanceof puppeteerErrors.TimeoutError) {
      Logger.debug('no objects (docs) found');
    } else {
      throw error;
    }
  }
  return objectScreenshots;
};

const handleEmbedded = async (page, mode) => {
  Logger.debug(`handling embedded elements`);
  let embedScreenshots = [];
  try {
    await page.waitForSelector(EMBEDDED_ELEMENTS, {
      timeout: ELEMENTS_TIMEOUT,
    });
    const embeds = await page.$$(EMBEDDED_ELEMENTS);
    switch (mode) {
      case MODE_INTERACTIVE_ONLINE:
        // we need to adjust the height of embedded iframe
        await adjustHeightForElements(embeds, page);
        break;
      case MODE_INTERACTIVE_OFFLINE:
      // falls through
      case MODE_STATIC:
      default:
        embedScreenshots = await screenshotElements(embeds, page);
        await replaceElementsWithScreenshots(embeds, page);
    }
  } catch (error) {
    if (error instanceof puppeteerErrors.TimeoutError) {
      Logger.debug('no embedded elements found');
    } else {
      throw error;
    }
  }
  return embedScreenshots;
};

const handleUnsupported = async (page, mode) => {
  Logger.debug(`handling unsupported elements`);
  let unsupportedScreenshots = [];
  try {
    await page.waitForSelector(UNSUPPORTED_ELEMENTS, {
      timeout: ELEMENTS_TIMEOUT,
    });
    const unsupported = await page.$$(UNSUPPORTED_ELEMENTS);
    switch (mode) {
      case MODE_INTERACTIVE_ONLINE:
      // @TODO replace with a link ?
      // falls through
      case MODE_INTERACTIVE_OFFLINE:
      // falls through
      case MODE_STATIC:
      default:
        unsupportedScreenshots = await screenshotElements(unsupported, page);
        await replaceElementsWithScreenshots(unsupported, page);
    }
  } catch (error) {
    if (error instanceof puppeteerErrors.TimeoutError) {
      Logger.debug('no unsupported elements found');
    } else {
      throw error;
    }
  }
  return unsupportedScreenshots;
};

const retrievePhasesContent = async (page, mode) => {
  let body = [];
  try {
    await page.waitForSelector(SUBPAGES, {
      timeout: ELEMENTS_TIMEOUT,
    });
    body = await page.$$eval(
      SUBPAGES,
      getSubpagesContent,
      PHASE_TITLES,
      RESOURCES,
      PHASE_DESCRIPTIONS
    );

    if (mode === MODE_INTERACTIVE_OFFLINE || mode === MODE_INTERACTIVE_ONLINE) {
      // decode & character because it was previously encoded when set to srcdoc attribute
      body = body.map(phase => ({
        title: phase.title,
        data: phase.data.replace(/&amp;(?=([1-9]|[a-zA-Z]){1,6};)/g, '&'),
      }));
    }
  } catch (error) {
    if (error instanceof puppeteerErrors.TimeoutError) {
      Logger.debug('no phase found');
    } else {
      throw error;
    }
  }
  return body;
};

const retrieveMetadata = async (page, baseUrl) => {
  // get title
  Logger.debug(`retrieve title`);
  let title = 'Untitled';
  try {
    await page.waitForSelector(SPACE_TITLE, { timeout: ELEMENTS_TIMEOUT });
    title = await page.$eval(SPACE_TITLE, el => el.innerHTML);
  } catch (titleErr) {
    if (titleErr instanceof puppeteerErrors.TimeoutError) {
      Logger.debug('no title found');
    } else {
      throw titleErr;
    }
  }

  // @TODO get author element
  // get author
  Logger.debug(`retrieve author`);
  const author = 'Anonymous';

  // get background
  Logger.debug(`retrieving background`);
  const background = await handleBackground(page, baseUrl);

  // get description if present and create introduction
  const introduction = {};
  try {
    await page.waitForSelector(INTRODUCTION, {
      timeout: ELEMENTS_TIMEOUT,
    });
    // todo: parse title in appropriate language
    introduction.title = 'Preface';
    introduction.data = await page.$eval(INTRODUCTION, el => el.outerHTML);
  } catch (error) {
    if (error instanceof puppeteerErrors.TimeoutError) {
      Logger.debug('no preface found');
    } else {
      throw error;
    }
  }

  return { title, author, background, introduction };
};

const saveEpub = async (page, mode, lang, username) => {
  Logger.debug(`saving epub in ${mode} mode`);

  // retrieve base url, and prepare it with necessary
  const baseUrl = await retrieveBaseUrl(page, GRAASP_HOST);

  // retrieve metadata
  const { title, author, background, introduction } = await retrieveMetadata(
    page,
    baseUrl
  );

  // epub-gen handle images by himself
  // screenshot replacements have to come after image src changes

  // audio html5 elements
  const audioScreenshots = await handleAudios(page, mode);

  // video html5 elements
  const videoScreenshots = await handleVideos(page, mode);

  // gateaway labs
  const labScreenshots = await handleLabs(page, mode);

  // apps
  const appScreenshots = await handleApps(page, mode);

  // gadgets
  const gadgetScreenshots = await handleGadgets(page, mode);

  // object elements (graasp generated documents)
  const objectScreenshots = await handleObjects(page, mode);

  // embedded html divs, including youtube videos
  const embedScreenshots = await handleEmbedded(page, mode);

  // one file labs
  // warning: handle offline labs after handling all iframes
  // this function may transform iframe[srcdoc] into plain iframes
  // which may be included in other selectors
  const offlineIframeScreenshots = await handleOfflineLabs(
    page,
    mode,
    lang,
    baseUrl
  );

  // replace download unspported div with screenshots
  const unsupportedScreenshots = await handleUnsupported(page, mode);

  // get body for epub
  // use the export class to differentiate from tools content
  Logger.debug(`retrieving phase content`);
  const body = await retrievePhasesContent(page, mode);

  // get tools for epub
  Logger.debug(`retrieving tools section`);
  const tools = {};
  try {
    await page.waitForSelector(TOOLS, {
      timeout: ELEMENTS_TIMEOUT,
    });
    // todo: parse title in appropriate language
    tools.title = 'Tools';
    tools.data = await page.$eval(TOOLS, el => el.innerHTML);
  } catch (error) {
    if (error instanceof puppeteerErrors.TimeoutError) {
      Logger.debug('no tools found');
    } else {
      throw error;
    }
  }

  const backCoverContent = 'generated by Graasp.eu';
  const backCover = { beforeToc: true, data: backCoverContent };

  // concatenate introduction and body
  const chapters = [backCover, introduction, ...body, tools];

  const screenshots = [
    ...appScreenshots,
    ...audioScreenshots,
    ...embedScreenshots,
    ...gadgetScreenshots,
    ...labScreenshots,
    ...objectScreenshots,
    ...offlineIframeScreenshots,
    ...unsupportedScreenshots,
    ...videoScreenshots,
  ];
  // prepare epub
  return {
    title,
    author,
    username,
    chapters,
    background,
    screenshots,
  };
};

const formatSpace = async (page, format, epubParams) => {
  Logger.debug('formatting space');
  switch (format) {
    case 'epub':
      // generate epub
      return generateEpub(epubParams);
    case 'png':
      // print screenshot
      return page.screenshot({
        fullPage: true,
      });
    case 'pdf':
    default:
      // print pdf
      return page.pdf({
        format: 'A4',
        margin: {
          top: '1cm',
          bottom: '1cm',
        },
        printBackground: true,
      });
  }
};

const signIn = async page => {
  return Promise.all([
    page.waitForNavigation({
      timeout: TIMEOUT,
      waitUntil: 'networkidle0',
    }),
    page.click(CLOUD_LOGIN),
  ]);
};

const signInViewer = async page => {
  return Promise.all([
    page.waitForNavigation({
      timeout: TIMEOUT,
      waitUntil: 'networkidle0',
    }),
    page.click(VIEWER_LOGIN),
  ]);
};

const puppeteerLogin = async (
  browser,
  url,
  loginTypeUrl,
  username,
  password,
  dryRun,
  networkPreset
) => {
  const page = await browser.newPage();

  // dry run allows throttling
  if (dryRun) {
    // Connect to Chrome DevTools
    const client = await page.target().createCDPSession();

    // Set throttling property
    await client.send(
      'Network.emulateNetworkConditions',
      NETWORK_PRESETS[networkPreset]
    );
  }

  // todo: factor out viewport dims
  await page.setViewport({
    width: VIEWPORT_WIDTH,
    height: 1200,
  });

  Logger.debug(`visiting page ${url}`);

  await page.goto(url, {
    waitUntil: 'networkidle0',
    // one minute timeout
    timeout: TIMEOUT,
  });

  Logger.debug('figuring out auth type');

  // login routine depends on the origin
  if (url.match(GRAASP_VIEWER)) {
    await page.waitForSelector(VIEWER_USERNAME, {
      timeout: LOGIN_TIMEOUT,
    });
    await page.type(VIEWER_USERNAME, username);
    await page.type(VIEWER_PASSWORD, password);
    await signInViewer(page);
  } else if (url.match(GRAASP_CLOUD)) {
    let auth = AUTH_TYPE_ANONYMOUS;
    // this endpoint will return a 401 so we catch to find the auth type
    try {
      const loginTypeResponse = await request({
        uri: loginTypeUrl,
        json: true,
      });
      Logger.debug(loginTypeResponse);
      ({ body: { auth } = {} } = loginTypeResponse);
    } catch (err) {
      Logger.debug(err);
      ({ error: { auth } = {} } = err);

      if (!auth) {
        throw err;
      }
    }

    // only log the type of auth in debug mode
    Logger.debug(`auth type: ${auth}`);

    switch (auth) {
      case AUTH_TYPE_USERNAME:
        // TODO throw error if no username
        await page.waitForSelector(CLOUD_USERNAME, {
          timeout: 1000,
        });
        await page.type(CLOUD_USERNAME, username);
        await signIn(page);
        break;

      case AUTH_TYPE_PASSWORD:
        // TODO throw error if no username
        await page.waitForSelector(CLOUD_USERNAME, {
          timeout: 1000,
        });
        await page.type(CLOUD_USERNAME, username);
        await page.type(CLOUD_PASSWORD, password);
        await signIn(page);
        break;

      case AUTH_TYPE_ANONYMOUS:
        await signIn(page);
        break;

      default:
    }
  } else {
    throw Error(`Unexpected origin: ${url}`);
  }

  // wait three more seconds just in case, mainly to wait for iframes to load
  await page.waitFor(3000);

  // reset the viewport for screenshots visiblity
  const body = await page.$(ROOT);
  const maxHeight = Math.ceil((await body.boundingBox()).height);
  await page.setViewport({
    width: VIEWPORT_WIDTH,
    height: maxHeight,
  });

    // wait three more seconds just in case, mainly to wait for iframes and apps to load
    const nbFrames = page.mainFrame().childFrames().length;
    const waitingTime = 3000 + nbFrames * FRAMES_TIMEOUT;
    Logger.debug(`wait for ${waitingTime}ms`);
    await page.waitFor(waitingTime);
  return page;
};

const handleSubspace = async (
  url,
  loginTypeUrl,
  username,
  password,
  mode,
  lang,
  dryRun,
  networkPreset
) => {
  // instantiate multiple puppeteer to avoid page crash
  const browser = await instantiatePuppeteer();

  const page = await puppeteerLogin(
    browser,
    url,
    loginTypeUrl,
    username,
    password,
    dryRun,
    networkPreset
  );
  const params = await saveEpub(page, mode, lang, username);

  await browser.close();
  return params;
};

// main space scraping
// retrieve main space metadata
const handleMainSpace = async (
  browser,
  url,
  loginTypeUrl,
  username,
  password,
  dryRun,
  networkPreset
) => {
  Logger.debug('scraping main space');
  const mainPage = await puppeteerLogin(
    browser,
    url,
    loginTypeUrl,
    username,
    password,
    dryRun,
    networkPreset
  );
  const baseUrl = await retrieveBaseUrl(mainPage, GRAASP_HOST);
  return retrieveMetadata(mainPage, baseUrl);
};

const convertSpaceToFile = async (id, body, headers) => {
  Logger.debug('converting space to file');

  // return in pdf format by default
  const {
    format = 'pdf',
    lang = DEFAULT_LANGUAGE,
    username,
    password,
    mode = MODE_STATIC,
    spaceIds = [],
    dryRun = false,
    networkPreset = DEFAULT_NETWORK_PRESET,
  } = body;

  const languageCode = lang.split('_')[0];

  // build url from query parameters
  let { origin = GRAASP_HOST } = headers;
  if (origin.match(GRAASP)) {
    const split = origin.split('://');
    const protocol = split[0];
    const host = split[1];
    origin = `${protocol}://${VIEWER_SUBDOMAIN}.${host}`;
  }
  const url = exportLink(origin, languageCode, id);
  const loginTypeUrl = `${AUTH_TYPE_HOST}/${id}`;

  const browser = await instantiatePuppeteer();

  let page;
  let params = [];

  // multiple space scraping for epub format only
  if (spaceIds.length && format === 'epub') {
    Logger.debug('scraping multiple spaces');

    const spaceUrls = spaceIds.map(spaceId =>
      exportLink(origin, languageCode, spaceId)
    );

    // create promises for the main space and the subspaces
    const mainSpacePromise = handleMainSpace(
      browser,
      url,
      loginTypeUrl,
      username,
      password,
      dryRun,
      networkPreset
    );
    const subspacesPromises = spaceUrls.map(async spaceUrl =>
      handleSubspace(
        spaceUrl,
        loginTypeUrl,
        username,
        password,
        mode,
        lang,
        dryRun,
        networkPreset
      )
    );

    const {
      title,
      author,
      chapters,
      background,
      screenshots,
    } = await Promise.all([mainSpacePromise, ...subspacesPromises]).then(
      spacesParams => {
        const mainPageMetadata = spacesParams.shift();

        // merge spaces' content
        // for code clarity, flatMap would be feasible
        // concat title and chapters for each space
        let allChapters = spacesParams.map(param => [
          { title: param.title, data: '' },
          ...param.chapters,
        ]);
        allChapters = Array.prototype.concat.apply([], allChapters);

        let allScreenshots = spacesParams.map(param => param.screenshots);
        allScreenshots = Array.prototype.concat.apply([], allScreenshots);

        return {
          title: mainPageMetadata.title,
          author: mainPageMetadata.author,
          chapters: [mainPageMetadata.introduction, ...allChapters],
          background: mainPageMetadata.background,
          screenshots: allScreenshots,
        };
      }
    );

    params = {
      title,
      author,
      username,
      chapters,
      background,
      screenshots,
    };
  } else {
    // single space
    Logger.debug('scraping single space');
    page = await puppeteerLogin(
      browser,
      url,
      loginTypeUrl,
      username,
      password,
      dryRun,
      networkPreset
    );

    if (format === 'epub') {
      params = await saveEpub(page, mode, lang, username);
    }
  }

  const spaceFile = await formatSpace(page, format, params);
  await browser.close();

  if (!spaceFile) {
    const prettyUrl = url.split('?')[0];
    throw Error(`space ${prettyUrl} could not be printed`);
  }
  return spaceFile;
};

const upload = (file, fileId) => {
  return new Promise((resolve, reject) => {
    const params = { Bucket: S3_BUCKET, Key: fileId, Body: file };
    s3.upload(params, (err, data) => {
      if (err) {
        Logger.error(`error uploading ${fileId}`, err);
        reject(err);
      } else {
        Logger.info(data);
        resolve(data);
      }
    });
  });
};

const isReady = fileId =>
  new Promise((resolve, reject) => {
    const params = {
      Bucket: S3_BUCKET,
      Key: fileId,
    };
    s3.headObject(params, (err, data) => {
      if (!err) {
        Logger.info(data);
        resolve(true);
      } else if (err.code === 'NotFound') {
        // case still pending
        Logger.info(err);
        resolve(false);
      } else {
        Logger.error(`error retrieving ${fileId}`, err);
        reject(err);
      }
    });
  });

const getFileAsString = async fileId => {
  const params = {
    Bucket: S3_BUCKET,
    Key: fileId,
  };
  const data = await s3.getObject(params).promise();
  const objectData = data.Body.toString('utf-8');
  Logger.info(objectData);
  return objectData;
};

export {
  convertSpaceToFile,
  upload,
  getFileAsString,
  isReady,
  adjustHeightForElements,
  getDownloadUrl,
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
  retrieveBaseUrl,
  generateEpub,
  screenshotElements,
};
