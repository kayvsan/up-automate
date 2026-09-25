import { createZernioClient, createZernioFormClient } from '../../shared/api/client';

export const getPresignedUrl = (apiKey, payload) =>
  createZernioClient(apiKey).post('/media/presign', payload);

export const createPost = (apiKey, payload) =>
  createZernioClient(apiKey).post('/posts', payload);

export const updatePost = (apiKey, postId, payload) =>
  createZernioClient(apiKey).patch(`/posts/${postId}`, payload);

export const deletePost = (apiKey, postId) =>
  createZernioClient(apiKey).delete(`/posts/${postId}`);

export const validatePost = (apiKey, payload) =>
  createZernioClient(apiKey).post('/validate/post', payload);
