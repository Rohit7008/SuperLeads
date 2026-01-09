import { api } from "./api";

/**
 * User Types
 */
export type User = {
    id: string;
    name: string;
    email: string;
    role?: 'admin' | 'user';
};

/**
 * Fetch all available users (usually for assignment selection)
 * @returns Array of User objects
 */
export const getUsers = async (): Promise<User[]> => {
    console.log("[Users Service] Fetching user list...");
    const res = await api.get("/users");
    return res.data;
};

/**
 * Helper to generate consistent cache keys for User-related data
 */
export const getUserKey = (id: number) => `/users/${id}`;
