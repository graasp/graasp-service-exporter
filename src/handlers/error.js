import Logger from '../utils/Logger';

const handleError = async event => {
  Logger.error(event);
};

export {
  // eslint-disable-next-line
  handleError,
};
