import Logger from '../utils/Logger';

const handleError = async event => {
  Logger.error(event);
};

/**
 * throws a test error to test how we are catching errors
 * @returns {Promise<void>}
 */
const throwError = async () => {
  throw Error('testing error catching functionality');
};

export { handleError, throwError };
