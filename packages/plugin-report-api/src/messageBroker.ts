import { ISendMessageArgs, sendMessage } from '@erxes/api-utils/src/core';
import { serviceDiscovery } from './configs';
import { Reports } from './models';

let client;

export const initBroker = async cl => {
  client = cl;

  const { consumeQueue, consumeRPCQueue } = client;

  consumeQueue('report:send', async ({ data }) => {
    Reports.send(data);

    return {
      status: 'success'
    };
  });

  consumeRPCQueue('report:find', async ({ data }) => {
    return {
      status: 'success',
      data: await Reports.find({})
    };
  });
};

export const sendCommonMessage = async (
  args: ISendMessageArgs & { serviceName: string }
) => {
  return sendMessage({
    serviceDiscovery,
    client,
    ...args
  });
};

export default function() {
  return client;
}