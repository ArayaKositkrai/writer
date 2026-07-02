import { AiSettings } from '../types';

const KEY_PREFIX = 'novel_studio_api_key_session_v1';

function storageKey(provider: AiSettings['provider']) {
  return `${KEY_PREFIX}_${provider}`;
}

export function getApiKey(provider: AiSettings['provider']) {
  try {
    return sessionStorage.getItem(storageKey(provider))?.trim() ?? '';
  } catch {
    return '';
  }
}

export function setApiKey(provider: AiSettings['provider'], apiKey: string) {
  const value = apiKey.trim();
  if (!value) {
    clearApiKey(provider);
    return;
  }
  sessionStorage.setItem(storageKey(provider), value);
}

export function clearApiKey(provider: AiSettings['provider']) {
  try {
    sessionStorage.removeItem(storageKey(provider));
  } catch {
    // sessionStorage may be unavailable in hardened browser contexts.
  }
}

export function hasApiKey(provider: AiSettings['provider']) {
  return Boolean(getApiKey(provider));
}
