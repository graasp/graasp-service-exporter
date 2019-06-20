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

export const GRAASP_VIEWER = /https?:\/\/viewer\.(dev\.)?graasp\.eu/g;
export const GRAASP_CLOUD = /https?:\/\/cloud\.(dev\.)?graasp\.eu/g;

export const AUTH_TYPE_ANONYMOUS = 'local-contextual-anonymous';
export const AUTH_TYPE_USERNAME = 'local-contextual-username';
export const AUTH_TYPE_PASSWORD = 'local-contextual-username-password';

// the files page that download the generated file times out at 3 minutes
// (180000ms), so ensure that this timeout is less than or equal than that one
export const TIMEOUT = 180000;
export const ELEMENTS_TIMEOUT = 3000;

export const DEFAULT_LANGUAGE = 'en';

export const MODE_STATIC = 'static';
export const MODE_INTERACTIVE_OFFLINE = 'interactive_offline';
export const MODE_INTERACTIVE_ONLINE = 'interactive_online';

export const COVER_PATH = `${TMP_FOLDER}/cover.jpg`;
export const COVER_DEFAULT_PATH =
  'https://d28t6ykz01qrod.cloudfront.net/epfl/bg.jpg';

export const BACKGROUND_COLOR = 'white';
export const FONT = 'Arial';
export const FONT_COLOR = 'black';

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
