/**
 * Safely extract a route parameter ID from Express params
 * Express types params as string | string[], but we need just string
 */
export function getParamId(params: Record<string, string | string[]>): string {
  const id = params.id;
  if (Array.isArray(id)) {
    throw new Error('Invalid ID parameter: expected string');
  }
  return id;
}

/**
 * Safely extract any string parameter from Express params
 */
export function getParam(params: Record<string, string | string[]>, key: string): string {
  const value = params[key];
  if (Array.isArray(value)) {
    throw new Error(`Invalid parameter: expected string for ${key}`);
  }
  return value;
}
