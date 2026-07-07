/**
 * @param {string} baseKey
 * @param {string | null | undefined} devUserId
 */
export function resolveUserDataStorageKey(baseKey, devUserId) {
  if (!__DEV__ || devUserId == null || devUserId === '') return baseKey;
  return `${baseKey}__dev_${devUserId}`;
}
