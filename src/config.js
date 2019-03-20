const {
  GRAASP_HOST = 'https://graasp.eu',
  LOGGING_LEVEL = 'info',
  TMP_PATH = './tmp',
  GRAASP_FILES_HOST = 'http://localhost:3000',
  S3_BUCKET = null,
  S3_HOST = null,
  CI_BRANCH = undefined,
  CI_COMMIT_ID = undefined,
  REGION = 'eu-central-1',
  ACCOUNT_ID = null,
  CHROME_PATH = '/opt/headless_shell',
  LAMBDA_TASK_ROOT,
} = process.env;

export {
  S3_BUCKET,
  S3_HOST,
  GRAASP_HOST,
  LOGGING_LEVEL,
  TMP_PATH,
  GRAASP_FILES_HOST,
  CI_BRANCH,
  CI_COMMIT_ID,
  ACCOUNT_ID,
  REGION,
  CHROME_PATH,
  LAMBDA_TASK_ROOT,
};

export const SUPPORTED_FORMATS = ['pdf', 'png', 'epub'];
export const PENDING_STATUS = 'pending';
export const EXPORT_TOPIC = 'export';
