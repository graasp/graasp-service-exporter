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
  CHROME_PATH = '/opt/headless_shell',
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
  CHROME_PATH,
  LAMBDA_TASK_ROOT,
  STAGE,
  AUTH_TYPE_HOST,
};

export const SUPPORTED_FORMATS = ['pdf', 'png', 'epub'];
export const PENDING_STATUS = 'pending';
export const EXPORT_TOPIC = `export-${STAGE}`;

export const AUTH_TYPE_ANONYMOUS = 'local-contextual-anonymous';
export const AUTH_TYPE_USERNAME = 'local-contextual-username';
export const AUTH_TYPE_PASSWORD = 'local-contextual-username-password';
export const TIMEOUT = 60000;

export const DEFAULT_LANGUAGE = 'en';

export const MODE_STATIC = 'static';
export const MODE_OFFLINE = 'read-only';
export const MODE_INTERACTIVE = 'interactive';

export const COVER_PATH = `${TMP_FOLDER}/cover.jpg`;
export const COVER_DEFAULT_PATH =
  'https://d28t6ykz01qrod.cloudfront.net/epfl/bg.jpg';

export const BACKGROUND_COLOR = 'white';
export const FONT = 'Arial';
export const FONT_COLOR = 'black';
