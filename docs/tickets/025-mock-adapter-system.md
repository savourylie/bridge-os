# [TICKET-025] Mock Adapter System

## Status
`blocked`

## Dependencies
- Requires: #023

## Description
Implement mock adapters for all platform-specific interfaces, enabling full BridgeOS development and testing on macOS without real Linux services. Each mock adapter implements the trait interface defined in `crates/adapters` with in-memory, simulated behavior. These mocks power the macOS development experience and serve as the backend for the demo flows.

## Acceptance Criteria
- [ ] `MockFileSystemAdapter` implements `FileSystemAdapter`:
  - Simulates file listing, moving, renaming, creating directories
  - Maintains an in-memory filesystem state
  - Tracks all operations for undo/rollback support
- [ ] `MockVoiceAdapter` implements `VoiceAdapter`:
  - Provides simulated transcript streams (configurable text sequences)
  - Simulates wake-word detection
  - Supports interrupt and mute signals
- [ ] `MockPrivilegeAdapter` implements `PrivilegeAdapter`:
  - Simulates privilege escalation requests
  - Returns configurable success/failure for elevation
  - Does not require actual sudo
- [ ] `MockPackageManagerAdapter` implements `PackageManagerAdapter`:
  - Simulates package existence checks
  - Simulates install/remove operations with configurable latency
  - Returns mock package info
- [ ] `MockDesktopAdapter` implements `DesktopAdapter`:
  - Simulates app launching
  - Returns mock active window info
- [ ] All mock adapters are configurable via constructor params (success/failure modes, latency, data)
- [ ] Adapter selection is runtime-configurable (mock vs. real via feature flags or config)

## Implementation Notes
- Implement in `crates/mock_adapters`
- Each mock should implement the exact trait from `crates/adapters` — ensure 1:1 interface match
- The `MockFileSystemAdapter` should use a `HashMap<PathBuf, Vec<FileEntry>>` as the in-memory filesystem
- Include pre-built fixture data sets (e.g., a "Downloads folder" with 50 mixed files for the folder organization demo)
- Operation history tracking in mocks enables the rollback/undo feature testing
- Use Rust feature flags to select between mock and real adapter implementations at compile time
- Per TECH_STACK.md § Adapter Strategy: mock adapters for macOS, real Linux adapters for Ubuntu

## Testing
- Unit test each mock adapter's core operations
- Verify `MockFileSystemAdapter` maintains consistent in-memory state across operations
- Verify operation history enables undo (reverse the last N operations)
- Verify mock adapters satisfy the trait interface (compile-time check via trait bounds)
- Test configurable failure modes (e.g., mock that always fails privilege escalation)
