import launchChrome from '@serverless-chrome/lambda';
import request from 'superagent';
import { CHROME_PATH } from '../config';
import isLambda from './isLambda';

const getChrome = async () => {
  const chrome = await launchChrome({
    headless: true,
    args: ['--no-sandbox', '--disable-gpu', '--single-process'],
    executablePath: isLambda ? CHROME_PATH : undefined,
    // slowMo: 250,
  });

  const response = await request
    .get(`${chrome.url}/json/version`)
    .set('Content-Type', 'application/json');

  const endpoint = response.body.webSocketDebuggerUrl;

  return {
    endpoint,
    instance: chrome,
  };
};

export default getChrome;
