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
const PASSWORD = '#password';
const PHASE_DESCRIPTIONS = 'section > .description';
const PHASE_TITLES = '.name';
const RESOURCES = '.resources';
const SPACE_TITLE = 'div.header > h1';
const SUBPAGES = 'app-subpage-content.export';
const TOOLS = '.tools > section';
const UNSUPPORTED_ELEMENTS = '.unsupported';
const USERNAME = '#username';
const VIDEOS = 'video';

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
  PASSWORD,
  PHASE_DESCRIPTIONS,
  PHASE_TITLES,
  RESOURCES,
  SPACE_TITLE,
  SUBPAGES,
  TOOLS,
  UNSUPPORTED_ELEMENTS,
  USERNAME,
  VIDEOS,
};
