import Logger from '../utils/Logger';
import { CI_BRANCH, CI_COMMIT_ID } from '../config';

// todo: remove when more exports are added
// eslint-disable-next-line
const getVersion = async () => {
  Logger.debug('getting version');
  try {
    return {
      statusCode: 200,
      body: JSON.stringify({
        tag: CI_BRANCH,
        commit: CI_COMMIT_ID,
      }),
    };
  } catch (err) {
    const message = `${err.name}: ${err.message}`;
    Logger.error(message);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message,
      }),
    };
  }
};

// todo: remove when more exports are added
// eslint-disable-next-line
export { getVersion };
