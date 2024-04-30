import * as jwt from 'jsonwebtoken';
import fetch from 'node-fetch';
import * as crypto from 'crypto';
import redis from '@erxes/api-utils/src/redis';
import { getEnv } from '@erxes/api-utils/src/core';
import * as FormData from 'form-data';
import * as moment from 'moment';

export const generateToken = async (integrationId, username?, password?) => {
  const secret = process.env.JWT_TOKEN_SECRET || 'secret';

  const token = jwt.sign({ integrationId, username, password }, secret);
  return token;
};

export const getRecordUrl = async (params, user, models, subdomain) => {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

  const {
    operatorPhone,
    customerPhone,
    callType,
    callStartTime,
    callEndTime,
    _id,
  } = params;

  const history = await models.CallHistory.findOne({ _id });
  const { inboxIntegrationId = '' } = history;
  const integration = await models.Integrations.findOne({
    inboxId: inboxIntegrationId,
  }).lean();

  if (!integration) {
    throw new Error('Integration not found');
  }
  const { wsServer = '' } = integration;
  const operator = integration.operators.find(
    (operator) => operator.userId === user?._id,
  );
  const extentionNumber = operator?.gsUsername || '6500';

  let cookie = await getOrSetCallCookie(wsServer);
  cookie = cookie.toString();

  const queueResult = await fetch(`https://${wsServer}/api`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      request: {
        action: 'listQueue',
        cookie,
        options: 'extension,queue_name,members',
        sidx: 'extension',
        sord: 'asc',
      },
    }),
  });

  const queueData = await queueResult.json();
  const { queue } = queueData?.response;
  const extension = queue.find(
    (queue) =>
      queue.members && queue.members.split(',').includes(extentionNumber),
  )?.extension;

  const startDate = moment(callStartTime).format('YYYY-MM-DD');
  const endTime = moment(callEndTime).format('YYYY-MM-DD');
  let caller = customerPhone;
  let callee = extension || operatorPhone;

  if (callType === 'outgoing') {
    caller = extentionNumber;
    callee = customerPhone;
  }

  const cdr = await fetch(`https://${wsServer}/api`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      request: {
        action: 'cdrapi',
        cookie,
        format: 'json',
        caller,
        callee,
        numRecords: '100',
        startTime: `${startDate}T00:00:00`,
        endTime: `${endTime}T23:59:59`,
      },
    }),
  });

  const cdrData = await cdr.json();

  const { cdr_root } = cdrData;

  const todayCdr = JSON.parse(JSON.stringify(cdr_root));

  const sortedCdr = todayCdr.sort(
    (a, b) => a.createdAt?.getTime() - b.createdAt?.getTime(),
  );
  const lastCreatedObject = sortedCdr[todayCdr.length - 1];

  let fileNameWithoutExtension = '';
  if (lastCreatedObject && lastCreatedObject.disposition === 'ANSWERED') {
    const { recordfiles = '' } = lastCreatedObject;

    if (recordfiles) {
      const parts = recordfiles.split('/');
      const fileName = parts[1];
      fileNameWithoutExtension = fileName.split('@')[0];
    }
  }
  if (fileNameWithoutExtension) {
    const records = await fetch(`https://${wsServer}/api`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },

      body: JSON.stringify({
        request: {
          action: 'recapi',
          cookie,
          filedir: 'monitor',
          filename: fileNameWithoutExtension,
        },
      }),
    });

    if (!records.ok) {
      throw new Error(`HTTP error! status: ${records.status}`);
    }
    const buffer = await records.arrayBuffer();
    const domain = getEnv({
      name: 'DOMAIN',
      subdomain,
      defaultValue: 'http://localhost:4000',
    });
    const uploadUrl = domain.includes('localhost')
      ? `${domain}/pl:core/upload-file`
      : `${domain}/gateway/pl:core/upload-file`;

    const formData = new FormData();
    formData.append('file', Buffer.from(buffer), {
      filename: fileNameWithoutExtension,
    });

    const rec = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
    });
    return await rec.text();
  }
  return '';
};

export const getOrSetCallCookie = async (wsServer) => {
  const user = 'recApi';
  const pass = 'recApi13';

  const callCookie = await redis.get(`callCookie`);
  if (callCookie) {
    return callCookie;
  }
  const response = await fetch(`https://${wsServer}/api`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      request: {
        action: 'challenge',
        user,
        version: '1.2',
      },
    }),
  });
  const data = await response.json();

  const { challenge } = data?.response;

  const hashedPassword = crypto
    .createHash('md5')
    .update(challenge + pass)
    .digest('hex');

  // Send a new request to authenticate the user
  const loginResponse = await fetch(`https://${wsServer}/api`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      request: {
        action: 'login',
        user,
        token: hashedPassword,
      },
    }),
  });

  const loginData = await loginResponse.json();
  const { cookie } = loginData.response;

  redis.set(`callCookie`, cookie, 'EX', 10 * 60);
  return cookie;
};
