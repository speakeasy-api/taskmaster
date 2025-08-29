import { getRequestEvent } from '$app/server';
import { randomBytes } from 'crypto';

type FlashMessageParams = {
  title: string;
  description: string;
};

export const sendFlashMessage = (params: FlashMessageParams) => {
  const event = getRequestEvent();

  const messageKey = `_message-${randomBytes(4).toString('base64url')}`;
  const messageJson = JSON.stringify({
    title: params.title,
    description: params.description,
    createdAt: Date.now()
  } satisfies FlashMessage);
  event.cookies.set(messageKey, messageJson, { path: '/', httpOnly: false, maxAge: 15 });
};
