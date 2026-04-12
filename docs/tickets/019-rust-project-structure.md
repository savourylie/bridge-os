# [TICKET-019] Rust Project Structure & Crate Layout

## Status
`done`

## Dependencies
- Requires: #018 ✅

## Description
Set up the Rust crate structure for BridgeOS's backend runtime. This establishes the modular architecture recommended in TECH_STACK.md, with separate crates for conversation runtime, orchestration runtime, policy engine, task models, audit log, and adapter interfaces. The crate layout enforces clean boundaries between the presentation layer, core logic, and platform-specific integrations.

## Acceptance Criteria
- [x] Cargo workspace is configured with the following crates:
  - `crates/conversation_runtime` — wake state, transcript, turn-taking
  - `crates/orchestration_runtime` — intent, planning, task execution
  - `crates/policy_engine` — risk classification, permissions, approval triggers
  - `crates/task_models` — shared task, step, intent, plan types
  - `crates/audit_log` — event logging for task traces
  - `crates/adapters` — trait definitions for platform adapters
  - `crates/mock_adapters` — mock implementations for macOS development
- [x] Each crate compiles independently with `cargo build`
- [x] `crates/task_models` defines shared types used across other crates (Intent, Plan, Task, Step, etc.)
- [x] `crates/adapters` defines trait interfaces: `FileSystemAdapter`, `VoiceAdapter`, `PrivilegeAdapter`, `PackageManagerAdapter`, `DesktopAdapter`
- [x] The Tauri app's `src-tauri` references the workspace crates
- [x] `cargo test` runs across all crates without errors

## Implementation Notes
- Use a Cargo workspace at the project root with `members = ["crates/*", "apps/desktop/src-tauri"]`
- Start each crate with minimal scaffolding — pub module with basic types and empty trait definitions
- `task_models` is the foundation crate — other crates depend on it for shared types
- `adapters` crate defines only trait interfaces, no implementations
- `mock_adapters` implements the adapter traits with in-memory/simulated behavior
- Follow TECH_STACK.md § Adapter Strategy: explicit adapters for Linux-native behavior, mock adapters for macOS dev
- Suggested module structure per TECH_STACK.md § Suggested File/Module Boundaries

## Testing
- `cargo build --workspace` compiles without errors
- `cargo test --workspace` passes
- Each crate's basic types and traits are importable from dependent crates
- The Tauri app builds with the workspace crates linked
