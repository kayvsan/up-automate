import { createZernioClient } from '../../shared/api/client';

export const fetchPosts = (apiKey, params = {}) =>
  createZernioClient(apiKey).get('/posts', { params });

export const fetchPost = (apiKey, postId) =>
  createZernioClient(apiKey).get(`/posts/${postId}`);
