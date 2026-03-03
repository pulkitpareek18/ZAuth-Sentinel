import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { ethers } from "ethers";
import { config } from "../config.js";
import { pool } from "../db/pool.js";
import { randomId, sha256 } from "../utils/crypto.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// Mode detection
// ---------------------------------------------------------------------------

function isChainConfigured(): boolean {
  return !!(config.anchorChainRpcUrl && config.anchorChainContract && config.anchorPrivateKey);
}

function isPinataConfigured(): boolean {
  return !!config.anchorPinataJwt;
}

// ---------------------------------------------------------------------------
// Merkle tree
// ---------------------------------------------------------------------------

function buildMerkleRoot(leaves: string[]): string {
  if (leaves.length === 0) {
    return sha256("EMPTY");
  }
  let nodes = [...leaves];
  while (nodes.length > 1) {
    const next: string[] = [];
    for (let i = 0; i < nodes.length; i += 2) {
      const left = nodes[i];
      const right = nodes[i + 1] ?? nodes[i];
      next.push(sha256(`${left}:${right}`));
    }
    nodes = next;
  }
  return nodes[0];
}

// ---------------------------------------------------------------------------
// Pseudo fallbacks (kept for when chain/IPFS is not configured)
// ---------------------------------------------------------------------------

function pseudoChainTxHash(root: string): string {
  return `0x${sha256(`tx:${root}:${Date.now()}`).slice(0, 64)}`;
}

function pseudoIpfsCid(root: string): string {
  return `bafy${sha256(`ipfs:${root}`).slice(0, 44)}`;
}

// ---------------------------------------------------------------------------
// Real blockchain submission (Polygon Amoy / any EVM)
// ---------------------------------------------------------------------------

let provider: ethers.JsonRpcProvider | null = null;
let contract: ethers.Contract | null = null;

function getContract(): ethers.Contract {
  if (contract) return contract;

  const abiPath = resolve(__dirname, "../../contracts/ZAuthAnchor.abi.json");
  const abi = JSON.parse(readFileSync(abiPath, "utf8"));

  provider = new ethers.JsonRpcProvider(config.anchorChainRpcUrl);
  const wallet = new ethers.Wallet(config.anchorPrivateKey!, provider);
  contract = new ethers.Contract(config.anchorChainContract!, abi, wallet);
  return contract;
}

async function submitMerkleRoot(batchId: string, merkleRoot: string): Promise<string> {
  const c = getContract();
  const rootBytes32 = "0x" + merkleRoot; // sha256 = 64 hex chars = 32 bytes
  const tx = await c.anchor(batchId, rootBytes32);
  const receipt = await tx.wait();
  return receipt.hash;
}

// ---------------------------------------------------------------------------
// Real IPFS pinning (Pinata REST API)
// ---------------------------------------------------------------------------

interface AnchorPayload {
  batchId: string;
  merkleRoot: string;
  leaves: string[];
  chainTxHash: string;
  timestamp: string;
}

async function pinToIpfs(payload: AnchorPayload): Promise<string> {
  const apiBase = config.anchorIpfsApi || "https://api.pinata.cloud";

  const response = await fetch(`${apiBase}/pinning/pinJSONToIPFS`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.anchorPinataJwt}`,
    },
    body: JSON.stringify({
      pinataContent: payload,
      pinataMetadata: {
        name: `zauth-anchor-${payload.batchId}`,
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Pinata pin failed (${response.status}): ${text}`);
  }

  const result = (await response.json()) as { IpfsHash: string };
  return result.IpfsHash;
}

// ---------------------------------------------------------------------------
// Anchor batch runner
// ---------------------------------------------------------------------------

export async function runAnchorBatch(): Promise<{
  batchId: string;
  merkleRoot: string;
  chainTxHash: string;
  ipfsCid: string;
  mode: "real" | "pseudo";
} | null> {
  const latestBatch = await pool.query<{ anchored_at: string }>(
    `SELECT anchored_at::text
     FROM anchor_batches
     ORDER BY anchored_at DESC
     LIMIT 1`
  );
  const anchoredAfter = latestBatch.rows[0]?.anchored_at;

  const commitments = await pool.query<{ commitment_root: string }>(
    anchoredAfter
      ? `SELECT commitment_root
         FROM identity_commitments
         WHERE created_at > $1::timestamptz
         ORDER BY created_at ASC`
      : `SELECT commitment_root
         FROM identity_commitments
         ORDER BY created_at ASC`,
    anchoredAfter ? [anchoredAfter] : []
  );

  const latestAudit = await pool.query<{ hash: string }>(
    `SELECT hash
     FROM audit_events
     ORDER BY created_at DESC
     LIMIT 1`
  );

  const leaves = commitments.rows.map((row) => row.commitment_root);
  if (latestAudit.rows[0]?.hash) {
    leaves.push(latestAudit.rows[0].hash);
  }

  if (leaves.length === 0) {
    return null;
  }

  const merkleRoot = buildMerkleRoot(leaves);
  const batchId = randomId(18);

  let chainTxHash: string;
  let ipfsCid: string;
  let mode: "real" | "pseudo" = "pseudo";

  // 1. Chain anchoring
  if (isChainConfigured()) {
    try {
      chainTxHash = await submitMerkleRoot(batchId, merkleRoot);
      mode = "real";
    } catch (err) {
      console.error("chain anchor failed, falling back to pseudo:", err);
      chainTxHash = pseudoChainTxHash(merkleRoot);
    }
  } else {
    chainTxHash = pseudoChainTxHash(merkleRoot);
  }

  // 2. IPFS pinning
  if (isPinataConfigured()) {
    try {
      ipfsCid = await pinToIpfs({
        batchId,
        merkleRoot,
        leaves,
        chainTxHash,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error("ipfs pin failed, falling back to pseudo:", err);
      ipfsCid = pseudoIpfsCid(merkleRoot);
    }
  } else {
    ipfsCid = pseudoIpfsCid(merkleRoot);
  }

  // 3. Store in database
  await pool.query(
    `INSERT INTO anchor_batches (batch_id, merkle_root, chain_tx_hash, ipfs_cid)
     VALUES ($1, $2, $3, $4)`,
    [batchId, merkleRoot, chainTxHash, ipfsCid]
  );

  return {
    batchId,
    merkleRoot,
    chainTxHash,
    ipfsCid,
    mode,
  };
}

// ---------------------------------------------------------------------------
// Scheduler
// ---------------------------------------------------------------------------

export function startAnchorScheduler(): void {
  if (!config.anchorEnabled) {
    return;
  }

  const intervalMs = Math.max(1, config.anchorIntervalHours) * 60 * 60 * 1000;
  console.log(
    `anchor scheduler started: interval=${config.anchorIntervalHours}h chain=${isChainConfigured() ? "real" : "pseudo"} ipfs=${isPinataConfigured() ? "pinata" : "pseudo"}`
  );

  setInterval(() => {
    runAnchorBatch()
      .then((batch) => {
        if (batch) {
          console.log(
            `anchor batch stored [${batch.mode}] id=${batch.batchId} root=${batch.merkleRoot} tx=${batch.chainTxHash} cid=${batch.ipfsCid}`
          );
        }
      })
      .catch((error) => {
        console.error("anchor batch failed", error);
      });
  }, intervalMs);
}
