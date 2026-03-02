pragma circom 2.1.9;

include "circomlib/circuits/poseidon.circom";

template BiometricProof() {
    // Private input: biometric hash truncated to 253 bits (fits in BN128 scalar field)
    signal input preimage;

    // Public input: challenge from the server (also truncated to 253 bits)
    signal input challenge;

    // Public output: Poseidon(preimage) -- stored at enrollment, checked at authentication
    signal output commitment;

    // Public output: Poseidon(preimage, challenge) -- proves freshness / challenge binding
    signal output binding;

    // Compute commitment = Poseidon(preimage)
    component h1 = Poseidon(1);
    h1.inputs[0] <== preimage;
    commitment <== h1.out;

    // Compute binding = Poseidon(preimage, challenge)
    component h2 = Poseidon(2);
    h2.inputs[0] <== preimage;
    h2.inputs[1] <== challenge;
    binding <== h2.out;
}

component main {public [challenge]} = BiometricProof();
