// eslint-disable-next-line
const argv = require('yargs').argv;
const path = require('path');
const fs = require('fs');

const DEFAULT_PATH = './';

const {
  GRAASP_HOST,
  TMP_PATH,
  DEBUG: debug,
  S3_BUCKET,
  S3_HOST,
  GRAASP_FILES_HOST,
  API_PORT,
  SNS_PORT,
  S3_PORT,
  LOGGING_LEVEL,
  ACCOUNT_ID,
  REGION,
  SENTRY_DSN,
} = process.env;

// parse boolean
const DEBUG = debug === 'true';

const env = JSON.stringify({
  GRAASP_HOST,
  TMP_PATH,
  DEBUG,
  S3_BUCKET,
  S3_HOST,
  GRAASP_FILES_HOST,
  API_PORT,
  SNS_PORT,
  S3_PORT,
  LOGGING_LEVEL,
  ACCOUNT_ID,
  REGION,
  SENTRY_DSN,
});

const { stage } = argv;

const name = `env.${stage}.json`;

fs.writeFileSync(path.join(DEFAULT_PATH, name), env, { encoding: 'utf8' });
