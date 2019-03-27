import Puppeteer from 'puppeteer';
import Epub from 'epub-gen';
import S3 from 'aws-sdk/clients/s3';
import fs from 'fs';
import rimraf from 'rimraf';
import request from 'request-promise-native';
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
} from '../config';
import Logger from '../utils/Logger';
import getChrome from '../utils/getChrome';
import isLambda from '../utils/isLambda';

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
  cover,
  screenshots,
}) => {
  Logger.debug('generating epub');
  // main options
  const main = {
    title,
    author,
    publisher: 'Graasp',
    cover,
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

/* eslint no-param-reassign: ["error", { "props": true, "ignorePropertyModificationsFor": ["el"] }] */
const adjustElementHeight = el => {
  const height = el.clientHeight;
  el.style.height = `${height}px`;
};

const adjustElementsHeight = async (elements, page) => {
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
/* const getBackground = (el, host) => {
  const style = el.getAttribute('style');
  const backgroundUrlArray = style.split('"');
  const backgroundUrl =
    backgroundUrlArray.length === 3 && backgroundUrlArray[1];
  if (backgroundUrl) {
    if (!(backgroundUrl.startsWith('//') || backgroundUrl.startsWith('http'))) {
      return host + backgroundUrl;
    }
    return backgroundUrl;
  }
  return null;
}; */

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

const replaceElements = async (elements, page, interactive) => {
  let screenshots = [];
  if (interactive === 'true') {
    await adjustElementsHeight(elements, page);
  } else {
    screenshots = await screenshotElements(elements, page);
    await replaceElementsWithScreenshots(elements, page);
  }
  return screenshots;
};

const saveEpub = async (page, interactive) => {
  Logger.debug('saving epub');
  // get title
  let title = 'Untitled';
  try {
    const titleSelector = 'div.header > h1';
    await page.waitForSelector(titleSelector, { timeout: 1000 });
    title = await page.$eval(titleSelector, el => el.innerHTML);
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
  // @TODO get background element
  // get background to use as cover
  const cover = null;
  /* try {
    cover = await page.$eval(
      'div.background-holder',
      getBackground,
      GRAASP_HOST
    );
    if (!(cover instanceof String) && typeof cover !== 'string') {
      cover = null;
    }
  } catch (err) {
    console.error(err);
  } */

  // replace relative images with absolute
  await page.$$eval('img', makeImageSourcesAbsolute, GRAASP_HOST);

  // screenshot replacements have to come after image src changes

  // replace gadgets
  const gadgets = await page.$$('div.gadget');
  const gadgetScreenshots = await replaceElements(gadgets, page, interactive);

  // remove panels accompanying gadgets
  // await page.$$eval('div.panel', els => els.forEach(el => el.remove()));

  // replace embedded html divs, including youtube videos
  const embeds = await page.$$('.resources object');
  const embedScreenshots = await replaceElements(embeds, page, interactive);

  // get description if present and create introduction
  const introduction = {};
  try {
    // todo: parse title in appropriate language
    introduction.title = 'Introduction';
    introduction.data = await page.$eval('.description p', el => el.innerHTML);
  } catch (err) {
    console.error(err);
  }

  // get body for epub
  // use the export class to differentiate from tools content
  const body = await page.$$eval('.export > section', phases =>
    phases.map(phase => ({
      title: phase.getElementsByClassName('name')[0].innerHTML,
      data: phase.getElementsByClassName('resources')[0].innerHTML,
    }))
  );

  // get tools for epub
  const tools = {};
  try {
    // todo: parse title in appropriate language
    tools.title = 'Tools';
    tools.data = await page.$eval('.tools > section', el => el.innerHTML);
  } catch (err) {
    Logger.error(err);
  }

  // concatenate introduction and body
  const chapters = [introduction, ...body, tools];

  const screenshots = [...gadgetScreenshots, ...embedScreenshots];
  // prepare epub
  return generateEpub({
    title,
    author,
    chapters,
    cover,
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
  interactive,
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
      default:
        await signIn(page);
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

    // wait three more seconds just in case
    await page.waitFor(3000);
    const formattedPage = await formatSpace(page, format, interactive);
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

  const page = await scrape({
    url,
    format,
    loginTypeUrl,
    username,
    password,
    interactive,
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
