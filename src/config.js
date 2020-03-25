import path from 'path';

const {
  S3_PORT,
  GRAASP_HOST = 'https://viewer.graasp.eu',
  LOGGING_LEVEL = 'info',
  GRAASP_FILES_HOST = 'http://localhost:3000',
  S3_BUCKET = null,
  S3_HOST = null,
  CI_BRANCH = undefined,
  CI_COMMIT_ID = undefined,
  REGION = 'eu-central-1',
  ACCOUNT_ID = null,
  LAMBDA_TASK_ROOT,
  STAGE,
  TMP_PATH = './tmp',
  AUTH_TYPE_HOST = 'https://light-users.api.graasp.eu/spaces',
} = process.env;

const TMP_FOLDER = path.isAbsolute(TMP_PATH)
  ? TMP_PATH
  : path.resolve(__dirname, TMP_PATH);

export {
  S3_PORT,
  S3_BUCKET,
  S3_HOST,
  GRAASP_HOST,
  LOGGING_LEVEL,
  TMP_FOLDER,
  GRAASP_FILES_HOST,
  CI_BRANCH,
  CI_COMMIT_ID,
  ACCOUNT_ID,
  REGION,
  LAMBDA_TASK_ROOT,
  STAGE,
  AUTH_TYPE_HOST,
};

export const VIEWPORT_WIDTH = 1200;

export const SCREENSHOT_FORMAT = 'png';
export const SUPPORTED_FORMATS = ['pdf', 'png', 'epub'];
export const PENDING_STATUS = 'pending';
export const DONE_STATUS = 'done';
export const EXPORT_TOPIC = `export-${STAGE}`;

export const VIEWER_SUBDOMAIN = 'viewer';

export const GRAASP = /^https?:\/\/(dev\.)?graasp\.eu$/;
export const GRAASP_VIEWER = /^https?:\/\/(viewer\.)?(dev\.)?graasp\.eu/g;
export const GRAASP_CLOUD = /^https?:\/\/cloud\.(dev\.)?graasp\.eu/g;

export const AUTH_TYPE_ANONYMOUS = 'local-contextual-anonymous';
export const AUTH_TYPE_USERNAME = 'local-contextual-username';
export const AUTH_TYPE_PASSWORD = 'local-contextual-username-password';

// the files page that download the generated file times out at 3 minutes
// (180000ms), so ensure that this timeout is less than or equal than that one
export const TIMEOUT = 180000;
export const ELEMENTS_TIMEOUT = 5000;
export const FRAMES_TIMEOUT = 500;
export const LOGIN_TIMEOUT = 30000;

export const DEFAULT_LANGUAGE = 'en';

export const MODE_STATIC = 'static';
export const MODE_INTERACTIVE_OFFLINE = 'interactive-offline';
export const MODE_INTERACTIVE_ONLINE = 'interactive-online';

export const COVER_DEFAULT_PATH =
  'https://d15r9r12e2oqn3.cloudfront.net/epfl/bg.jpg';

export const TEXT_SEPARATOR = '<br><br>';
export const DEFAULT_BACK_COVER = `
Generated in Switzerland by Graasp${TEXT_SEPARATOR}
This work is subject to copyright. All rights are reserved by the Publisher, 
whether the whole or part of the material is concerned, specifically the rights of translation, reprinting, reuse of 
illustrations, recitation, broadcasting, reproduction on microfilms or in any other physical way, and transmission or 
information storage and retrieval, electronic adaptation, computer software, or by similar or dissimilar methodology 
now known or hereafter developed. Exempted from this legal reservation are brief excerpts in connection with reviews 
or scholarly analysis or material supplied specifically for the purpose of being entered and executed on a computer system, 
for exclusive use by the purchaser of the work. Duplication of this publication or parts thereof is permitted only under the 
provisions of the Copyright Law of the Publisher’s location, in its current version, and permission for use must always be obtained 
from Graasp. Permissions for use may be obtained through the support page on the Graasp platform.${TEXT_SEPARATOR}
Graasp (graasp.eu) is developed at the École Polytechnique Fédérale de Lausanne (epfl.ch).
`;
export const PUBLISHER_DEFAULT = 'Graasp';

export const COVER_PROPERTIES = {
  BACKGROUND_COLOR: 'white',
  FONT: 'Arial',
  FONT_COLOR: 'black',
  MARGIN_LEFT: 50,
  MARGIN_TOP: 100,

  // general text properties
  FONT_SIZE: 20,
  LINE_SPACING: 5,

  // title properties
  TITLE_FONT_SIZE: 60,
  TITLE_MARGIN: 10,

  // secondary title properties
  SECONDARY_TITLE_FONT_SIZE: 40,

  // image properties
  IMAGE_MARGIN: 15,
  IMAGE_HEIGHT: 350,
};

export const CSS_STYLES_FILE = path.join(__dirname, 'services/css/styles.css');

export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Credentials': true,
};

// emulates the settings inside the chrome devtools panel
// source: https://fdalvi.github.io/blog/2018-02-05-puppeteer-network-throttle/
export const NETWORK_PRESETS = {
  GPRS: {
    offline: false,
    downloadThroughput: (50 * 1024) / 8,
    uploadThroughput: (20 * 1024) / 8,
    latency: 500,
  },
  Regular2G: {
    offline: false,
    downloadThroughput: (250 * 1024) / 8,
    uploadThroughput: (50 * 1024) / 8,
    latency: 300,
  },
  Good2G: {
    offline: false,
    downloadThroughput: (450 * 1024) / 8,
    uploadThroughput: (150 * 1024) / 8,
    latency: 150,
  },
  Regular3G: {
    offline: false,
    downloadThroughput: (750 * 1024) / 8,
    uploadThroughput: (250 * 1024) / 8,
    latency: 100,
  },
  Good3G: {
    offline: false,
    downloadThroughput: (1.5 * 1024 * 1024) / 8,
    uploadThroughput: (750 * 1024) / 8,
    latency: 40,
  },
  Regular4G: {
    offline: false,
    downloadThroughput: (4 * 1024 * 1024) / 8,
    uploadThroughput: (3 * 1024 * 1024) / 8,
    latency: 20,
  },
  DSL: {
    offline: false,
    downloadThroughput: (2 * 1024 * 1024) / 8,
    uploadThroughput: (1 * 1024 * 1024) / 8,
    latency: 5,
  },
  WiFi: {
    offline: false,
    downloadThroughput: (30 * 1024 * 1024) / 8,
    uploadThroughput: (15 * 1024 * 1024) / 8,
    latency: 2,
  },
};
export const DEFAULT_NETWORK_PRESET = 'Regular3G';
