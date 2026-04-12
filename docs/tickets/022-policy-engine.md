# [TICKET-022] Policy Engine

## Status
`pending`

## Dependencies
- Requires: #019 ✅

## Description
Implement the policy engine — the module that classifies action risk levels and determines when approval is required. This is central to BridgeOS's trust model: it ensures sensitive actions are surfaced before they happen, not after. The engine evaluates proposed actions against a risk taxonomy and permission boundaries, emitting approval requests when thresholds are met.

## Acceptance Criteria
- [ ] Actions are classified into three risk levels per PRD § 13: Low, Medium, High
- [ ] Low-risk actions (answer questions, open apps, search files, read logs) proceed without approval
- [ ] Medium-risk actions (move files, rename files, edit project files, run guarded commands) trigger a lightweight plan recap
- [ ] High-risk actions (package installation, sudo, system settings, mass deletion, external sends) require explicit approval
- [ ] The engine accepts an action description and returns: risk level, approval required (bool), explanation of why approval is needed, list of affected resources
- [ ] Permission boundaries enforce MVP constraints: approved folder scopes, no unrestricted filesystem access, no autonomous root execution
- [ ] Approved folder list is configurable
- [ ] The engine emits `approval_requested` events via IPC when approval is needed

## Implementation Notes
- Implement in `crates/policy_engine`
- Risk classification can start as a rule-based system matching action types to risk levels
- Action types for MVP: `read_file`, `move_file`, `rename_file`, `delete_file`, `create_directory`, `run_command`, `install_package`, `system_setting`
- Folder scope enforcement: maintain a configurable allowlist of directories the system can operate in
- Command allowlist: a small set of safe commands for MVP (e.g., `ls`, `cat`, `git status`, `npm run`, `cargo build`). The specific list is an open question from the PRD — use a conservative default.
- The "explanation of why approval is needed" should be human-readable (per UX_DESIGN.md § 11: "Never show a generic approval prompt without explanation")
- Integration: the orchestration runtime (ticket #024) will call the policy engine before executing each step

## Testing
- Unit test risk classification: verify low/medium/high classification for each action type
- Test permission boundary enforcement: actions outside approved folders are rejected
- Test command allowlist: commands not on the list require high-risk approval
- Verify approval explanations are human-readable, not generic
- Verify `approval_requested` events contain correct risk level and explanation
