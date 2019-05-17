const AUDIO_ELEMENTS = 'app-subpage-resource audio';
const BASE = 'base';
const EMBEDDED_ELEMENTS = '.embedded-html';
const GADGETS = 'div.gadget';
const HEADER = 'div.header';
const IMAGES = 'img';
const INTRODUCTION = '.description p';
const LAB_ELEMENTS = '//*[not(@data-offline-support)]/iframe'; // use xpath to obtain iframes NOT supporting data-offline support
const OBJECT_ELEMENTS = 'app-subpage-resource object';
const OFFLINE_READY_IFRAMES = '//*[@data-offline-support]/iframe'; // use xpath to obtain app-gateway-resource and app-app-graasp-app-resource iframes
const SPACE_TITLE = 'div.header > h1';
const SUBPAGES = '.export > section';
const TOOLS = '.tools > section';
const UNSUPPORTED_ELEMENTS = '.resources .unsupported';
const META_DOWNLOAD = 'meta[name=download]';

export {
  AUDIO_ELEMENTS,
  BASE,
  EMBEDDED_ELEMENTS,
  GADGETS,
  HEADER,
  IMAGES,
  INTRODUCTION,
  LAB_ELEMENTS,
  OBJECT_ELEMENTS,
  OFFLINE_READY_IFRAMES,
  SPACE_TITLE,
  SUBPAGES,
  TOOLS,
  UNSUPPORTED_ELEMENTS,
  META_DOWNLOAD,
};
