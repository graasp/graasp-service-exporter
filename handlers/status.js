import Logger from '../utils/Logger';

const getStatus = async () => {
  Logger.debug('getting status');
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'OK',
    }),
  };
};

// todo: remove when more exports are added
// eslint-disable-next-line
export { getStatus };
