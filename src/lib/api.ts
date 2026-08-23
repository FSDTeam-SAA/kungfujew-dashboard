import axios from "axios";
import { getSession, signOut } from "next-auth/react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

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
    return Promise.reject(error);
  },
);

// Response interceptor to handle 401 errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If the error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const session = await getSession();

      const currentAuthorization = originalRequest.headers?.Authorization;
      const refreshedAuthorization = session?.accessToken
        ? `Bearer ${session.accessToken}`
        : undefined;

      // A revoked token cannot be repaired by retrying the same bearer token.
      if (
        session?.error === "RefreshAccessTokenError" ||
        !refreshedAuthorization ||
        refreshedAuthorization === currentAuthorization
      ) {
        await signOut({ callbackUrl: "/" });
        return Promise.reject(error);
      }

      originalRequest.headers.Authorization = refreshedAuthorization;
      return api(originalRequest);
    }

    return Promise.reject(error);
  },
);
