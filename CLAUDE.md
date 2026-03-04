# CLAUDE.md

## Project

- TypeScript CLI compiled with Bun
- Manages Homebrew packages across multiple machines
- Via a single `hops.yml` config

## Build & Run

- Use the `Makefile` for building
- Use `HOPS_CONFIG=./hops.example.yml` to test with the example config
- Linting/formatting via Biome: `bun biome:check` / `bun biome:fix`.

## Conventions

- `neverthrow` Result types for all fallible operations
- `@clack/prompts` for all user-facing output
- `picocolors` for text styling
- `shared` is a reserved machine name, merged with the target machine during generation
