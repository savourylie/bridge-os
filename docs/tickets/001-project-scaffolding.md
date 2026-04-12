# [TICKET-001] Project Scaffolding

## Status
`pending`

## Dependencies
- Requires: None

## Description
Initialize the BridgeOS desktop application using Tauri 2 with a React + TypeScript frontend. This is the foundation ticket that every other ticket depends on. It sets up the build toolchain, dependency management, and basic project structure following the architecture recommended in TECH_STACK.md.

The project uses Tauri 2 as the desktop shell with Rust as the core runtime, React + TypeScript for the presentation layer, Tailwind CSS for styling, shadcn/ui for base components, and Framer Motion for animations. Development happens on macOS with Linux as the deployment target.

## Acceptance Criteria
- [ ] Tauri 2 project initializes and builds successfully on macOS
- [ ] React + TypeScript frontend renders a basic "BridgeOS" placeholder in the Tauri window
- [ ] Tailwind CSS is configured and a utility class renders correctly
- [ ] shadcn/ui is installed and at least one component (e.g., Button) imports without error
- [ ] Framer Motion is installed and a basic animation renders
- [ ] The Tauri window opens at a reasonable default size (e.g., 800x600)
- [ ] `npm run dev` (or equivalent) starts the dev server with hot reload

## Implementation Notes
- Initialize with `npm create tauri-app@latest` using the React + TypeScript template
- Install Tailwind CSS v4 and configure with the project
- Initialize shadcn/ui with the default configuration
- Install Framer Motion
- Set up the recommended directory structure from TECH_STACK.md:
  ```
  bridgeos/
  ├── apps/desktop/ui/       (React frontend)
  ├── apps/desktop/tauri/    (Tauri config + Rust entry)
  ├── apps/desktop/state/    (frontend state management)
  ├── crates/                (Rust crates — empty stubs for now)
  └── docs/                  (existing docs)
  ```
- Alternatively, if the monorepo structure adds too much complexity for bootstrapping, a simpler flat Tauri 2 project structure is acceptable as long as the separation between UI and Rust is clean
- Configure `tauri.conf.json` with app name "BridgeOS", window title, and reasonable defaults

## Testing
- Run `npm run dev` — the Tauri window opens with the placeholder UI
- Run `npm run build` — the project compiles without errors
- Verify Tailwind classes render (e.g., a colored background)
- Verify a shadcn/ui Button component renders
- Verify a Framer Motion `motion.div` animates on mount
