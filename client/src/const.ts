export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Generate login URL at runtime so redirect URI reflects the current origin.
export const getLoginUrl = () => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL || "https://auth.manus.im";
  const appId = import.meta.env.VITE_APP_ID || "teste_local";
  const redirectUri = typeof window !== "undefined" ? `${window.location.origin}/api/oauth/callback` : "";
  const state = btoa(redirectUri);

  // If oauthPortalUrl is not a valid URL, return a safe fallback instead of throwing
  try {
    if (!oauthPortalUrl || oauthPortalUrl === "") {
      return "#";
    }
    const url = new URL(`${oauthPortalUrl}/app-auth`);
    url.searchParams.set("appId", appId);
    url.searchParams.set("redirectUri", redirectUri);
    url.searchParams.set("state", state);
    url.searchParams.set("type", "signIn");
    return url.toString();
  } catch (e) {
    console.warn("Erro ao gerar URL de login, usando fallback:", e);
    return "#";
  }
};
