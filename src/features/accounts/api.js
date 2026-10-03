import { createZernioClient } from '../../shared/api/client';

export const fetchAccounts = (apiKey) =>
  createZernioClient(apiKey).get('/accounts');

export const disconnectAccount = (apiKey, accountId) =>
  createZernioClient(apiKey).delete(`/accounts/${accountId}`);

export const getConnectOAuthUrl = (apiKey, profileId, platform, redirectUrl, options = {}) =>
  createZernioClient(apiKey).get(`/connect/${platform}`, {
    params: { profileId, redirect_url: redirectUrl, ...options },
  });

// Facebook headless flow — list pages after OAuth callback
export const listFacebookPages = (apiKey, profileId, tempToken) =>
  createZernioClient(apiKey).get('/connect/facebook/select-page', {
    params: { profileId, tempToken },
  });

// Facebook headless flow — finalize connection with selected page
export const selectFacebookPage = (apiKey, { profileId, pageId, tempToken, userProfile, redirect_url }) =>
  createZernioClient(apiKey).post('/connect/facebook/select-page', {
    profileId,
    pageId,
    tempToken,
    userProfile,
    redirect_url,
  });
