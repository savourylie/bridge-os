# [TICKET-026] Folder Organization Flow

## Status
`done`

## Dependencies
- Requires: #024 ✅, #025 ✅

## Description
Implement the end-to-end folder organization task flow — the first of BridgeOS's four MVP task categories. This flow demonstrates the complete interaction loop: the user asks to organize a folder, BridgeOS interprets the intent, generates a plan, executes file operations through the mock adapter, and presents results with undo capability. This is PRD scenario 10.1 and UX_DESIGN.md Flow 1.

## Acceptance Criteria
- [x] User can express intent to organize a folder via transcript input (e.g., "Organize my Downloads folder by file type")
- [x] IntentBoard correctly extracts: goal (organize), scope (target folder), constraints (exclusions, no deletion)
- [x] DraftPlan generates steps: scan folder → identify files by criteria → create subfolders → move matching files → show results
- [x] Policy engine classifies file moves as medium-risk, showing a lightweight plan recap
- [x] Timeline executes steps sequentially through `MockFileSystemAdapter`
- [x] Each step updates its status (pending → running → completed) with correct impact summaries
- [x] CompletionSummary shows: folders created, files moved, files deleted (should be 0 by default), no network activity
- [x] Undo is supported: clicking "Undo" in CompletionSummary reverses the file operations (via mock adapter operation history)
- [x] File type exclusions work: if user says "do not touch PDFs", PDF files remain unmoved
- [x] The flow completes end-to-end without manual state management — all driven by the orchestration runtime

## Implementation Notes
- This flow exercises the full stack: conversation → orchestration → policy → mock adapter → UI
- File organization logic: group files by extension into subdirectories (e.g., `Screenshots/`, `Documents/`, `Archives/`)
- The mock adapter should be pre-loaded with the "Downloads folder" fixture data from #025
- Undo implementation: the mock adapter's operation history is reversed in order
- No deletion by default is a hard constraint from PRD § 15.3.F.1 — the plan should never include delete steps unless explicitly requested
- Test with the "Organize Downloads" demo flow from UX_DESIGN.md

## Testing
- Start the app and initiate a folder organization task via the demo interface
- Verify IntentBoard shows correct goal, scope, and constraints
- Verify DraftPlan shows the expected steps with "Execution: Not started"
- Proceed through execution and verify Timeline steps complete
- Verify CompletionSummary shows correct file counts
- Click "Undo" and verify the operation is reversed
- Test with exclusions (e.g., "do not touch PDFs") and verify excluded files remain
