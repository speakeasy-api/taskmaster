export const requestHandlerTemplate = (
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  methodToCall: string
) => `
export async function ${method}(event) {
  const middlewareResult = await __middleware(event);
  if (middlewareResult) return middlewareResult;
  return ${methodToCall}(event);
}`;

export const loadHandler = `
export async function load(event) {
  const middlewareResult = await __middleware(event);
  if (middlewareResult) return middlewareResult;
  return __original_load(event);
}`;

export const actionsHandler = `
export const actions = new Proxy(__original_actions, {
  get(target, prop) {
    const originalAction = target[prop];
    if (typeof originalAction === 'function') {
      return async (event) => {
        const middlewareResult = await __middleware(event);
        if (middlewareResult) return middlewareResult;
        return originalAction(event);
      };
    }
    return originalAction;
  }
});`;
