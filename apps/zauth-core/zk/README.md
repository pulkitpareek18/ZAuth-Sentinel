# Zero-Knowledge Proof Circuit

## Circuit: `biometric_commitment.circom`

The core Circom circuit that enables privacy-preserving biometric authentication. Users prove they possess a valid biometric commitment without revealing the underlying biometric data.

### Circuit Design

```
                        ┌──────────────────────────┐
  preimage (private) ──>│                          ├──> commitment (public)
                        │   BiometricProof()       │    = Poseidon(preimage)
  challenge (public) ──>│                          ├──> binding (public)
                        └──────────────────────────┘    = Poseidon(preimage, challenge)
```

**Private inputs:**
- `preimage` — The biometric hash truncated to 253 bits (fits in BN128 scalar field)

**Public inputs:**
- `challenge` — Server-issued challenge nonce (also truncated to 253 bits, 5-min TTL)

**Public outputs:**
- `commitment` — `Poseidon(preimage)` — stored at enrollment, verified at authentication
- `binding` — `Poseidon(preimage, challenge)` — proves freshness / challenge binding

### How It Works

1. **Enrollment**: User's face descriptor is hashed client-side. The `commitment = Poseidon(biometric_hash)` is stored on the server.
2. **Authentication**: Server issues a challenge. The client generates a Groth16 proof that it knows a `preimage` such that:
   - `Poseidon(preimage)` matches the stored commitment
   - `Poseidon(preimage, challenge)` binds the proof to this specific challenge
3. **Verification**: Server verifies the proof using only the verification key and public signals. It learns nothing about the biometric data.

### Why Poseidon?

Poseidon is a ZK-friendly hash function designed for arithmetic circuits over prime fields. It is significantly more efficient than SHA-256 inside a Groth16 circuit (fewer constraints), while maintaining 128-bit security on the BN128 curve.

### Security Properties

- **Zero-knowledge**: The proof reveals nothing about the biometric preimage
- **Soundness**: Forging a proof without the correct preimage is computationally infeasible (Knowledge of Exponent assumption on BN128)
- **Challenge binding**: Each proof is bound to a unique server-issued challenge (5-min TTL), preventing replay attacks
- **Field safety**: BN128 scalar field masking ensures all signals remain within the valid field

## Build Artifacts

| File | Description |
|------|-------------|
| `biometric_commitment.circom` | Source circuit (Circom 2.1.9) |
| `verification_key.json` | Groth16 verification key (used server-side) |
| `build/biometric_commitment.r1cs` | Rank-1 Constraint System |
| `build/biometric_commitment.sym` | Symbol table for debugging |
| `build/circuit_final.zkey` | Proving key (used client-side) |
| `build/circomlib/` | Circomlib dependency (includes Poseidon) |

## Build Process

### Prerequisites

- [Circom 2.1.9](https://docs.circom.io/getting-started/installation/)
- [snarkjs](https://github.com/iden3/snarkjs) (`npm install -g snarkjs`)

### Compile Circuit

```bash
# Compile the circuit
circom biometric_commitment.circom --r1cs --wasm --sym -o build/ -l build/

# Powers of Tau ceremony (one-time setup)
snarkjs powersoftau new bn128 12 pot12_0000.ptau
snarkjs powersoftau contribute pot12_0000.ptau pot12_0001.ptau --name="First contribution"
snarkjs powersoftau prepare phase2 pot12_0001.ptau pot12_final.ptau

# Generate proving and verification keys
snarkjs groth16 setup build/biometric_commitment.r1cs pot12_final.ptau build/circuit_0000.zkey
snarkjs zkey contribute build/circuit_0000.zkey build/circuit_final.zkey --name="First contribution"
snarkjs zkey export verificationkey build/circuit_final.zkey verification_key.json
```

### Verify Artifacts

```bash
npm run zk:check --workspace apps/zauth-core
```

This checks that `verification_key.json` exists and contains a valid Groth16 verification key.

## Integration

The circuit integrates with the server via `src/services/zkService.ts`:

- **`verifyZkProof()`** — Verifies a Groth16 proof against the verification key
- **`hexToFieldElement()`** — Truncates hex values to 253 bits for BN128 compatibility
- **Challenge binding validation** — Ensures the challenge hash appears in the public signals

## Patent

This zero-knowledge biometric commitment system is covered by Indian Patent Application No. 202311041001 (GRANTED), filed by Yushu Excellence Technologies Private Limited.
