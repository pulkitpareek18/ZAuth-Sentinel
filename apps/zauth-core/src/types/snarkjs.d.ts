declare module "snarkjs" {
  export namespace groth16 {
    function verify(
      vk: Record<string, unknown>,
      publicSignals: string[],
      proof: Record<string, unknown>
    ): Promise<boolean>;

    function fullProve(
      input: Record<string, string>,
      wasmPath: string,
      zkeyPath: string
    ): Promise<{
      proof: Record<string, unknown>;
      publicSignals: string[];
    }>;
  }
}
