import ObjectId from 'bson-objectid';
import Logger from '../utils/Logger';
import {
  convertSpaceToFile,
  upload,
  isReady,
  getFileAsString,
} from '../services/export';
import {
  SUPPORTED_FORMATS,
  GRAASP_FILES_HOST,
  S3_HOST,
  PENDING_STATUS,
  EXPORT_TOPIC,
  CORS_HEADERS,
  DEFAULT_NETWORK_PRESET,
  DONE_STATUS,
} from '../config';
import { publishSnsTopic } from '../services/sns';

const generateExport = async event => {
  try {
    const { id, body, headers, fileId } = JSON.parse(
      event.Records[0].Sns.Message
    );

    const { dryRun, networkPreset = DEFAULT_NETWORK_PRESET } = body;

    // get start date in millis
    const start = new Date().valueOf();

    const file = await convertSpaceToFile(id, body, headers);

    // get end date in millis
    const end = new Date().valueOf();

    // if it is a dry run, then we do not upload an export file, but a json with metadata
    if (dryRun) {
      const duration = end - start;
      Logger.debug(`duration: ${duration}ms`);
      const report = Buffer.from(`{
        "duration": ${duration},
        "networkPreset": "${networkPreset}"
      }`);
      await upload(report, fileId);
    } else if (file) {
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
    const { format = 'pdf', dryRun = false } = bodyJson;

    // we flag a dry run as a json file
    const fileId = `${ObjectId().str}.${dryRun ? 'json' : format}`;

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
        'Access-Control-Expose-Headers': 'Location',
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
      // json indicates that this was a dry run
      if (id.endsWith('json')) {
        const body = await getFileAsString(id);
        return {
          statusCode: 200,
          headers: {
            ...CORS_HEADERS,
          },
          body: JSON.stringify({
            ...JSON.parse(body),
            status: DONE_STATUS,
          }),
        };
      }
      return {
        statusCode: 303,
        headers: {
          'Access-Control-Expose-Headers': 'Location',
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
