import { createZernioClient } from '../../shared/api/client';

export const fetchAccounts = (apiKey) =>
  createZernioClient(apiKey).get('/accounts');

export const disconnectAccount = (apiKey, accountId) =>
  createZernioClient(apiKey).delete(`/accounts/${accountId}`);

export const getConnectOAuthUrl = (apiKey, profileId, platform, redirectUrl) =>
  createZernioClient(apiKey).get(`/connect/${platform}`, { params: { profileId, redirectUrl, redirect_url: redirectUrl } });
