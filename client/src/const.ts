export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Simplified login URL to prevent any runtime errors during initial setup.
export const getLoginUrl = () => {
  // Return a simple string to avoid URL constructor errors
  return "/api/oauth/login-placeholder";
};
