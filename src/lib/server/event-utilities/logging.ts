import { getRequestEvent } from '$app/server';

export const log = (...args: unknown[]) => {
  const event = getRequestEvent();
  console.log(
    `[LOG] [${new Date().toISOString()}] ${event.request.method} ${event.url.pathname} ::`,
    ...args
  );
};

export const logError = (...args: unknown[]) => {
  const event = getRequestEvent();
  console.error(
    `[ERR] [${new Date().toISOString()}] ${event.request.method} ${event.url.pathname} ::`,
    ...args
  );
};
