// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import App from "../src/App"
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

describe("DemoPage", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    cleanup()
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

  it("auto-play advances through listening, understanding, planning, and pauses at approval", () => {
    renderDemo()

    advance(250)
    expect(
      screen.getByRole("button", { name: /Listening/i }),
    ).not.toBeNull()

    advance(1600)
    expect(
      screen.getByRole("button", { name: /Understanding/i }),
    ).not.toBeNull()

    advance(1400)
    expect(
      screen.getByRole("button", { name: /Planning/i }),
    ).not.toBeNull()

    advance(5000)
    expect(screen.getByText(/Approval Required/i)).not.toBeNull()
    expect(screen.queryByText(/Downloads Organized/i)).toBeNull()
  })

  it("populates transcript, intent, and plan incrementally before execution begins", () => {
    renderDemo()

    advance(2800)
    expect(
      screen.getByText(/Computer, organize my Downloads/i),
    ).not.toBeNull()
    expect(
      screen.getByText(/Organize screenshots in ~\/Downloads by month/i),
    ).not.toBeNull()
    expect(screen.getByText(/~\/Downloads only/i)).not.toBeNull()
    expect(
      screen.getByText(/Keep original filenames and preserve rollback metadata/i),
    ).not.toBeNull()
    expect(
      screen.queryByText(/Ignore PDFs, zip files, hidden files, and installers/i),
    ).toBeNull()

    advance(1700)
    expect(
      screen.getByText(/Ignore PDFs, zip files, hidden files, and installers/i),
    ).not.toBeNull()
    expect(
      screen.getByText(/Verify the new layout and present a completion summary/i),
    ).not.toBeNull()
    expect(screen.getByText(/^Not started$/i)).not.toBeNull()
  })

  it("resumes from the approval checkpoint and completes after Approve", () => {
    renderDemo()

    advance(8000)
    fireEvent.click(screen.getByRole("button", { name: /^Approve$/i }))
    advance(2500)

    expect(
      screen.getByRole("button", { name: /Complete/i }),
    ).not.toBeNull()
    expect(screen.getByText(/Downloads Organized/i)).not.toBeNull()
    expect(screen.getByText(/Moved: 133 files\./i)).not.toBeNull()
  })

  it("cancels the flow after Deny and never shows the completion summary", () => {
    renderDemo()

    advance(8000)
    fireEvent.click(screen.getByRole("button", { name: /^Deny$/i }))
    advance(1000)

    expect(
      screen.getByRole("button", { name: /Cancelled/i }),
    ).not.toBeNull()
    expect(screen.queryByText(/Downloads Organized/i)).toBeNull()
  })

  it("supports deterministic manual stepping and rewind", () => {
    renderDemo()

    fireEvent.click(screen.getByRole("button", { name: /Manual mode/i }))

    fireEvent.click(screen.getByRole("button", { name: /Next step/i }))
    expect(
      screen.getByRole("button", { name: /Listening/i }),
    ).not.toBeNull()

    fireEvent.click(screen.getByRole("button", { name: /Next step/i }))
    expect(
      screen.getByRole("button", { name: /Listening/i }),
    ).not.toBeNull()

    fireEvent.click(screen.getByRole("button", { name: /Next step/i }))
    expect(screen.getByText(/^Computer,$/i)).not.toBeNull()

    fireEvent.click(screen.getByRole("button", { name: /Next step/i }))
    expect(screen.getByText(/^Computer, organize$/i)).not.toBeNull()

    fireEvent.click(screen.getByRole("button", { name: /Previous step/i }))
    expect(screen.getByText(/^Computer,$/i)).not.toBeNull()
    expect(screen.queryByText(/^Computer, organize$/i)).toBeNull()
  })
})
