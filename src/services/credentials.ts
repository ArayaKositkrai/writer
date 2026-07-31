// src/services/credentials.ts

import { AiSettings } from '../types';
import { appEnv } from './env';

const KEY_PREFIX = 'novel_studio_api_key_session_v1';

function storageKey(provider: AiSettings['provider']) {
  return `${KEY_PREFIX}_${provider}`;
}

function getEnvironmentApiKey(provider: AiSettings['provider']) {
  if (provider === 'gemini') return appEnv.geminiApiKey;
  if (provider === 'openai') return appEnv.openAiApiKey;
  return '';
}

export function getApiKey(provider: AiSettings['provider']) {
  try {
    const sessionKey = sessionStorage.getItem(storageKey(provider))?.trim() ?? '';
    return sessionKey || getEnvironmentApiKey(provider);
  } catch {
    return getEnvironmentApiKey(provider);
  }
}

export function isApiKeyFromEnvironment(provider: AiSettings['provider']) {
  return Boolean(getEnvironmentApiKey(provider));
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
