import { HEADER } from './selectors';
import Logger from '../utils/Logger';
import { TMP_FOLDER } from '../config';

// creating a new element does not throw an error (setAttribute do)
const addSrcdocWithContentToIframe = (iframe, contents) => {
  // this function runs inside the dom so document will be defined
  // eslint-disable-next-line no-undef
  const newIframe = document.createElement('iframe');
  const src = iframe.getAttribute('src');
  newIframe.srcdoc = contents[src];
  newIframe.style.height = iframe.style.height;
  iframe.after(newIframe);
  iframe.remove();
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

const getSubpagesContent = (
  phases,
  phaseTitlesSelector,
  resourcesSelector,
  phaseDescriptionsSelector
) =>
  phases.map(phase => {
    const content = phase.querySelector(resourcesSelector).innerHTML;
    let description = phase.querySelector(phaseDescriptionsSelector);
    description = description ? description.outerHTML : '';

    return {
      title: phase.querySelector(phaseTitlesSelector).innerHTML,
      data: description + content,
    };
  });

const makeElementLinkAbsolute = (el, attrName, baseUrl) => {
  if (!baseUrl.endsWith('/') || !baseUrl.startsWith('http')) {
    throw Error('base url is not valid');
  }
  if (el && attrName) {
    let url = el.getAttribute(attrName);
    if (url.startsWith('./')) {
      url = baseUrl + url.substring(2);
    } else if (url.startsWith('//')) {
      url = `https:${url}`;
    } else if (!url.startsWith('http')) {
      url = baseUrl + url;
    }
    el.setAttribute(attrName, url);
  }
};

const makeElementsLinkAbsolute = async (elements, attrName, baseUrl, page) => {
  // using for-of-loop for readability when using await inside a loop
  // where await is needed due to requirement of sequential steps
  // check for discussion: http://bit.ly/2JcMMLk
  // eslint-disable-next-line no-restricted-syntax
  for (const element of elements) {
    // make absolute iframe url
    // eslint-disable-next-line no-await-in-loop
    await page.evaluate(makeElementLinkAbsolute, element, attrName, baseUrl);
  }
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

const evalGetSrcFromElement = async (page, element) => {
  const url = await page.evaluate(el => el.getAttribute('src'), element);
  return url;
};

const evalSetIdToElement = async (page, element, id) => {
  await page.evaluate((el, newId) => el.setAttribute('id', newId), element, id);
};

const evalBackground = async (page, baseUrl) => {
  let backgroundUrl = await page.$eval(
    HEADER,
    el => el.dataset.backgroundImage
  );
  if (backgroundUrl) {
    if (backgroundUrl.startsWith('./')) {
      backgroundUrl = baseUrl + backgroundUrl.substring(2);
    } else if (backgroundUrl.startsWith('//')) {
      backgroundUrl = `https:${backgroundUrl}`;
    } else if (!backgroundUrl.startsWith('http')) {
      backgroundUrl = baseUrl + backgroundUrl;
    }

    return backgroundUrl;
  }
  return null;
};

export {
  addSrcdocWithContentToIframes,
  getSubpagesContent,
  adjustHeightForElements,
  replaceElementsWithScreenshots,
  makeElementsLinkAbsolute,
  evalGetSrcFromElement,
  evalSetIdToElement,
  evalBackground,
};
