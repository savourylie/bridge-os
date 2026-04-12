// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import App from "../src/App"
import {
  ORGANIZE_DOWNLOADS_APPROVAL_INDEX,
  ORGANIZE_DOWNLOADS_APPROVE_SEQUENCE,
  ORGANIZE_DOWNLOADS_DENY_SEQUENCE,
  ORGANIZE_DOWNLOADS_PRE_APPROVAL_SEQUENCE,
  getOrganizeDownloadsSequence,
} from "../src/demo/organize-downloads"
import DemoPage from "../src/pages/Demo"
import { createBridgeStore } from "../src/state"

function renderDemo() {
  const store = createBridgeStore()

  render(
    <MemoryRouter>
      <DemoPage store={store} />
    </MemoryRouter>,
  )

  return { store }
}

function advance(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms)
  })
}

function advanceTimedEvents(
  sequence: { delayMs: number }[],
  fromIndex: number,
  toIndex: number,
) {
  for (let index = fromIndex; index <= toIndex; index += 1) {
    advance(sequence[index]!.delayMs)
  }
}

describe("DemoPage", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it("mounts at /demo without breaking the existing home route", () => {
    const demoRoute = render(
      <MemoryRouter initialEntries={["/demo"]}>
        <App />
      </MemoryRouter>,
    )

    expect(
      screen.getByRole("heading", { name: /BridgeOS Interactive Demo/i }),
    ).not.toBeNull()

    demoRoute.unmount()

    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>,
    )

    expect(
      screen.getByRole("link", { name: /View Interactive Demo/i }),
    ).not.toBeNull()
  })

  it("walks the status capsule through idle, listening, understanding, planning, executing, and completed", () => {
    renderDemo()

    expect(
      screen.getByRole("button", { name: /^BridgeOS$/i }),
    ).not.toBeNull()

    let cursor = 0

    advanceTimedEvents(ORGANIZE_DOWNLOADS_PRE_APPROVAL_SEQUENCE, cursor, 1)
    cursor = 2
    expect(
      screen.getByRole("button", { name: /Listening/i }),
    ).not.toBeNull()

    advanceTimedEvents(ORGANIZE_DOWNLOADS_PRE_APPROVAL_SEQUENCE, cursor, 8)
    cursor = 9
    expect(
      screen.getByRole("button", { name: /Understanding/i }),
    ).not.toBeNull()

    advanceTimedEvents(ORGANIZE_DOWNLOADS_PRE_APPROVAL_SEQUENCE, cursor, 20)
    cursor = 21
    expect(
      screen.getByRole("button", { name: /Planning/i }),
    ).not.toBeNull()

    advanceTimedEvents(ORGANIZE_DOWNLOADS_PRE_APPROVAL_SEQUENCE, cursor, 25)
    cursor = 26
    expect(
      screen.getByRole("button", { name: /^Running 1 of 5$/i }),
    ).not.toBeNull()

    advanceTimedEvents(
      ORGANIZE_DOWNLOADS_PRE_APPROVAL_SEQUENCE,
      cursor,
      ORGANIZE_DOWNLOADS_PRE_APPROVAL_SEQUENCE.length - 1,
    )
    expect(screen.getByText(/Approval Required/i)).not.toBeNull()
    expect(screen.queryByText(/Downloads Organized/i)).toBeNull()

    fireEvent.click(screen.getByRole("button", { name: /^Approve$/i }))
    advanceTimedEvents(
      ORGANIZE_DOWNLOADS_APPROVE_SEQUENCE,
      0,
      ORGANIZE_DOWNLOADS_APPROVE_SEQUENCE.length - 1,
    )

    expect(
      screen.getByRole("button", { name: /^Complete$/i }),
    ).not.toBeNull()
    expect(screen.getByText(/Downloads Organized/i)).not.toBeNull()
  })

  it("reveals transcript and intent fields incrementally before execution begins", () => {
    renderDemo()

    let cursor = 0

    advanceTimedEvents(ORGANIZE_DOWNLOADS_PRE_APPROVAL_SEQUENCE, cursor, 2)
    cursor = 3
    expect(screen.getByText(/^Computer,$/i)).not.toBeNull()
    expect(screen.queryByText(/^Computer, organize$/i)).toBeNull()
    expect(
      screen.queryByText(/Organize screenshots in ~\/Downloads by month/i),
    ).toBeNull()

    advanceTimedEvents(ORGANIZE_DOWNLOADS_PRE_APPROVAL_SEQUENCE, cursor, 3)
    cursor = 4
    expect(screen.getByText(/^Computer, organize$/i)).not.toBeNull()
    expect(screen.queryByText(/^Computer, organize my Downloads\.$/i)).toBeNull()

    advanceTimedEvents(ORGANIZE_DOWNLOADS_PRE_APPROVAL_SEQUENCE, cursor, 9)
    cursor = 10
    expect(
      screen.getByText(/Organize screenshots in ~\/Downloads by month/i),
    ).not.toBeNull()
    expect(screen.queryByText(/~\/Downloads only/i)).toBeNull()
    expect(
      screen.queryByText(/Keep original filenames and preserve rollback metadata/i),
    ).toBeNull()

    advanceTimedEvents(ORGANIZE_DOWNLOADS_PRE_APPROVAL_SEQUENCE, cursor, 10)
    cursor = 11
    expect(screen.getByText(/~\/Downloads only/i)).not.toBeNull()
    expect(
      screen.queryByText(/Keep original filenames and preserve rollback metadata/i),
    ).toBeNull()

    advanceTimedEvents(ORGANIZE_DOWNLOADS_PRE_APPROVAL_SEQUENCE, cursor, 11)
    cursor = 12
    expect(
      screen.getByText(/Keep original filenames and preserve rollback metadata/i),
    ).not.toBeNull()
    expect(
      screen.queryByText(/Ignore PDFs, zip files, hidden files, and installers/i),
    ).toBeNull()

    advanceTimedEvents(ORGANIZE_DOWNLOADS_PRE_APPROVAL_SEQUENCE, cursor, 20)
    expect(
      screen.getByText(/Ignore PDFs, zip files, hidden files, and installers/i),
    ).not.toBeNull()
    expect(
      screen.getByText(/Verify the new layout and present a completion summary/i),
    ).not.toBeNull()
    expect(screen.getByText(/^Not started$/i)).not.toBeNull()
    expect(
      screen.queryByRole("button", { name: /^Running/i }),
    ).toBeNull()
  })

  it("halts auto-play at approval until the user approves, then completes without runtime errors", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {})
    const { store } = renderDemo()

    advanceTimedEvents(
      ORGANIZE_DOWNLOADS_PRE_APPROVAL_SEQUENCE,
      0,
      ORGANIZE_DOWNLOADS_PRE_APPROVAL_SEQUENCE.length - 1,
    )

    expect(screen.getByText(/Approval Required/i)).not.toBeNull()
    expect(store.getState().approval.state).toBe("requested")
    expect(store.getState().eventHistory).toHaveLength(
      ORGANIZE_DOWNLOADS_PRE_APPROVAL_SEQUENCE.length + 1,
    )
    expect(store.getState().eventHistory[0]?.event.type).toBe("STORE_RESET")
    expect(
      store
        .getState()
        .eventHistory.slice(1)
        .map((entry) => entry.event.type),
    ).toEqual(
      ORGANIZE_DOWNLOADS_PRE_APPROVAL_SEQUENCE.map((entry) => entry.event.type),
    )

    advance(5000)
    expect(screen.getByText(/Approval Required/i)).not.toBeNull()
    expect(screen.queryByText(/Downloads Organized/i)).toBeNull()
    expect(store.getState().eventHistory).toHaveLength(
      ORGANIZE_DOWNLOADS_PRE_APPROVAL_SEQUENCE.length + 1,
    )

    fireEvent.click(screen.getByRole("button", { name: /^Approve$/i }))
    advanceTimedEvents(
      ORGANIZE_DOWNLOADS_APPROVE_SEQUENCE,
      0,
      ORGANIZE_DOWNLOADS_APPROVE_SEQUENCE.length - 1,
    )

    expect(
      screen.getByRole("button", { name: /Complete/i }),
    ).not.toBeNull()
    expect(screen.getByText(/Downloads Organized/i)).not.toBeNull()
    expect(screen.getByText(/Moved: 133 files\./i)).not.toBeNull()
    expect(errorSpy).not.toHaveBeenCalled()
  })

  it("halts auto-play at approval until the user denies, then cancels without showing completion", () => {
    const { store } = renderDemo()

    advanceTimedEvents(
      ORGANIZE_DOWNLOADS_PRE_APPROVAL_SEQUENCE,
      0,
      ORGANIZE_DOWNLOADS_PRE_APPROVAL_SEQUENCE.length - 1,
    )

    advance(5000)
    expect(store.getState().approval.state).toBe("requested")

    fireEvent.click(screen.getByRole("button", { name: /^Deny$/i }))
    advanceTimedEvents(
      ORGANIZE_DOWNLOADS_DENY_SEQUENCE,
      0,
      ORGANIZE_DOWNLOADS_DENY_SEQUENCE.length - 1,
    )

    expect(
      screen.getByRole("button", { name: /Cancelled/i }),
    ).not.toBeNull()
    expect(screen.queryByText(/Downloads Organized/i)).toBeNull()
    expect(store.getState().approval.state).toBe("denied")
  })

  it("supports deterministic manual branching and rewind around the approval checkpoint", () => {
    renderDemo()

    fireEvent.click(screen.getByRole("button", { name: /Manual mode/i }))
    expect(screen.getByText(/Manual mode ready/i)).not.toBeNull()

    const nextButton = screen.getByRole("button", {
      name: /Next step/i,
    }) as HTMLButtonElement
    const previousButton = screen.getByRole("button", {
      name: /Previous step/i,
    }) as HTMLButtonElement

    for (let index = 0; index < ORGANIZE_DOWNLOADS_APPROVAL_INDEX; index += 1) {
      fireEvent.click(nextButton)
    }

    expect(screen.getByText(/Approval Required/i)).not.toBeNull()
    expect(screen.getByText(/Branch: pending/i)).not.toBeNull()
    expect(nextButton.disabled).toBe(true)
    expect(previousButton.disabled).toBe(false)

    fireEvent.click(screen.getByRole("button", { name: /^Approve$/i }))
    expect(screen.getByText(/Branch: approved/i)).not.toBeNull()
    expect(nextButton.disabled).toBe(false)

    fireEvent.click(previousButton)
    expect(screen.getByText(/Branch: pending/i)).not.toBeNull()
    expect(screen.getByText(/Approval Required/i)).not.toBeNull()
    expect(nextButton.disabled).toBe(true)

    fireEvent.click(screen.getByRole("button", { name: /^Deny$/i }))
    expect(screen.getByText(/Branch: denied/i)).not.toBeNull()
    expect(nextButton.disabled).toBe(false)

    const deniedSequence = getOrganizeDownloadsSequence("denied")
    const remainingEvents =
      deniedSequence.length - (ORGANIZE_DOWNLOADS_APPROVAL_INDEX + 1)

    for (let index = 0; index < remainingEvents; index += 1) {
      fireEvent.click(nextButton)
    }

    expect(
      screen.getByRole("button", { name: /Cancelled/i }),
    ).not.toBeNull()
  })

  it("cancels pending auto-play timers when switching modes and keeps manual reset deterministic", () => {
    renderDemo()

    advance(720)
    expect(screen.getByText(/^Computer, organize$/i)).not.toBeNull()

    fireEvent.click(screen.getByRole("button", { name: /Manual mode/i }))
    expect(screen.getByRole("button", { name: /^BridgeOS$/i })).not.toBeNull()
    expect(screen.queryByText(/^Computer, organize$/i)).toBeNull()
    expect(screen.getByText(/Manual mode ready/i)).not.toBeNull()

    advance(10000)
    expect(screen.getByRole("button", { name: /^BridgeOS$/i })).not.toBeNull()
    expect(screen.queryByText(/Approval Required/i)).toBeNull()

    fireEvent.click(screen.getByRole("button", { name: /Restart demo/i }))
    expect(screen.getByText(/Manual mode reset to idle/i)).not.toBeNull()

    const nextButton = screen.getByRole("button", {
      name: /Next step/i,
    }) as HTMLButtonElement
    fireEvent.click(nextButton)

    expect(
      screen.getByRole("button", { name: /Listening/i }),
    ).not.toBeNull()
  })
})
