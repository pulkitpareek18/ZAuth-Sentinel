#!/usr/bin/env node
// Deploy ZAuthAnchor contract to Polygon Amoy testnet (or any EVM chain).
// Usage: ANCHOR_PRIVATE_KEY=0x... ANCHOR_CHAIN_RPC_URL=https://rpc-amoy.polygon.technology/ node scripts/deploy-anchor.mjs

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import solc from "solc";
import { ethers } from "ethers";

const __dirname = dirname(fileURLToPath(import.meta.url));

const RPC_URL = process.env.ANCHOR_CHAIN_RPC_URL || "https://rpc-amoy.polygon.technology/";
const PRIVATE_KEY = process.env.ANCHOR_PRIVATE_KEY;

if (!PRIVATE_KEY) {
  console.error("Error: ANCHOR_PRIVATE_KEY env var is required");
  console.error("Usage: ANCHOR_PRIVATE_KEY=0x... node scripts/deploy-anchor.mjs");
  process.exit(1);
}

// 1. Compile the contract
console.log("Compiling ZAuthAnchor.sol...");
const source = readFileSync(resolve(__dirname, "../contracts/ZAuthAnchor.sol"), "utf8");
const input = JSON.stringify({
  language: "Solidity",
  sources: { "ZAuthAnchor.sol": { content: source } },
  settings: {
    outputSelection: { "*": { "*": ["abi", "evm.bytecode.object"] } },
  },
});

const output = JSON.parse(solc.compile(input));
const errors = output.errors?.filter((e) => e.severity === "error") ?? [];
if (errors.length > 0) {
  console.error("Compilation errors:");
  errors.forEach((e) => console.error(e.formattedMessage));
  process.exit(1);
}

const contract = output.contracts["ZAuthAnchor.sol"]["ZAuthAnchor"];
const abi = contract.abi;
const bytecode = "0x" + contract.evm.bytecode.object;
console.log("Compilation successful.");

// 2. Connect to chain
const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

const network = await provider.getNetwork();
console.log(`Chain: ${network.name} (id: ${network.chainId})`);
console.log(`Deployer: ${wallet.address}`);

const balance = await provider.getBalance(wallet.address);
console.log(`Balance: ${ethers.formatEther(balance)} MATIC`);

if (balance === 0n) {
  console.error("\nWallet has no MATIC. Get testnet MATIC from:");
  console.error("  https://faucet.polygon.technology/");
  process.exit(1);
}

// 3. Deploy
console.log("\nDeploying ZAuthAnchor...");
const factory = new ethers.ContractFactory(abi, bytecode, wallet);
const deployed = await factory.deploy();
const tx = deployed.deploymentTransaction();
console.log(`Transaction: ${tx.hash}`);

console.log("Waiting for confirmation...");
await deployed.waitForDeployment();

const address = await deployed.getAddress();
console.log(`\nZAuthAnchor deployed at: ${address}`);
console.log(`\nSet this in your .env:`);
console.log(`  ANCHOR_CHAIN_CONTRACT=${address}`);
console.log(`\nVerify on explorer:`);
console.log(`  https://amoy.polygonscan.com/address/${address}`);
