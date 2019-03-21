import { getStatus } from './handlers/status';
import { getVersion } from './handlers/version';
import { getExport, postExport, generateExport } from './handlers/export';
import { handleError, throwError } from './handlers/error';
import withSentry from './utils/withSentry';

const getStatusWithSentry = withSentry(getStatus);
const getVersionWithSentry = withSentry(getVersion);
const getExportWithSentry = withSentry(getExport);
const postExportWithSentry = withSentry(postExport);
const generateExportWithSentry = withSentry(generateExport);
const handleErrorWithSentry = withSentry(handleError);
const throwErrorWithSentry = withSentry(throwError);

export {
  getStatusWithSentry,
  getVersionWithSentry,
  getExportWithSentry,
  postExportWithSentry,
  generateExportWithSentry,
  handleErrorWithSentry,
  throwErrorWithSentry,
};
