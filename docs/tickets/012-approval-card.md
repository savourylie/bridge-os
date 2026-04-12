# [TICKET-012] ApprovalCard Component

## Status
`done`

## Dependencies
- Requires: #010 ✅

## Description
Build the ApprovalCard — a clear, serious approval gate that interrupts the normal timeline flow for sensitive actions. This "monolith" component uses a deeper surface, thicker border, and amber accent to visually break the regular step card rhythm, signaling that user attention and explicit confirmation are required before proceeding. The ApprovalCard must explain what the system wants to do, why approval is needed, and what the impact will be.

## Acceptance Criteria
- [x] ApprovalCard uses deep surface `#dfe4e8`, `2px solid #cdd3da` border, 8px radius, 24px padding
- [x] 3px left border in amber `#cc7a00` (attention stripe)
- [x] Header "Approval Required" in Heading 3 (Inter 16px weight 600, `#1a1d21`)
- [x] Action description in Body typography (Inter 14px weight 400, `#3d4550`)
- [x] "This action will" list showing what the action affects
- [x] "This action will not" list showing what is unaffected (when provided)
- [x] Impact summary in Body Small (Inter 13px weight 400, `#7a8494`)
- [x] Primary "Approve" button: amber `#cc7a00` background, white text, 8px radius, 10px 20px padding
- [x] Ghost "Deny" button: `#7a8494` text, no border, 10px 16px padding
- [x] Approve button hover darkens to `#b36b00`, deny hover darkens text to `#3d4550`
- [x] Focus ring on buttons: `0 0 0 3px rgba(204, 122, 0, 0.35)`
- [x] Command preview shows in monospace (JetBrains Mono 13px) when a command will be executed

## Design Reference
- **Approval Gate**: DESIGN.md § 4 (Cards & Containers > Approval Gate Monolith)
- **Primary Button**: DESIGN.md § 4 (Buttons > Primary)
- **Ghost Button**: DESIGN.md § 4 (Buttons > Tertiary/Ghost)
- **Monospace**: DESIGN.md § 3 (Code — JetBrains Mono 13px for commands)
- **Depth**: DESIGN.md § 6 (Emphasis Level 2)

## Visual Reference
A deeper, cooler panel interrupts the timeline with a bold amber left stripe. "Approval Required" heads the card. Below: "Install ffmpeg via apt" in body text. "This action will: install a new system package, require administrator privileges, use network access." A monospace command preview shows `sudo apt install ffmpeg`. Two buttons at the bottom: a solid amber "Approve" and a ghostly "Deny." The card feels like a deliberate interruption — serious but not alarming.

## Implementation Notes
- The ApprovalCard should be composable within the Timeline (it replaces a regular step card at the approval point)
- The "will/will not" lists should accept arrays of impact descriptions
- Command preview is optional — only shown when a specific command will be executed
- Button layout: approve on the right (primary position), deny on the left
- The amber left border must be visually distinct from regular panel borders — it's 3px vs 1px
- Per UX_DESIGN.md § 11, approval must occur BEFORE any system prompt (e.g., sudo)
- Create at route `/components/approval-card` with mock approval data

## Testing
- Navigate to `/components/approval-card`
- Verify deep surface, thick border, and amber left accent
- Verify "Approval Required" header and action description typography
- Verify "will/will not" lists render correctly
- Verify command preview renders in JetBrains Mono
- Click Approve — verify button hover and active states
- Click Deny — verify ghost button hover state
- Tab through — verify focus rings on both buttons
