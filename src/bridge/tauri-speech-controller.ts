export type SpeechCancelReason = "barge-in" | "cleanup"

type CancelActiveSpeechHandler = (reason: SpeechCancelReason) => void

let activeSpeechText = ""
let cancelActiveSpeechHandler: CancelActiveSpeechHandler | null = null

export function normalizeSpeechText(text: string) {
  return text
    .toLowerCase()
    .replace(/`/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function orderedTokenMatchRatio(left: string, right: string) {
  const leftTokens = normalizeSpeechText(left).split(" ").filter(Boolean)
  const rightTokens = normalizeSpeechText(right).split(" ").filter(Boolean)
  const comparedLength = Math.min(leftTokens.length, rightTokens.length)

  if (comparedLength === 0) {
    return 0
  }

  let matches = 0
  for (let index = 0; index < comparedLength; index += 1) {
    if (leftTokens[index] === rightTokens[index]) {
      matches += 1
    }
  }

  return matches / comparedLength
}

export function isSpeechSynthesisEcho(
  recognizedText: string,
  spokenText: string,
) {
  const normalizedRecognized = normalizeSpeechText(recognizedText)
  const normalizedSpoken = normalizeSpeechText(spokenText)

  if (!normalizedRecognized || !normalizedSpoken) {
    return false
  }

  if (
    normalizedSpoken.startsWith(normalizedRecognized) ||
    normalizedRecognized.startsWith(normalizedSpoken)
  ) {
    return true
  }

  return (
    normalizedRecognized.length >= 12 &&
    normalizedSpoken.length >= 12 &&
    orderedTokenMatchRatio(normalizedRecognized, normalizedSpoken) >= 0.75
  )
}

export function setActiveSpeechSession(
  text: string,
  cancelHandler: CancelActiveSpeechHandler,
) {
  activeSpeechText = text
  cancelActiveSpeechHandler = cancelHandler
}

export function clearActiveSpeechSession() {
  activeSpeechText = ""
  cancelActiveSpeechHandler = null
}

export function getActiveSpeechText() {
  return activeSpeechText
}

export function cancelActiveSpeech(reason: SpeechCancelReason) {
  if (cancelActiveSpeechHandler === null) {
    return false
  }

  cancelActiveSpeechHandler(reason)
  return true
}

export function resetSpeechSynthesisController() {
  activeSpeechText = ""
  cancelActiveSpeechHandler = null
}
