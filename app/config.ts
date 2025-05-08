export const NEXT_PUBLIC_URL = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://airtimeplus-api.vercel.app';

// API endpoints
export const API_ENDPOINTS = {
  USER_INFO: (address: string) => `${API_BASE_URL}/user-info/${address}`,
  // Add other endpoints as needed
};