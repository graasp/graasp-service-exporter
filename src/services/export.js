import Puppeteer from 'puppeteer';
import Epub from 'epub-gen';
import S3 from 'aws-sdk/clients/s3';
import fs from 'fs';
import rimraf from 'rimraf';
import request from 'request-promise-native';

import { XmlEntities } from 'html-entities';
import {
  GRAASP_HOST,
  S3_BUCKET,
  S3_PORT,
  TMP_FOLDER,
  AUTH_TYPE_ANONYMOUS,
  AUTH_TYPE_USERNAME,
  AUTH_TYPE_PASSWORD,
  AUTH_TYPE_HOST,
  TIMEOUT,
  COVER_DEFAULT_PATH,
  COVER_PATH,
} from '../config';
import Logger from '../utils/Logger';
import getChrome from '../utils/getChrome';
import isLambda from '../utils/isLambda';
import coverImage from './cover';
import {
  AUDIO_ELEMENTS,
  BASE,
  EMBEDDED_ELEMENTS,
  GADGETS,
  HEADER,
  SPACE_TITLE,
  IMAGES,
  INTRODUCTION,
  LAB_ELEMENTS,
  OBJECT_ELEMENTS,
  OFFLINE_READY_IFRAME,
  SUBPAGES,
  TOOLS,
  UNSUPPORTED_ELEMENTS,
} from './selector';

const s3 = new S3({
  s3ForcePathStyle: isLambda ? undefined : true,
  endpoint: isLambda ? undefined : `http://localhost:${S3_PORT}`,
});

const generateRandomString = () =>
  Math.random()
    .toString(36)
    .slice(2);

const generateEpub = async ({
  title = 'Untitled',
  author = 'Anonymous',
  chapters = [],
  background,
  screenshots,
}) => {
  // generate cover image
  // @TODO refactor cover data (date, student name)
  Logger.debug('Generating cover image');
  const metadata = {
    Publisher: 'Graasp',
    Date: '3/02/39',
    'Student Name': 'name',
  };
  // we wait for the cover image because it loads asynchronously the bakground image file
  // Logger.debug(`---------${background}`);
  await coverImage(background, title, author, metadata);

  Logger.debug('generating epub');
  // main options
  const main = {
    title,
    author,
    publisher: 'Graasp',
    cover: COVER_PATH,
  };

  // make sure that all content sections have data
  const content = chapters.filter(chapter => chapter.title && chapter.data);

  const output = `${TMP_FOLDER}/${generateRandomString()}.epub`;

  const options = {
    ...main,
    content,
    output,
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
      await page.evaluate(
        (el, randomId) => {
          el.setAttribute('id', randomId);
        },
        element,
        id
      );
    }
    // save screenshot with id as filename
    const path = `${TMP_FOLDER}/${id}.png`;
    // eslint-disable-next-line no-await-in-loop
    await element.screenshot({ path });
    paths.push(path);
  }
  return paths;
};

const replaceElementWithScreenshot = (el, path) => {
  const id = el.getAttribute('id');
  if (!id) {
    throw Error(`element ${el} has no id`);
  }
  // this function runs inside the dom so document will be defined
  // eslint-disable-next-line no-undef
  const img = document.createElement('img');
  img.src = `${path}/${id}.png`;
  img.alt = el.getAttribute('title');
  el.after(img);
  el.remove();
};

const replaceElementsWithScreenshots = async (elements, page) => {
  Logger.debug('replacing elements with screenshots');

  // using for-of-loop for readability when using await inside a loop
  // where await is needed due to requirement of sequential steps
  // check for discussion: http://bit.ly/2JcMMLk
  // eslint-disable-next-line no-restricted-syntax
  for (const element of elements) {
    // eslint-disable-next-line no-await-in-loop
    await page.evaluate(replaceElementWithScreenshot, element, TMP_FOLDER);
  }
};

// const replaceElementUrl = (el) => {
//   // this function runs inside the dom so document will be defined
//   // eslint-disable-next-line no-undef
//   const iframe = el.querySelector("iframe");
//   const ressourceId = el.getAttribute('id');
//   iframe.src = `http://cloud.graasp.eu/pages/${pageId}/subpages/${subpageId}/resources/${ressourceId}`;
// };

// const replaceUrlForElements = async (elements, page) => {
//   Logger.debug('replacing elements url with graasp ressources');

//   // using for-of-loop for readability when using await inside a loop
//   // where await is needed due to requirement of sequential steps
//   // check for discussion: http://bit.ly/2JcMMLk
//   // eslint-disable-next-line no-restricted-syntax
//   for (const element of elements) {
//     // eslint-disable-next-line no-await-in-loop
//     await page.evaluate(replaceElementUrl, element);
//   }
// };

/* eslint no-param-reassign: ["error", { "props": true, "ignorePropertyModificationsFor": ["el"] }] */
const adjustElementHeight = el => {
  const height = el.clientHeight;
  el.style.height = `${height}px`;
};

const adjustHeightForElements = async (elements, page) => {
  Logger.debug('replacing elements height');
  // using for-of-loop for readability when using await inside a loop
  // where await is needed due to requirement of sequential steps
  // check for discussion: http://bit.ly/2JcMMLk
  // eslint-disable-next-line no-restricted-syntax
  for (const element of elements) {
    // eslint-disable-next-line no-await-in-loop
    await page.evaluate(adjustElementHeight, element);
  }
};

// note: cannot use async/await syntax in this
// function until the following issue is solved
// http://bit.ly/2HIyUZQ
const getBackground = (el, host) => {
  const backgroundUrl = el.dataset.backgroundImage;
  if (backgroundUrl) {
    if (backgroundUrl.startsWith('//')) {
      return `https:${backgroundUrl}`;
    }
    if (!backgroundUrl.startsWith('http')) {
      return host + backgroundUrl;
    }
    return backgroundUrl;
  }
  return null;
};

// note: cannot use async/await syntax in this
// function until the following issue is solved
// http://bit.ly/2HIyUZQ
const makeImageSourcesAbsolute = (imgs, host) => {
  imgs.forEach(img => {
    const imgSrc = img.getAttribute('src');
    if (!(imgSrc.startsWith('//') || imgSrc.startsWith('http'))) {
      img.setAttribute('src', host + imgSrc);
    }
  });
};

const makeElementLinkAbsolute = (el, attrName, baseUrl) => {
  const url = el.getAttribute(attrName);
  if (url) {
    // replace link with absolute base url
    if (url.startsWith('./')) {
      const newUrl = baseUrl + url.substring(2);
      el.setAttribute(attrName, newUrl);
    }
    // make link url absolute
    else if (url.startsWith('//')) {
      const newUrl = `https:${url}`;
      el.setAttribute(attrName, newUrl);
    }
  }
};

const prepareIframes = async (iframes, attrName, baseUrl, page) => {
  // using for-of-loop for readability when using await inside a loop
  // where await is needed due to requirement of sequential steps
  // check for discussion: http://bit.ly/2JcMMLk
  // eslint-disable-next-line no-restricted-syntax
  for (const iframe of iframes) {
    // make absolute iframe url
    // eslint-disable-next-line no-await-in-loop
    await page.evaluate(makeElementLinkAbsolute, iframe, attrName, baseUrl);
  }
};

const addSrcdocWithContentToIframe = (iframe, contents) => {
  const src = iframe.getAttribute('src');
  iframe.setAttribute('srcdoc', contents[src]);
  iframe.removeAttribute('src');
};

const addSrcdocWithContentToIframes = async (iframes, contents, page) => {
  // using for-of-loop for readability when using await inside a loop
  // where await is needed due to requirement of sequential steps
  // check for discussion: http://bit.ly/2JcMMLk
  // eslint-disable-next-line no-restricted-syntax
  for (const iframe of iframes) {
    // eslint-disable-next-line no-await-in-loop
    await page.evaluate(addSrcdocWithContentToIframe, iframe, contents);
  }
};

const retrieveUrls = async (iframes, page) => {
  const urls = [];

  // using for-of-loop for readability when using await inside a loop
  // where await is needed due to requirement of sequential steps
  // check for discussion: http://bit.ly/2JcMMLk
  // eslint-disable-next-line no-restricted-syntax
  for (const iframe of iframes) {
    // eslint-disable-next-line no-await-in-loop
    const url = await page.evaluate(i => i.getAttribute('src'), iframe);
    urls.push(url);
  }
  return urls;
};

const retrieveBaseUrl = baseElement => {
  let url = baseElement.getAttribute('href');
  if (url === null) {
    url = 'https://';
  } else if (url.startsWith('//')) {
    url = `https:${url.substring(1)}`;
  }
  return url;
};

const replaceSrcWithSrcdocInIframe = async (elements, page) => {
  // Here you can use few identifying methods like url(),name(),title()
  const mainBaseUrl = await page.$eval(BASE, retrieveBaseUrl);
  await prepareIframes(elements, 'src', mainBaseUrl, page);

  // wait for iframes to reload
  await page.waitFor(4000);

  // obtain wanted iframe ids
  const iframeUrls = await retrieveUrls(elements, page);
  const urls = [...iframeUrls];

  // collect all useful frames content
  const iframesSrcdoc = {};

  // encode special characters into xml entities
  const entities = new XmlEntities();

  // using for-of-loop for readability when using await inside a loop
  // where await is needed due to requirement of sequential steps
  // check for discussion: http://bit.ly/2JcMMLk
  // eslint-disable-next-line no-restricted-syntax
  for (const frame of page.mainFrame().childFrames()) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const url = await frame.url();

      // process only wanted frames
      // warning: causes a lot of corner cases, but cannot use ids/frame.name() because
      // iframes do not have id when loading the page (adding them afterwards do
      // not seem to affect frame attributes)
      if (urls.includes(url)) {
        // eslint-disable-next-line no-await-in-loop
        let content = await frame.content();

        // xml entities encoding
        content = entities.encode(content);
        iframesSrcdoc[url] = content;
      }
    } catch (err) {
      Logger.debug(err);
    }
  }

  // replace iframes with corresponding contents
  await addSrcdocWithContentToIframes(elements, iframesSrcdoc, page);
};

const saveEpub = async (page, interactive) => {
  Logger.debug('saving epub');
  // get title
  let title = 'Untitled';
  try {
    await page.waitForSelector(SPACE_TITLE, { timeout: 3000 });
    title = await page.$eval(SPACE_TITLE, el => el.innerHTML);
  } catch (titleErr) {
    console.error(titleErr);
  }

  // @TODO get author element
  // get author
  const author = 'Anonymous';
  /*   try {
    const authorSelector = 'meta[name=author]';
    await page.waitForSelector(authorSelector, { timeout: 1000 });
    author = await page.$eval(authorSelector, el => el.getAttribute('content'));
  } catch (authorErr) {
    console.error(authorErr);
  }
  */
  // get background to use as cover
  let background = COVER_DEFAULT_PATH;
  try {
    background = await page.$eval(HEADER, getBackground, GRAASP_HOST);
    if (!(background instanceof String) && typeof background !== 'string') {
      background = COVER_DEFAULT_PATH;
    }
  } catch (err) {
    console.error(err);
  }

  // replace relative images with absolute
  await page.$$eval(IMAGES, makeImageSourcesAbsolute, GRAASP_HOST);

  // screenshot replacements have to come after image src changes

  // replace gadgets
  const gadgets = await page.$$(GADGETS);
  let gadgetScreenshots = [];
  if (interactive) {
    // if the epub is interactive, we need to adjust the height of gadget iframe
    await adjustHeightForElements(gadgets, page);
  } else {
    gadgetScreenshots = await screenshotElements(gadgets, page);
    await replaceElementsWithScreenshots(gadgets, page);
  }

  // replace gateaway labs
  const labs = await page.$$(LAB_ELEMENTS);
  let labScreenshots = [];
  if (interactive) {
    // if the epub is interactive, we need to adjust the height of gadget iframe
    await adjustHeightForElements(labs, page);
  } else {
    labScreenshots = await screenshotElements(labs, page);
    await replaceElementsWithScreenshots(labs, page);
  }

  // replace object elements (graasp generated documents)
  const objects = await page.$$(OBJECT_ELEMENTS);
  let objectScreenshots = [];
  if (interactive) {
    // if the epub is interactive, we need to adjust the height of gadget iframe
    await adjustHeightForElements(objects, page);
  } else {
    objectScreenshots = await screenshotElements(objects, page);
    await replaceElementsWithScreenshots(objects, page);
  }

  // replace audio html5 elements
  const audios = await page.$$(AUDIO_ELEMENTS);
  let audioScreenshots = [];
  if (interactive) {
    // if the epub is interactive, we need to adjust the height of embed elements
    await adjustHeightForElements(audios, page);
  } else {
    audioScreenshots = await screenshotElements(audios, page);
    await replaceElementsWithScreenshots(audios, page);
  }

  // replace embedded html divs, including youtube videos
  const embeds = await page.$$(EMBEDDED_ELEMENTS);
  let embedScreenshots = [];
  if (interactive) {
    // if the epub is interactive, we need to adjust the height of embed elements
    await adjustHeightForElements(embeds, page);
  } else {
    embedScreenshots = await screenshotElements(embeds, page);
    await replaceElementsWithScreenshots(embeds, page);
  }

  // one file labs
  const labIframes = await page.$$(OFFLINE_READY_IFRAME);
  let labIframesScreenshots = [];
  if (interactive) {
    await replaceSrcWithSrcdocInIframe(labIframes, page);
  } else {
    labIframesScreenshots = await screenshotElements(labIframes, page);
    await replaceElementsWithScreenshots(labIframes, page);
  }

  // replace download unspported div with screenshots
  const unsupported = await page.$$(UNSUPPORTED_ELEMENTS);
  const unsupportedScreenshots = await screenshotElements(unsupported, page);
  await replaceElementsWithScreenshots(unsupported, page);

  // get description if present and create introduction
  const introduction = {};
  try {
    // todo: parse title in appropriate language
    introduction.title = 'Introduction';
    introduction.data = await page.$eval(INTRODUCTION, el => el.innerHTML);
  } catch (err) {
    console.error(err);
  }

  // get body for epub
  // use the export class to differentiate from tools content
  let body = await page.$$eval(SUBPAGES, phases =>
    phases.map(phase => ({
      title: phase.getElementsByClassName('name')[0].innerHTML,
      data: phase.getElementsByClassName('resources')[0].innerHTML,
    }))
  );

  if (interactive) {
    // decode & character because it was previously encoded by setAttribute
    body = body.map(phase => ({
      title: phase.title,
      data: phase.data.replace(/&amp;(?=([1-9]|[a-zA-Z]){1,6};)/g, '&'),
    }));
  }

  // get tools for epub
  const tools = {};
  try {
    // todo: parse title in appropriate language
    tools.title = 'Tools';
    tools.data = await page.$eval(TOOLS, el => el.innerHTML);
  } catch (err) {
    Logger.error(err);
  }

  // concatenate introduction and body
  const chapters = [introduction, ...body, tools];

  const screenshots = [
    ...audioScreenshots,
    ...gadgetScreenshots,
    ...embedScreenshots,
    ...labScreenshots,
    ...objectScreenshots,
    ...unsupportedScreenshots,
    ...labIframesScreenshots,
  ];
  // prepare epub
  return generateEpub({
    title,
    author,
    chapters,
    background,
    screenshots,
  });
};

const formatSpace = async (page, format, interactive) => {
  Logger.debug('formatting space');
  switch (format) {
    case 'epub':
      // generate epub
      return saveEpub(page, interactive);
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
    page.click('.submit'),
  ]);
};

const scrape = async ({
  url,
  format,
  loginTypeUrl,
  username,
  password,
  interactiveOpt,
}) => {
  Logger.debug('instantiating puppeteer');
  const chrome = await getChrome();

  const browser = await Puppeteer.connect({
    browserWSEndpoint: chrome.endpoint,
  });

  try {
    const page = await browser.newPage();

    // todo: factor out viewport dims
    await page.setViewport({
      width: 1200,
      height: 1200,
    });

    Logger.debug('visiting page');

    let auth = AUTH_TYPE_ANONYMOUS;
    // this endpoint will return a 401 so we catch to find the auth type
    try {
      const loginTypeResponse = await request({
        uri: loginTypeUrl,
        json: true,
      });
      ({ body: { auth } = {} } = loginTypeResponse);
    } catch (err) {
      ({ error: { auth } = {} } = err);
    }

    await page.goto(url, {
      waitUntil: 'networkidle0',
      // one minute timeout
      timeout: TIMEOUT,
    });

    switch (auth) {
      case AUTH_TYPE_USERNAME:
        // TODO throw error if no username
        await page.type('#username', username);
        await signIn(page);
        break;

      case AUTH_TYPE_PASSWORD:
        // TODO throw error if no username
        await page.type('#username', username);
        await page.type('#password', password);
        await signIn(page);
        break;

      case AUTH_TYPE_ANONYMOUS:
        await signIn(page);
        break;

      default:
    }

    // dismiss cookie banner
    /* const dismissCookiesMessageButton = 'a.cc-dismiss';
    
    // we do not want to error out just because of the cookie message
    Logger.debug('dismissing cookie banner');
    try {
      await page.waitForSelector(dismissCookiesMessageButton, {
        timeout: 1000,
      });
      await page.click(dismissCookiesMessageButton);
    } catch (err) {
      Logger.info('cookie message present', err);
    } */

    // wait five more seconds just in case, mainly to wait for iframes to load
    await page.waitFor(5000);
    const formattedPage = await formatSpace(page, format, interactiveOpt);
    await browser.close();
    setTimeout(() => chrome.instance.kill(), 0);
    return formattedPage;
  } catch (err) {
    Logger.error(`error scraping ${url}`, err);
    browser.close();
    setTimeout(() => chrome.instance.kill(), 0);
    return false;
  }
};

const convertSpaceToFile = async (id, body, headers) => {
  Logger.debug('converting space to file');

  // sign in automatically if needed
  let token = headers.authorization;
  if (token && token.indexOf('Bearer ') === 0) {
    // just include the token string and not the bearer prefix
    token = token.substring(7);
  }
  const params = body;
  if (token) {
    params.authorization = token;
  }

  // return in pdf format by default
  const {
    format = 'pdf',
    lang = 'en',
    username,
    password,
    interactive = false,
  } = body;

  // build url from query parameters
  const url = `${GRAASP_HOST}/${lang}/pages/${id}/export`;
  const loginTypeUrl = `${AUTH_TYPE_HOST}/${id}`;

  const interactiveOpt = interactive === 'true';

  const page = await scrape({
    url,
    format,
    loginTypeUrl,
    username,
    password,
    interactiveOpt,
  });
  if (!page) {
    const prettyUrl = url.split('?')[0];
    throw Error(`space ${prettyUrl} could not be printed`);
  }
  return page;
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

export { convertSpaceToFile, upload, isReady };
