import ObjectId from 'bson-objectid';
import Logger from '../utils/Logger';
import { convertSpaceToFile, upload, isReady } from '../services/export';
import {
  SUPPORTED_FORMATS,
  GRAASP_FILES_HOST,
  S3_HOST,
  PENDING_STATUS,
  EXPORT_TOPIC,
  CORS_HEADERS,
} from '../config';
import { publishSnsTopic } from '../services/sns';

const generateExport = async event => {
  try {
    const { id, body, headers, fileId } = JSON.parse(
      event.Records[0].Sns.Message
    );
    const file = await convertSpaceToFile(id, body, headers);
    if (file) {
      await upload(file, fileId);
    } else {
      Logger.error('no file available for upload');
    }
  } catch (err) {
    Logger.error('error creating print', err);
  }
};

const postExport = async ({ pathParameters, headers, body } = {}) => {
  Logger.debug('posting export');
  try {
    const { id } = pathParameters;

    // validate id
    if (!id || !ObjectId.isValid(id)) {
      return {
        statusCode: 422,
        headers: {
          ...CORS_HEADERS,
        },
        body: JSON.stringify({
          message: 'error: invalid space id',
        }),
      };
    }

    const bodyJson = JSON.parse(body);

    // only log headers and body when debugging
    Logger.debug(headers);
    Logger.debug(bodyJson);

    if (bodyJson.format) {
      // validate format is supported
      Logger.debug(`validating format ${bodyJson.format}`);
      if (!SUPPORTED_FORMATS.includes(bodyJson.format)) {
        return {
          statusCode: 422,
          headers: {
            ...CORS_HEADERS,
          },
          body: JSON.stringify({
            message: 'error: invalid format',
          }),
        };
      }
    }
    // if request looks good, send location to front end
    // create id
    const { format = 'pdf' } = bodyJson;
    const fileId = `${ObjectId().str}.${format}`;

    // publish to sns
    await publishSnsTopic({
      data: {
        id,
        body: bodyJson,
        headers,
        fileId,
      },
      topic: EXPORT_TOPIC,
    });

    // return 202 with location
    const response = {
      statusCode: 202,
      headers: {
        ...CORS_HEADERS,
        Location: `${GRAASP_FILES_HOST}/queue/${fileId}`,
      },
    };

    // debug logs
    Logger.debug('response succeeded');
    Logger.debug(response);

    return response;
  } catch (err) {
    Logger.error(err);

    const response = {
      statusCode: 500,
      headers: {
        ...CORS_HEADERS,
      },
      body: JSON.stringify({
        message: `${err.name}: ${err.message}`,
      }),
    };

    // debug logs
    Logger.debug('response failed');
    Logger.debug(response);

    return response;
  }
};

const getExport = async ({ pathParameters } = {}) => {
  Logger.info('getting export');
  try {
    const { id } = pathParameters;

    // validate id
    if (!id || !ObjectId.isValid(id.split('.')[0])) {
      return {
        statusCode: 422,
        headers: {
          ...CORS_HEADERS,
        },
        body: JSON.stringify({
          message: 'error: invalid document id',
        }),
      };
    }

    const ready = await isReady(id);

    if (ready) {
      return {
        statusCode: 303,
        headers: {
          Location: `${S3_HOST}/${id}`,
          ...CORS_HEADERS,
        },
      };
    }
    return {
      statusCode: 200,
      headers: {
        ...CORS_HEADERS,
      },
      body: JSON.stringify({ status: PENDING_STATUS }),
    };
  } catch (err) {
    Logger.error(err);
    return {
      statusCode: 500,
      headers: {
        ...CORS_HEADERS,
      },
      body: JSON.stringify({
        message: `${err.name}: ${err.message}`,
      }),
    };
  }
};

export { getExport, postExport, generateExport };
