import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

export function registerOAuthRoutes(app: Express) {
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    try {
      console.log("[OAuth] Callback received with code and state");
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      console.log("[OAuth] Token exchanged successfully");
      
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
      console.log("[OAuth] User info retrieved for openId:", userInfo.openId);

      if (!userInfo.openId) {
        console.error("[OAuth] openId missing from user info response");
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }

      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: new Date(),
      });
      console.log("[OAuth] User upserted in database");

      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      const isSecure = cookieOptions.secure;
      
      console.log("[OAuth] Setting session cookie. Secure:", isSecure);
      res.cookie(COOKIE_NAME, sessionToken, {
        ...cookieOptions,
        sameSite: isSecure ? "none" : "lax",
        maxAge: ONE_YEAR_MS,
      });

      res.redirect(302, "/");
    } catch (error: any) {
      console.error("[OAuth] Callback failed:", error.message);
      if (error.response) {
        console.error("[OAuth] Error response data:", error.response.data);
        console.error("[OAuth] Error response status:", error.response.status);
      }
      res.status(500).json({ 
        error: "OAuth callback failed", 
        message: error.message,
        details: process.env.NODE_ENV === 'development' ? error.response?.data : undefined
      });
    }
  });
}
