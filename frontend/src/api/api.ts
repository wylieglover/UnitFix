import axios, { AxiosError } from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
  withCredentials: true,
});

// --- Request Interceptor ---
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Logic for Refresh Token Queue
let refreshing = false;
let queue: ((token: string) => void)[] = [];

// --- Response Interceptor ---
api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as any;

    /**
     * 1. BYPASS FOR LOGIN
     * If the error comes from a login attempt, do not try to refresh.
     * We pass the error directly back to SignIn.tsx so it can display the 
     * "Invalid credentials" message without a page refresh.
     */
    if (original.url?.includes("/auth/login")) {
      return Promise.reject(error);
    }

    /**
     * 2. REFRESH TOKEN LOGIC
     * Handle 401 Unauthorized errors for all other routes.
     */
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      if (!refreshing) {
        refreshing = true;
        try {
          // Attempt to get a new access token using the HttpOnly refresh cookie
          const res = await axios.post<{ accessToken: string }>(
            `${api.defaults.baseURL}/auth/refresh`,
            {},
            { withCredentials: true }
          );

          const newToken = res.data.accessToken;
          localStorage.setItem("accessToken", newToken);

          // Execute all queued requests with the new token
          queue.forEach((cb) => cb(newToken));
          queue = [];

          // Retry the original failed request
          return api(original);
        } catch (refreshError) {
          /**
           * If refresh fails, the user's session is truly dead.
           * Clean up and send them to login.
           */
          localStorage.removeItem("accessToken");
          window.location.href = "/signin";
          return Promise.reject(refreshError);
        } finally {
          refreshing = false;
        }
      }

      // If a refresh is already in progress, add this request to the queue
      return new Promise((resolve) => {
        queue.push((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          resolve(api(original));
        });
      });
    }

    return Promise.reject(error);
  }
);

/**
 * Helper to extract context from the URL.
 * Useful for services so you don't have to drill IDs through 10 components.
 */
export const getRouteParams = () => {
  const path = window.location.pathname;
  const orgMatch = path.match(/\/organizations\/([^/]+)/);
  const propMatch = path.match(/\/properties\/([^/]+)/);

  return {
    organizationId: orgMatch ? orgMatch[1] : null,
    propertyId: propMatch ? propMatch[1] : null,
  };
};