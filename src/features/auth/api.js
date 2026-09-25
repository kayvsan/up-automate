import { createZernioClient } from '../../shared/api/client';

export const fetchProfiles = (apiKey) =>
  createZernioClient(apiKey).get('/profiles');

export const createProfile = (apiKey, name) =>
  createZernioClient(apiKey).post('/profiles', { name });

export const deleteProfile = (apiKey, profileId) =>
  createZernioClient(apiKey).delete(`/profiles/${profileId}`);
