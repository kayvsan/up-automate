import axios from 'axios';

const ZERNIO_API_BASE = 'https://zernio.com/api';

export const fetchUsage = async (apiKey) => {
  return await axios.get(`${ZERNIO_API_BASE}/v1/usage`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
};

export const fetchAnalytics = async (apiKey) => {
  return await axios.get(`${ZERNIO_API_BASE}/v1/analytics`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
};

export const fetchAds = async (apiKey) => {
  return await axios.get(`${ZERNIO_API_BASE}/v1/ads/campaigns`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
};

export const fetchInbox = async (apiKey) => {
  return await axios.get(`${ZERNIO_API_BASE}/v1/inbox/conversations`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
};
