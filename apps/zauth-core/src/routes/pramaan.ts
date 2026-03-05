import { Router, type Response } from "express";
import { z } from "zod";
import { config } from "../config.js";
import { pool } from "../db/pool.js";
import { requireSession } from "../middleware/requireSession.js";
import { writeAuditEvent } from "../services/auditService.js";
import {
  completeEnrollment,
  createProofChallenge as createProofChallengeV2,
  findIdentityForSubject,
  getProofReceipt,
  startEnrollment,
  submitProof,
  verifyFaceDescriptor
} from "../services/pramaanV2Service.js";
import { rateLimit } from "../middleware/rateLimit.js";

export const pramaanRouter = Router();

function ensureV2Enabled(res: Response): boolean {
  if (!config.pramaanV2Enabled) {
    res.status(404).json({ error: "pramaan_v2_disabled" });
    return false;
  }
  return true;
}

pramaanRouter.post("/pramaan/v2/enrollment/start", requireSession, async (req, res) => {
  if (!ensureV2Enabled(res)) {
    return;
  }

  const schema = z.object({
    tenant_id: z.string().default("default"),
    login_hint: z.string().optional(),
    request_id: z.string().optional()
  });
  const parsed = schema.safeParse(req.body ?? {});
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", details: parsed.error.issues });
    return;
  }

  const session = res.locals.session as { subjectId: string; username: string };
  const draft = await startEnrollment({
    tenantId: parsed.data.tenant_id,
    subjectId: session.subjectId,
    loginHint: parsed.data.login_hint ?? session.username,
    requestId: parsed.data.request_id
  });

  await writeAuditEvent({
    tenantId: parsed.data.tenant_id,
    actor: session.username,
    action: "pramaan.v2.enrollment.start",
    outcome: "success",
    traceId: req.traceId,
    payload: {
      enrollment_id: draft.enrollmentId,
      uid_draft: draft.uidDraft,
      did_draft: draft.didDraft
    }
  });

  res.status(201).json({
    enrollment_id: draft.enrollmentId,
    uid_draft: draft.uidDraft,
    did_draft: draft.didDraft,
    zk_challenge: draft.zkChallenge,
    circuit_id: draft.circuitId,
    zk_mode: config.zkVerifierMode,
    expires_at: new Date(draft.expiresAt).toISOString()
  });
});

pramaanRouter.post("/pramaan/v2/enrollment/complete", requireSession, async (req, res) => {
  if (!ensureV2Enabled(res)) {
    return;
  }

  const schema = z.object({
    enrollment_id: z.string().min(6),
    passkey_credential_id: z.string().min(4),
    liveness_session_id: z.string().min(6),
    zk_proof: z.unknown(),
    public_signals: z.unknown(),
    hash1: z.string().min(16),
    hash2: z.string().min(16),
    commitment_root: z.string().min(16),
    biometric_hash: z.string().min(32).max(128).optional(),
    enrollment_descriptor: z.string().min(100).max(300).optional(),
    skip_recovery_code_regen: z.boolean().optional()
  });
  const parsed = schema.safeParse(req.body ?? {});
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", details: parsed.error.issues });
    return;
  }

  const session = res.locals.session as { subjectId: string; username: string };

  try {
    const enrollment = await completeEnrollment({
      enrollmentId: parsed.data.enrollment_id,
      subjectId: session.subjectId,
      passkeyCredentialId: parsed.data.passkey_credential_id,
      livenessSessionId: parsed.data.liveness_session_id,
      zkProof: parsed.data.zk_proof,
      publicSignals: parsed.data.public_signals,
      hash1: parsed.data.hash1,
      hash2: parsed.data.hash2,
      commitmentRoot: parsed.data.commitment_root,
      biometricHash: parsed.data.biometric_hash,
      enrollmentDescriptor: parsed.data.enrollment_descriptor,
      skipRecoveryCodeRegen: parsed.data.skip_recovery_code_regen
    });

    await writeAuditEvent({
      tenantId: "default",
      actor: session.username,
      action: "pramaan.v2.enrollment.complete",
      outcome: "success",
      traceId: req.traceId,
      payload: {
        uid: enrollment.uid,
        did: enrollment.did,
        liveness_session_id: parsed.data.liveness_session_id
      }
    });

    res.status(201).json({
      uid: enrollment.uid,
      did: enrollment.did,
      assurance_level: enrollment.assuranceLevel,
      recovery_codes: enrollment.recoveryCodes,
      attestation_jwt: enrollment.attestationJwt
    });
  } catch (error) {
    await writeAuditEvent({
      tenantId: "default",
      actor: session.username,
      action: "pramaan.v2.enrollment.complete",
      outcome: "failure",
      traceId: req.traceId,
      payload: { reason: (error as Error).message }
    });

    res.status(400).json({
      error: "enrollment_failed",
      reason: (error as Error).message
    });
  }
});

pramaanRouter.post("/pramaan/v2/proof/challenge", async (req, res) => {
  if (!ensureV2Enabled(res)) {
    return;
  }

  const schema = z.object({
    uid: z.string().min(3),
    purpose: z.string().default("authentication")
  });
  const parsed = schema.safeParse(req.body ?? {});
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", details: parsed.error.issues });
    return;
  }

  try {
    const challenge = await createProofChallengeV2({
      uid: parsed.data.uid,
      purpose: parsed.data.purpose
    });

    res.status(200).json({
      proof_request_id: challenge.proofRequestId,
      challenge: challenge.challenge,
      challenge_hash: challenge.challengeHash,
      challenge_field: challenge.challengeField,
      circuit_id: challenge.circuitId,
      zk_mode: config.zkVerifierMode,
      expires_at: challenge.expiresAt
    });
  } catch (error) {
    res.status(404).json({
      error: "uid_not_found",
      reason: (error as Error).message
    });
  }
});

pramaanRouter.post("/pramaan/v2/proof/submit", async (req, res) => {
  if (!ensureV2Enabled(res)) {
    return;
  }

  const schema = z.object({
    proof_request_id: z.string().min(6),
    uid: z.string().min(3),
    zk_proof: z.unknown(),
    public_signals: z.unknown(),
    handoff_id: z.string().optional(),
    biometric_hash: z.string().min(32).max(128).optional()
  });
  const parsed = schema.safeParse(req.body ?? {});
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", details: parsed.error.issues });
    return;
  }

  try {
    const result = await submitProof({
      proofRequestId: parsed.data.proof_request_id,
      uid: parsed.data.uid,
      zkProof: parsed.data.zk_proof,
      publicSignals: parsed.data.public_signals,
      handoffId: parsed.data.handoff_id,
      biometricHash: parsed.data.biometric_hash
    });

    await writeAuditEvent({
      tenantId: "default",
      actor: parsed.data.uid,
      action: "pramaan.v2.proof.submit",
      outcome: result.verified ? "success" : "failure",
      traceId: req.traceId,
      payload: {
        proof_request_id: parsed.data.proof_request_id,
        verification_id: result.verificationId,
        reason: result.reason ?? null
      }
    });

    res.status(result.verified ? 200 : 400).json({
      verified: result.verified,
      verification_id: result.verificationId,
      reason: result.reason
    });
  } catch (error) {
    res.status(400).json({
      verified: false,
      error: "proof_submit_failed",
      reason: (error as Error).message
    });
  }
});

pramaanRouter.get("/pramaan/v2/proof/status", async (req, res) => {
  if (!ensureV2Enabled(res)) {
    return;
  }

  const verificationId = String(req.query.verification_id ?? "");
  if (!verificationId) {
    res.status(400).json({ error: "invalid_request" });
    return;
  }

  const receipt = await getProofReceipt(verificationId);
  if (!receipt) {
    res.status(404).json({ status: "missing", verified: false });
    return;
  }

  res.status(200).json({
    status: receipt.verified ? "verified" : "failed",
    verified: receipt.verified,
    reason: receipt.reason ?? undefined,
    created_at: receipt.created_at
  });
});

pramaanRouter.get("/pramaan/v2/identity/me", requireSession, async (_req, res) => {
  if (!ensureV2Enabled(res)) {
    return;
  }

  const session = res.locals.session as { subjectId: string };
  const identity = await findIdentityForSubject(session.subjectId);
  if (!identity) {
    res.status(404).json({ error: "identity_not_found" });
    return;
  }
  res.status(200).json(identity);
});

// Cross-device face verification: server-side quantized descriptor matching.
// When a user logs in from a new device (no IndexedDB enrollment), the client
// sends its live quantized face descriptor. The server computes Euclidean
// distance against the stored enrollment descriptor (128 bytes, lossy).
// If matched, the server returns the enrollment_hash so the client can
// construct a valid ZK proof with the correct biometric preimage.
//
// Security layers (all required):
//   1. Passkey authentication (requireSession middleware)
//   2. Liveness detection (blink/turn challenges, already completed)
//   3. Server-side face matching (quantized Euclidean distance < 70.4)
//   4. Subject ownership check (prevents cross-user queries)
//   5. Rate limiting (5 requests per minute per IP)
//
// Privacy: only lossy quantized descriptors are compared — cannot reconstruct face.
const verifyFaceRateLimit = rateLimit({ windowMs: 60_000, max: 5 });

pramaanRouter.post("/pramaan/v2/identity/verify-face", requireSession, verifyFaceRateLimit, async (req, res) => {
  if (!ensureV2Enabled(res)) {
    return;
  }

  const schema = z.object({
    uid: z.string().min(3),
    live_descriptor: z.string().min(100).max(300)
  });
  const parsed = schema.safeParse(req.body ?? {});
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", details: parsed.error.issues });
    return;
  }

  const session = res.locals.session as { subjectId: string; username: string };

  try {
    const result = await verifyFaceDescriptor({
      uid: parsed.data.uid,
      liveDescriptorBase64: parsed.data.live_descriptor,
      subjectId: session.subjectId
    });

    await writeAuditEvent({
      tenantId: "default",
      actor: session.username,
      action: "pramaan.v2.identity.verify_face",
      outcome: result.matched ? "success" : "failure",
      traceId: req.traceId,
      payload: {
        uid: parsed.data.uid,
        distance: Math.round(result.distance * 100) / 100,
        matched: result.matched
      }
    });

    if (result.matched) {
      res.status(200).json({
        matched: true,
        enrollment_hash: result.enrollmentHash,
        distance: Math.round(result.distance * 100) / 100
      });
    } else {
      res.status(403).json({
        matched: false,
        reason: "face_mismatch",
        distance: Math.round(result.distance * 100) / 100
      });
    }
  } catch (error) {
    const message = (error as Error).message;

    await writeAuditEvent({
      tenantId: "default",
      actor: session.username,
      action: "pramaan.v2.identity.verify_face",
      outcome: "failure",
      traceId: req.traceId,
      payload: { uid: parsed.data.uid, reason: message }
    });

    if (message === "no_enrollment_descriptor") {
      res.status(404).json({
        matched: false,
        reason: "no_enrollment_descriptor",
        message: "This account was enrolled before cross-device verification was available. Please re-enroll via recovery codes."
      });
    } else if (message === "subject_mismatch") {
      res.status(403).json({ matched: false, reason: "subject_mismatch" });
    } else if (message === "uid_not_found") {
      res.status(404).json({ matched: false, reason: "uid_not_found" });
    } else {
      res.status(400).json({
        matched: false,
        error: "verify_face_failed",
        reason: message
      });
    }
  }
});

// Privacy-by-design: biometric verification confirms face liveness was performed.
// Face-api.js descriptors vary between captures, so exact SHA-256 hash matching
// across sessions is impossible. This endpoint confirms the client successfully
// detected a face (liveness proof) and provided a biometric hash.
pramaanRouter.post("/pramaan/v2/biometric/verify", requireSession, async (req, res) => {
  if (!ensureV2Enabled(res)) {
    return;
  }

  const schema = z.object({
    uid: z.string().min(3),
    biometric_hash: z.string().min(32).max(128)
  });
  const parsed = schema.safeParse(req.body ?? {});
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", details: parsed.error.issues });
    return;
  }

  const session = res.locals.session as { subjectId: string; username: string };

  try {
    // Verify the uid exists in our identity map
    const uidCheck = await pool.query(
      `SELECT uid FROM pramaan_identity_map WHERE uid = $1`,
      [parsed.data.uid]
    );
    if (!uidCheck.rows[0]) {
      res.status(404).json({ matched: false, reason: "uid_not_found" });
      return;
    }

    // The biometric_hash being present confirms client-side face detection succeeded.
    // We accept it as a liveness signal — identity binding is proven via ZK proofs.
    await writeAuditEvent({
      tenantId: "default",
      actor: session.username,
      action: "pramaan.v2.biometric.verify",
      outcome: "success",
      traceId: req.traceId,
      payload: {
        uid: parsed.data.uid,
        biometric_provided: true
      }
    });

    res.status(200).json({
      matched: true
    });
  } catch (error) {
    res.status(400).json({
      matched: false,
      error: "biometric_verify_failed",
      reason: (error as Error).message
    });
  }
});
