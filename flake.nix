{
  description = "agent-harness development environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
  };

  outputs =
    { nixpkgs, ... }:
    let
      systems = [
        "aarch64-darwin"
        "x86_64-darwin"
        "aarch64-linux"
        "x86_64-linux"
      ];
      forAllSystems = nixpkgs.lib.genAttrs systems;
    in
    {
      devShells = forAllSystems (
        system:
        let
          pkgs = import nixpkgs { inherit system; };
        in
        {
          default = pkgs.mkShell {
            LC_ALL = "C";
            LANG = "C";

            packages = with pkgs; [
              nodejs_24
              bun
              git
              curl
              jq
              nil
              nixfmt
            ];

            shellHook = ''
              export BUN_INSTALL_CACHE_DIR="$PWD/.cache/bun"
              export npm_config_cache="$PWD/.cache/npm"

              echo "agent-harness dev shell"
              echo "node $(node --version)"
              echo "bun $(bun --version)"
            '';
          };
        }
      );

      formatter = forAllSystems (
        system:
        let
          pkgs = import nixpkgs { inherit system; };
        in
        pkgs.nixfmt
      );
    };
}
