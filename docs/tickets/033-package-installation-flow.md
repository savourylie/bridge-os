# [TICKET-033] Package Installation Flow

## Status
`blocked`

## Dependencies
- Requires: #032

## Description
Implement the package installation task flow — the fourth and most sensitive MVP task category. This flow exercises the full approval model: checking whether a package exists, preparing an install plan, requesting explicit user approval (high-risk action requiring sudo), running through a controlled elevation flow, executing the installation, and verifying the result. This is PRD scenario 10.3 and UX_DESIGN.md Flow 2.

The package installation flow is deliberately the last task flow implemented because it depends on the most mature version of the approval UI, policy engine, and privilege adapter.

## Acceptance Criteria
- [ ] User can request package installation via voice (e.g., "Install ffmpeg for this project")
- [ ] System checks whether the package is already installed
- [ ] If already installed, system reports status without proceeding
- [ ] If not installed, DraftPlan shows steps: check → plan → approve → install → verify
- [ ] Policy engine classifies this as high-risk, requiring explicit approval
- [ ] ApprovalCard shows: what will be installed, why approval is needed (root privileges + network access), command preview (`sudo apt install ffmpeg`)
- [ ] "This action will" list: install a new system package, require administrator privileges, use network access
- [ ] "This action will not" list: modify personal documents, send unrelated data
- [ ] User must click "Approve" before any system prompt or elevation occurs
- [ ] After approval, the privilege adapter handles the elevation flow
- [ ] Timeline shows installation progress with step-by-step status
- [ ] Post-install verification step confirms the package is available
- [ ] CompletionSummary shows: package installed, version, no file changes, network used

## Implementation Notes
- On macOS with mock adapters, this flow simulates the full experience without actually installing anything
- The `MockPackageManagerAdapter` should simulate: check → not found → plan → install (with configurable latency) → verify success
- The `MockPrivilegeAdapter` should simulate the elevation prompt (configurable success/failure)
- Command preview must use JetBrains Mono (code typography)
- Per PRD § 13.5 and UX_DESIGN.md § 11: approval happens BEFORE the system-level authorization prompt — the AI should not directly receive raw passwords
- The real implementation (later, on Linux) would use `apt` via D-Bus or Polkit for controlled elevation
- Test both the approve and deny paths through the approval flow

## Testing
- Initiate "install ffmpeg" via the demo interface
- Verify package check step executes
- Verify ApprovalCard appears with correct explanation, impact lists, and command preview
- Click "Approve" — verify execution proceeds through install and verify steps
- Click "Deny" — verify execution is cancelled gracefully
- Verify CompletionSummary shows correct package installation results
- Test with a "package already installed" scenario — verify early exit with status report
