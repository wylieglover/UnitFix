import axios, { AxiosError } from "axios";

export const api = axios.create({
  baseURL: "http://localhost:3000/api",
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshing = false;
let queue: ((token: string) => void)[] = [];

api.interceptors.response.use(
  res => res,
  async (error: AxiosError) => {
    const original = error.config as any;

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      if (!refreshing) {
        refreshing = true;
        try {
          const res = await api.post<{ accessToken: string }>("/auth/refresh");
          const newToken = res.data.accessToken;
          localStorage.setItem("accessToken", newToken);

          queue.forEach(cb => cb(newToken));
          queue = [];

          return api(original);
        } finally {
          refreshing = false;
        }
      }

      return new Promise(resolve => {
        queue.push((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          resolve(api(original));
        });
      });
    }

    return Promise.reject(error);
  }
);
