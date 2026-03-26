import fs from "node:fs";
import path from "node:path";
import express, { Router } from "express";
import { config } from "../config.js";

const SPA_EXCLUDED_PREFIXES = ["/api", "/health", "/login", "/callback", "/logout"];

function shouldServeSpa(pathname: string): boolean {
  return !SPA_EXCLUDED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function devHintPage(): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Sentinel Dev Server</title>
<style>
body { margin: 0; min-height: 100vh; display: grid; place-items: center; font-family: Arial, sans-serif; background: #0f1115; color: #e8eaed; }
.card { background: #1a1c1f; border: 1px solid #2d3748; border-radius: 16px; max-width: 620px; padding: 20px; }
h1 { margin: 0; font-size: 28px; }
p { line-height: 1.5; color: #94a3b8; }
code { background: #2d3748; padding: 2px 6px; border-radius: 6px; }
a { color: #6b8a3d; }
</style>
</head>
<body>
  <div class="card">
    <h1>Sentinel Dev UI</h1>
    <p>The React dev server should run on <code>http://localhost:5174</code>.</p>
    <p>Open <a href="http://localhost:5174">http://localhost:5174</a> for the UI. Backend APIs stay on this server.</p>
  </div>
</body>
</html>`;
}

export function createSpaRouter(): Router {
  const router = Router();
  const staticRoot = path.resolve(process.cwd(), "dist/web");
  const indexPath = path.join(staticRoot, "index.html");
  const hasBuiltSpa = fs.existsSync(indexPath);

  if (hasBuiltSpa) {
    router.use(express.static(staticRoot, { index: false }));
    router.get("*", (req, res, next) => {
      if (!shouldServeSpa(req.path)) {
        next();
        return;
      }
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
        return;
      }
      res.type("html").send(devHintPage());
    });
    return router;
  }

  router.get("*", (req, res, next) => {
    if (!shouldServeSpa(req.path)) {
      next();
      return;
    }

    if (config.sentinelAppOrigin && config.sentinelAppOrigin !== config.sentinelBaseUrl) {
      const target = new URL(req.originalUrl || req.url, config.sentinelAppOrigin).toString();
      res.redirect(302, target);
      return;
    }

    res.type("html").send(devHintPage());
  });

  return router;
}
