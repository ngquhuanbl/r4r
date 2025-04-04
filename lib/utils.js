import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { customAlphabet } from "nanoid";

export const nanoid = customAlphabet(
  "23456789abcdefghkmnprstuvwxyzABCDEFGHKMNPRSTUVWXYZ",
  12
);

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function isDevEnv() {
  return process && process.env.NODE_ENV === "development";
}

// Platform styling info for client components
// Now platforms are fetched directly from the database in page components
export function getPlatformStyle(platformId, platformStyles = {}) {
  return platformStyles[platformId] || { color: "bg-gray-500 hover:bg-gray-600", name: "Unknown" };
}

// Format date helper
export function formatDate(dateString) {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date);
}

