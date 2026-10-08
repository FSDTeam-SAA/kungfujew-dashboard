import axios from "axios";
import { getSession, signOut } from "next-auth/react";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000")
  .replace(/\/+$/, "")
  .replace(/\/api\/v1$/, "");

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: false,
});

api.interceptors.request.use(
  async (config) => {
    const session = await getSession();
    if (session?.accessToken) {
      config.headers.Authorization = "Bearer " + session.accessToken;
    }
    return config;
  },
  (error) => {
    const message = error.response?.data?.message;
    if (typeof message === "string") error.message = message;
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      const session = await getSession();
      const currentAuthorization = originalRequest.headers?.Authorization;
      const refreshedAuthorization = session?.accessToken
        ? "Bearer " + session.accessToken
        : undefined;

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

    const message = error.response?.data?.message;
    if (typeof message === "string") error.message = message;
    return Promise.reject(error);
  },
);
