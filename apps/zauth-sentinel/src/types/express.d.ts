import type { SentinelUser, SentinelSession, Assurance } from "./models.js";

declare global {
  namespace Express {
    interface Request {
      sentinelUser?: SentinelUser;
      sentinelSession?: SentinelSession;
      assurance?: Assurance;
    }
  }
}
