const AUDIOS = '//app-subpage-resource/div[audio]';
const APP_ELEMENTS =
  'app-graasp-app-resource:not([data-offline-support]) iframe';
const BASE = 'base';
const EMBEDDED_ELEMENTS = '.embedded-html';
const GADGETS = 'div.gadget';
const HEADER = 'div.header';
const INTRODUCTION = '.header + .description';
const LAB_ELEMENTS = 'app-gateway-resource:not([data-offline-support]) iframe'; // css :not() doesn't work well
const OBJECT_ELEMENTS = 'app-subpage-resource object';
const OFFLINE_READY_IFRAMES =
  'app-gateway-resource[data-offline-support] iframe, app-graasp-app-resource[data-offline-support] iframe'; // use xpath to obtain app-gateway-resource and app-graasp-app-resource iframes
const META_DOWNLOAD = 'meta[name=download]';
const PHASE_DESCRIPTIONS = 'section > .description';
const PHASE_TITLES = '.name';
const RESOURCES = '.resources';
const ROOT = 'app-root';
const SPACE_TITLE = 'div.header > h1';
const SUBPAGES = 'app-subpage-content.export';
const TOOLS = '.tools > section';
const UNSUPPORTED_ELEMENTS = '.unsupported';
const VIDEOS = 'video';

const CLOUD_PASSWORD = '#password';
const CLOUD_USERNAME = '#username';
const CLOUD_LOGIN = '.submit';

const VIEWER_USERNAME = 'input[name=email]';
const VIEWER_PASSWORD = 'input[name=password]';
const VIEWER_LOGIN = 'button[type=submit]';

export {
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
  CLOUD_USERNAME,
  CLOUD_PASSWORD,
  CLOUD_LOGIN,
  VIEWER_USERNAME,
  VIEWER_PASSWORD,
  VIEWER_LOGIN,
  VIDEOS,
};
