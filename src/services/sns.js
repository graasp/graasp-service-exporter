import Sns from 'aws-sdk/clients/sns';
import { REGION, ACCOUNT_ID } from '../config';
import isLambda from '../utils/isLambda';

const sns = new Sns({
  region: REGION,
  endpoint: isLambda ? undefined : 'http://127.0.0.1:4002',
});

const publishSnsTopic = async ({ data, topic }) => {
  const params = {
    Message: JSON.stringify(data),
    TopicArn: `arn:aws:sns:${REGION}:${ACCOUNT_ID}:${topic}`,
  };
  return sns.publish(params).promise();
};

export {
  // eslint-disable-next-line
  publishSnsTopic,
};
