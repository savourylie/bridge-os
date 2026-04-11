# TECH_STACK.md

# BridgeOS Technical Stack

## Overview

BridgeOS is a Star Trek–inspired AI interface for Linux built around a voice-native interaction model, visible intent formation, and rigorous execution control.

The recommended development strategy is:

- **develop on macOS (Apple Silicon) as the primary host machine**
- **validate Linux-specific behavior in a Linux VM early and continuously**
- **keep the architecture split between platform-agnostic core logic and Linux-specific adapters**

This approach allows rapid progress on UI, orchestration, and product interaction design without waiting for a dedicated Linux machine, while still respecting the Linux-native requirements of the product.

---

## Recommended Core Stack

### Frontend
- **React**
- **TypeScript**
- **Tailwind CSS**
- **shadcn/ui**
- **Framer Motion**

### Desktop App Shell
- **Tauri 2**

### Core Runtime
- **Rust**

### Local State / Persistence
- **SQLite** or lightweight local storage
- **JSON event logs** for task traces and execution records

### Linux Integration Layer
- **D-Bus**
- **Polkit**
- **PipeWire**
- **systemd user services**
- **guarded shell command bridge**

### Primary Linux Target
- **Ubuntu 24.04 LTS**

---

## Recommended Development Model

## Host Development Machine
**macOS on Apple Silicon**

Use the Mac as the main development machine for:

- frontend implementation
- Tauri shell development
- Rust orchestration runtime
- UX iteration
- state machine implementation
- transcript and voice UI prototyping
- intent modeling
- task execution trace UI
- approval flow UI
- mock tools and simulated task runs

## Linux Validation Environment
**Ubuntu 24.04 ARM64 in a VM**

Use a Linux VM for:

- D-Bus integration
- Polkit flows
- PipeWire behavior
- systemd user service setup
- Linux-specific file operations
- desktop integration
- privilege escalation testing
- packaging validation
- background service behavior

---

## Why This Stack

## 1. Fast UI iteration
BridgeOS depends heavily on interaction quality. The highest-risk product questions are currently in:

- VoiceBar behavior
- IntentBoard clarity
- DraftPlan trustworthiness
- Action Trace readability
- Approval flow confidence
- interruption / pause / stop behavior

These are much faster to build and refine with React + TypeScript than with native Linux UI toolkits.

## 2. Clear separation between UI and system behavior
Tauri + Rust encourages a strong separation between:

- presentation logic
- orchestration logic
- system-level integrations

This is a good fit for BridgeOS because the product needs both conversational polish and strict system boundaries.

## 3. Linux-specific capabilities remain isolated
BridgeOS ultimately depends on Linux-native primitives such as:

- D-Bus for desktop and system communication
- Polkit for controlled privilege escalation
- PipeWire for audio behavior
- systemd user services for background runtime behavior

These should be developed behind explicit Linux adapters rather than mixed directly into the UI layer.

## 4. macOS development remains practical
Because the architecture is layered, the majority of the product can be built and tested on macOS before Linux-specific wiring is finalized.

---

## Architecture Recommendation

BridgeOS should be split into four major layers.

## 1. Presentation Layer
**Tech:** React, TypeScript, Tailwind, shadcn/ui, Framer Motion

### Responsibilities
- StatusCapsule
- VoiceBar
- IntentBoard
- DraftPlan
- TaskPanel
- Action Trace / Timeline
- ApprovalCard
- TechnicalDetailsDrawer
- CompletionSummary
- RollbackBar

### Notes
This layer should remain mostly platform-agnostic.

---

## 2. Conversation Runtime
**Tech:** Rust service or Rust module with well-defined state management

### Responsibilities
- wake-word state
- transcript lifecycle
- turn-taking state
- user-holding-turn detection
- interruption logic
- spoken response scheduling
- dialogue manager state

### Notes
This should not be tightly coupled to the UI tree.

---

## 3. Agent / Orchestration Runtime
**Tech:** Rust

### Responsibilities
- intent parsing
- intent stabilization
- plan generation
- policy checks
- task state machine
- approval model
- tool routing
- audit event generation
- rollback / undo logic where supported

### Notes
This layer is the operational core of BridgeOS.

---

## 4. Linux Integration Layer
**Tech:** Rust + Linux system interfaces

### Responsibilities
- filesystem operations
- app launching
- local command execution
- D-Bus communication
- Polkit integration
- PipeWire integration
- systemd user service integration
- desktop notifications
- controlled elevation flows

### Notes
This layer should be implemented behind clean interfaces so it can be mocked during macOS development.

---

## Platform Strategy

## What can be developed on macOS
The following can be built confidently on a Mac:

- UI components
- state machines
- action trace models
- event-driven architecture
- conversation manager logic
- intent representation
- draft planning logic
- approval logic
- fake execution events
- simulated task timelines
- mock transcript flows
- mock voice interaction loop

## What must be validated on Linux
The following should be validated in Linux early, not at the end:

- wake behavior in a Linux desktop environment
- microphone handling assumptions
- D-Bus communication
- Polkit elevation UX
- PipeWire audio assumptions
- background companion service behavior
- app launching behavior
- Linux packaging
- permission edge cases
- filesystem safety assumptions

---

## Adapter Strategy

BridgeOS should use explicit adapters for Linux-native behavior.

### Recommended rule
From the beginning, treat Linux-specific features as replaceable adapters rather than direct app logic.

### Suggested examples
- `audio_adapter`
- `voice_runtime_adapter`
- `filesystem_adapter`
- `privilege_adapter`
- `desktop_ipc_adapter`
- `package_manager_adapter`
- `background_service_adapter`

### Implementation model
- **mock adapters** for macOS and rapid UI development
- **real Linux adapters** for Ubuntu validation

This keeps the product moving even when Linux-specific features are still incomplete.

---

## Recommended Linux VM Setup

## Host
- Apple Silicon Mac

## VM
- Ubuntu 24.04 ARM64

## Recommended VM tool
- **UTM**

### Why
- works well on Apple Silicon
- practical for ARM64 Linux development
- sufficient for early desktop validation
- avoids blocking on dedicated Linux hardware

### Recommended usage
Use the VM for:
- Linux integration milestones
- smoke testing after major feature changes
- validating system permission flows
- confirming packaging behavior
- desktop-level runtime testing

---

## Recommended MVP Stack

For the MVP, the stack should be intentionally narrow.

### UI
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- Framer Motion

### Desktop Shell
- Tauri 2

### Runtime
- Rust

### Persistence
- SQLite or local JSON-backed state

### Linux Services
- D-Bus
- Polkit
- PipeWire
- systemd user services

### Supported MVP Task Domains
- approved-folder file operations
- project inspection
- guarded local commands
- explicit package installation flow

---

## Why Not Start with GTK or Qt

GTK / Libadwaita and Qt / Kirigami are valid Linux-native paths, but they are not the best starting point for BridgeOS.

### Reason 1: Interaction model risk is higher than native UI risk
The biggest unknowns in BridgeOS are:
- voice interaction quality
- turn-taking behavior
- visible intent UX
- approval trust model
- action trace clarity

These are product risks, not toolkit risks.

### Reason 2: Learning cost is too high relative to current needs
Starting with native Linux toolkits would slow down iteration on the core product experience.

### Reason 3: The first milestone is proving the model, not maximizing native feel
BridgeOS should first prove:
- people like talking to it
- it does not act too early
- it stays inspectable
- users trust the execution model

A more Linux-native UI strategy can be considered later if product validation justifies it.

---

## Recommended Internal Process Model

BridgeOS should conceptually separate:

### UI Process
Owns:
- rendering
- interaction surfaces
- presentation state
- panel visibility
- local view updates

### Core Runtime Process
Owns:
- conversation state
- intent state
- task state
- orchestration
- audit events

### Linux Companion / Integration Process
Owns:
- system-level integrations
- long-running Linux services
- privileged operations
- desktop IPC
- package operations
- audio plumbing when needed

This does not have to be fully physically separate on day one, but the architecture should leave room for it.

---

## Suggested File / Module Boundaries

A possible codebase structure:

```text
bridgeos/
├─ apps/
│  └─ desktop/
│     ├─ ui/
│     ├─ tauri/
│     └─ state/
├─ crates/
│  ├─ conversation_runtime/
│  ├─ orchestration_runtime/
│  ├─ policy_engine/
│  ├─ task_models/
│  ├─ audit_log/
│  ├─ linux_adapters/
│  ├─ mock_adapters/
│  └─ shared_types/
└─ docs/
   ├─ PRD.md
   ├─ UX_DESIGN.md
   └─ TECH_STACK.md
```

This is illustrative rather than mandatory, but the separation is important.

---

## Suggested Data Model Principles

BridgeOS should use event-driven models where possible.

### Why
Because the UI depends on a highly legible operational sequence:
- transcript updated
- intent updated
- plan drafted
- approval requested
- execution started
- step completed
- task paused
- task completed
- rollback available

This makes it easier to:
- power the Action Trace UI
- debug orchestration issues
- support replay and inspection
- keep UI and runtime synchronized

---

## Key Technical Priorities

## Phase 1: Product Interaction Prototype
Build with mock adapters first.

### Focus
- StatusCapsule
- VoiceBar
- IntentBoard
- DraftPlan
- TaskPanel
- Timeline
- ApprovalCard
- CompletionSummary

### Goal
Prove the BridgeOS interaction loop.

---

## Phase 2: Real Voice Pipeline
Integrate actual speech behavior.

### Focus
- wake trigger
- live transcript
- interruption
- TTS
- turn-holding detection

### Goal
Make the product feel conversational.

---

## Phase 3: Real Bounded Linux Actions
Connect to real Linux task execution.

### Focus
- approved-folder file actions
- project inspection
- guarded commands
- basic desktop integration

### Goal
Make the system genuinely useful for bounded work.

---

## Phase 4: Controlled Privileged Flow
Add explicit elevation workflows.

### Focus
- approval flow
- package install flow
- privilege boundary UI
- controlled authorization model

### Goal
Validate the trust model for sensitive actions.

---

## Major Risks

### 1. Over-coupling UI and system logic
If orchestration is embedded directly into the desktop frontend, BridgeOS will become hard to evolve.

### 2. Delaying Linux validation too long
If Linux-specific behavior is only tested at the end, core assumptions may fail late.

### 3. Over-expanding task types
The MVP should remain narrow. Breadth can destroy clarity.

### 4. Premature privilege complexity
Root or package-management flows should come after the core interaction model is already working.

### 5. Treating macOS prototype success as Linux proof
macOS is a good host for development, but it is not the truth environment for BridgeOS.

---

## Recommended Final Stack Decision

If making a concrete decision now, use the following:

### Frontend
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- Framer Motion

### Desktop App
- Tauri 2

### Core Runtime
- Rust

### Persistence
- SQLite
- JSON event logs

### Linux Runtime Integration
- D-Bus
- Polkit
- PipeWire
- systemd user services

### Primary Development Setup
- Apple Silicon Mac as host
- Ubuntu 24.04 ARM64 in UTM as Linux validation VM

### MVP Scope Alignment
- approved-folder file operations
- project inspection
- guarded local commands
- explicit package installation flow

---

## Final Recommendation

BridgeOS should begin as a **cross-platform-developed, Linux-targeted desktop control layer**.

Build the interaction model, orchestration model, and UI on macOS without delay.  
Validate Linux-native behavior continuously in a VM.  
Keep Linux-specific functionality behind clean adapters from day one.  
Optimize for trust, inspectability, and bounded usefulness before expanding system reach.

That is the most practical and least fragile path for early BridgeOS development.
