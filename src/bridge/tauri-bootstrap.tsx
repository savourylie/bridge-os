import { useEffect } from "react"

import { bridgeStore, type BridgeStoreApi } from "@/state"
import { useTauriBridge } from "@/bridge/tauri"

interface TauriBridgeBootstrapProps {
  store?: BridgeStoreApi
}

export function TauriBridgeBootstrap({
  store = bridgeStore,
}: TauriBridgeBootstrapProps) {
  const bridge = useTauriBridge()

  useEffect(() => {
    if (!bridge.isAvailable()) {
      return
    }

    let didCancel = false
    let unlisten: VoidFunction | undefined

    void (async () => {
      unlisten = await bridge.subscribe(store)

      if (didCancel) {
        unlisten()
        return
      }

      await bridge.hydrate(store)
    })()

    return () => {
      didCancel = true
      unlisten?.()
    }
  }, [bridge, store])

  return null
}
