// src/features/auth/services/authService.ts
import { api } from "../../../api/api";
import type { LoginPayload, LoginResponse } from "../types/auth.types";

export const authService = {
  login: async (payload: LoginPayload) => {
    const res = await api.post<LoginResponse>("/auth/login", payload);
    // Store the token immediately
    localStorage.setItem("accessToken", res.data.accessToken);
    return res.data;
  },

  logout: async () => {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.error("Logout API error:", error);
    } finally {
      localStorage.removeItem("accessToken");
    }
  },
};