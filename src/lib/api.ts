import axios from "axios";
import { getSession, signOut } from "next-auth/react";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000")
  .replace(/\/+$/, "")
  .replace(/\/api\/v1$/, "");

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: false,
});

// Request interceptor to add the access token to headers
api.interceptors.request.use(
  async (config) => {
    const session = await getSession();
    if (session?.accessToken) {
      config.headers.Authorization = `Bearer ${session.accessToken}`;
    }
    return config;
  },
  (error) => {
    const message = error.response?.data?.message;
    if (typeof message === "string") error.message = message;
    return Promise.reject(error);
  },
);

// Response interceptor to handle 401 errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If the error is 401 and we haven't retried yet
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      const session = await getSession();

      // If there's an error in the session (refresh failed), log out
      if (session?.error === "RefreshAccessTokenError") {
        signOut({ callbackUrl: "/" });
        return Promise.reject(error);
      }

      // If we have a new access token, retry the request
      if (session?.accessToken) {
        originalRequest.headers.Authorization = `Bearer ${session.accessToken}`;
        return api(originalRequest);
      }
    }

    const message = error.response?.data?.message;
    if (typeof message === "string") error.message = message;
    return Promise.reject(error);
  },
);
