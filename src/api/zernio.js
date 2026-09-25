import axios from "axios";

const BASE_URL = "https://zernio.com/api/v1";

const getClient = (apiKey) =>
  axios.create({
    baseURL: BASE_URL,
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
  });

export const getProfiles = (apiKey) => getClient(apiKey).get("/profiles");
export const createProfile = (apiKey, name) => getClient(apiKey).post("/profiles", { name });
export const getAccounts = (apiKey) => getClient(apiKey).get("/accounts");
export const disconnectAccount = (apiKey, id) => getClient(apiKey).delete(`/accounts/${id}`);
export const getConnectUrl = (apiKey, profileId, platform) =>
  getClient(apiKey).post("/connect/oauth/url", { profileId, platform });

export const uploadMedia = (apiKey, formData) =>
  axios.create({ baseURL: BASE_URL, headers: { Authorization: `Bearer ${apiKey}` } }).post("/media/upload", formData);

export const createPost = (apiKey, payload) => getClient(apiKey).post("/posts", payload);
export const getPosts = (apiKey, params = {}) => getClient(apiKey).get("/posts", { params });
export const getPost = (apiKey, postId) => getClient(apiKey).get(`/posts/${postId}`);
export const deletePost = (apiKey, postId) => getClient(apiKey).delete(`/posts/${postId}`);
export const updatePost = (apiKey, postId, payload) => getClient(apiKey).patch(`/posts/${postId}`, payload);
