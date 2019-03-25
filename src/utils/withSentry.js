import Raven from 'raven';
import SentryWrapper from 'serverless-sentry-lib';

/**
 * wraps a handler with an error handler from sentry
 * @param handler
 * @returns {*}
 */
const withSentry = handler => SentryWrapper.handler(Raven, handler);

export default withSentry;
