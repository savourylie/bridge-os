// @vitest-environment jsdom

import { render } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { TaskPanel } from "../src/components/ui/task-panel"

const HEADER = {
  title: "Organize Downloads",
  summary: "Preparing to group screenshots by month and remove clutter.",
}

const META = {
  status: "executing" as const,
  risk: "medium" as const,
  scope: "Downloads only",
}

describe("TaskPanel", () => {
  const scrollTo = vi.fn()

  beforeEach(() => {
    scrollTo.mockReset()
    Object.defineProperty(HTMLElement.prototype, "scrollTo", {
      configurable: true,
      value: scrollTo,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("auto-scrolls the execution region to the bottom when the trigger changes", () => {
    const { container, rerender } = render(
      <TaskPanel
        isOpen
        onClose={() => {}}
        header={HEADER}
        meta={META}
        autoScrollToBottom
        autoScrollBehavior="auto"
        autoScrollTrigger={1}
      >
        <div>Initial state</div>
      </TaskPanel>,
    )

    const scrollRegion = container.querySelector(".overflow-y-auto")

    if (!(scrollRegion instanceof HTMLDivElement)) {
      throw new Error("TaskPanel scroll region was not rendered.")
    }

    Object.defineProperty(scrollRegion, "scrollHeight", {
      configurable: true,
      value: 640,
    })

    rerender(
      <TaskPanel
        isOpen
        onClose={() => {}}
        header={HEADER}
        meta={META}
        autoScrollToBottom
        autoScrollBehavior="auto"
        autoScrollTrigger={2}
      >
        <div>Updated state</div>
      </TaskPanel>,
    )

    expect(scrollTo).toHaveBeenLastCalledWith({
      top: 640,
      behavior: "auto",
    })
  })
})
