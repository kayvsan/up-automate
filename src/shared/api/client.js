import axios from 'axios';

export const ZERNIO_BASE_URL = 'https://zernio.com/api/v1';

export const createZernioClient = (apiKey) =>
  axios.create({
    baseURL: ZERNIO_BASE_URL,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  });

export const createZernioFormClient = (apiKey) =>
  axios.create({
    baseURL: ZERNIO_BASE_URL,
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });
