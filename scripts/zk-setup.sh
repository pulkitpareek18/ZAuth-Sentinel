#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ZK_DIR="$PROJECT_ROOT/apps/zauth-core/zk"
BUILD_DIR="$ZK_DIR/build"

echo "=== Z Auth ZK Setup ==="
echo "Building real Groth16 circuit artifacts..."

mkdir -p "$BUILD_DIR"

# 1. Install circom from source via Rust (works on both ARM and x86)
echo "[1/8] Installing circom from source..."
if ! command -v circom &> /dev/null; then
  apt-get update -qq && apt-get install -y -qq build-essential curl git > /dev/null 2>&1 || true
  if ! command -v cargo &> /dev/null; then
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    export PATH="$HOME/.cargo/bin:$PATH"
  fi
  cargo install --git https://github.com/iden3/circom.git --tag v2.1.9
  export PATH="$HOME/.cargo/bin:$PATH"
fi
export PATH="$HOME/.cargo/bin:$PATH"
echo "    circom version: $(circom --version)"

# 2. Get circomlib (circom2-compatible circuits from GitHub)
echo "[2/8] Getting circomlib (circom2-compatible)..."
CIRCOMLIB_DIR="$BUILD_DIR/circomlib"
if [ ! -f "$CIRCOMLIB_DIR/circuits/poseidon.circom" ]; then
  rm -rf "$CIRCOMLIB_DIR"
  git clone --depth 1 https://github.com/iden3/circomlib.git "$CIRCOMLIB_DIR"
fi
echo "    Verifying circomlib installation..."
ls "$CIRCOMLIB_DIR/circuits/poseidon.circom"

# 3. Compile the circuit
echo "[3/8] Compiling biometric_commitment.circom..."
circom "$ZK_DIR/biometric_commitment.circom" \
  --r1cs --wasm --sym \
  -l "$BUILD_DIR" \
  -o "$BUILD_DIR" \
  --verbose

echo "    Circuit compiled. Constraint info:"
npx snarkjs r1cs info "$BUILD_DIR/biometric_commitment.r1cs"

# 4. Download Powers of Tau from Hermez ceremony (pot12 supports up to 4096 constraints)
echo "[4/8] Downloading Powers of Tau (pot12)..."
PTAU_URL="https://storage.googleapis.com/zkevm/ptau/powersOfTau28_hez_final_12.ptau"
if [ ! -f "$BUILD_DIR/pot12.ptau" ]; then
  curl -L -o "$BUILD_DIR/pot12.ptau" "$PTAU_URL"
else
  echo "    Using cached pot12.ptau"
fi

# 5. Generate zkey (proving key) via Groth16 setup
echo "[5/8] Generating proving key (groth16 setup)..."
npx snarkjs groth16 setup \
  "$BUILD_DIR/biometric_commitment.r1cs" \
  "$BUILD_DIR/pot12.ptau" \
  "$BUILD_DIR/circuit_0000.zkey"

# 6. Contribute to ceremony (single contribution for development)
echo "[6/8] Contributing to ceremony..."
echo "zauth-dev-contribution-$(date +%s)" | npx snarkjs zkey contribute \
  "$BUILD_DIR/circuit_0000.zkey" \
  "$BUILD_DIR/circuit_final.zkey" \
  --name="zauth-dev"

# 7. Export verification key
echo "[7/8] Exporting verification key..."
npx snarkjs zkey export verificationkey \
  "$BUILD_DIR/circuit_final.zkey" \
  "$ZK_DIR/verification_key.json"

# 8. Copy artifacts to their final locations
echo "[8/8] Copying artifacts..."
cp "$BUILD_DIR/biometric_commitment_js/biometric_commitment.wasm" "$ZK_DIR/biometric_commitment.wasm"
cp "$BUILD_DIR/circuit_final.zkey" "$ZK_DIR/circuit_final.zkey"

echo ""
echo "=== Setup complete ==="
echo "Artifacts:"
ls -lh "$ZK_DIR/verification_key.json" "$ZK_DIR/biometric_commitment.wasm" "$ZK_DIR/circuit_final.zkey"
