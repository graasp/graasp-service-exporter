/* eslint no-param-reassign: ["error", { "props": true, "ignorePropertyModificationsFor": ["el"] }] */
const adjustElementHeight = el => {
  const height = el.clientHeight;
  el.style.height = `${height}px`;
};

const evalAdjustElementHeight = async (page, element) => {
  await page.evaluate(adjustElementHeight, element);
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

const evalMakeElementLinkAbsolute = async (page, iframe, attrName, baseUrl) => {
  await page.evaluate(makeElementLinkAbsolute, iframe, attrName, baseUrl);
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

const evalReplaceElementWithScreenshot = async (page, element, folder) => {
  await page.evaluate(replaceElementWithScreenshot, element, folder);
};
const evalGetSrcFromElement = async (page, element) => {
  const url = await page.evaluate(el => el.getAttribute('src'), element);
  return url;
};

const evalSetIdToElement = async (page, element, id) => {
  await page.evaluate((el, newId) => el.setAttribute('id', newId), element, id);
};

export {
  getSubpagesContent,
  makeElementLinkAbsolute,
  evalMakeElementLinkAbsolute,
  evalAdjustElementHeight,
  replaceElementWithScreenshot,
  evalReplaceElementWithScreenshot,
  evalGetSrcFromElement,
  evalSetIdToElement,
};
