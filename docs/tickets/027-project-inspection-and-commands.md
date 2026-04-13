# [TICKET-027] Project Inspection & Guarded Commands Flow

## Status
`pending`

## Dependencies
- Requires: #024 ✅, #025 ✅

## Description
Implement two related MVP task categories: project inspection and guarded developer commands. Project inspection allows users to ask BridgeOS to scan a project directory, summarize its contents, and answer questions. Guarded commands allow a small allowlisted set of local commands to run with visible intent and results. Both categories share the pattern of read-only or low-risk operations with clear output display.

## Acceptance Criteria
- [ ] Project inspection: user can ask to inspect a project folder (e.g., "What's in my memfuse project?")
- [ ] IntentBoard shows goal (inspect/summarize), scope (target directory)
- [ ] System scans the directory via `MockFileSystemAdapter` and generates a summary (file count, file types, directory structure)
- [ ] Summary is presented in the CompletionSummary with structured output
- [ ] Guarded commands: user can request to run an allowlisted command (e.g., "Run git status in my project")
- [ ] Policy engine validates the command is on the allowlist — allowlisted commands proceed as low-risk
- [ ] Commands not on the allowlist are flagged as high-risk and require explicit approval
- [ ] Command intent and the exact command to be executed are shown in the DraftPlan
- [ ] Command output (stdout/stderr from mock) is displayed in the Timeline step card
- [ ] Default allowlist includes: `ls`, `cat`, `git status`, `git log`, `git diff`, `npm run`, `cargo build`, `cargo test`

## Implementation Notes
- Project inspection is essentially a specialized read-only scan — use `MockFileSystemAdapter::list_directory()` recursively
- For guarded commands, the mock adapter simulates command execution with pre-configured outputs
- The command allowlist should be configurable (stored in a config file or the policy engine)
- Commands outside the allowlist require high-risk approval per PRD § 13.3 — even in mock mode, this flow should be demonstrated
- The two task categories share enough infrastructure that combining them in one ticket is efficient — they both use the same adapter patterns and policy checks
- Command output should use the Code typography (JetBrains Mono 13px) when displayed

## Testing
- Test project inspection: initiate "inspect ~/projects/memfuse" → verify directory summary appears
- Test allowlisted command: "run git status" → verify command executes as low-risk
- Test non-allowlisted command: "run rm -rf /" → verify high-risk approval is required
- Verify command output displays in monospace within the timeline step
- Verify the policy engine correctly differentiates allowlisted vs. non-allowlisted commands
