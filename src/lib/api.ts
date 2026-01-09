/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";
import { supabase } from "@/lib/supabase";

/**
 * Shared Axios Instance
 * 
 * Configured with base URL and automatic interceptors for:
 * 1. Request: Injects current Supabase session token into Bearer headers.
 * 2. Response: Handles 401 Unauthorized errors for automatic logout/cleanup.
 * 
 * Performance: Using a shared instance avoids redundant config and enables connection pooling.
 */
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Debug log for environment verification
console.log("[API] Initialized with Base URL:", process.env.NEXT_PUBLIC_API_URL);

/**
 * Request Interceptor
 * 
 * Dynamically retrieves the Supabase JWT session token before every request.
 * This ensures we never send an expired token if a refresh just occurred.
 */
api.interceptors.request.use(async (config) => {
  if (typeof window !== "undefined") {
    try {
      const { data: { session } } = await (supabase.auth as any).getSession();
      const token = session?.access_token;

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        // console.debug(`[API] Request: ${config.method?.toUpperCase()} ${config.url} - Auth Attached`);
      }
    } catch (error) {
      console.error("[API] Failed to retrieve session for interceptor:", error);
    }
  }
  return config;
});

/**
 * Response Interceptor
 * 
 * Global error handling for standard API responses.
 * Specifically listens for 401s to handle session expiration gracefully.
 */
api.interceptors.response.use(
  (response) => {
    // console.debug(`[API] Response: ${response.status} from ${response.config.url}`);
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url;

    console.warn(`[API] Error: ${status || 'Network Error'} on ${url}`, error.response?.data || error.message);

    if (status === 401) {
      if (typeof window !== "undefined") {
        console.error("[API] 401 Unauthorized detected. Clearing local session...");
        localStorage.removeItem("token");
      }
    }
    return Promise.reject(error);
  }
);