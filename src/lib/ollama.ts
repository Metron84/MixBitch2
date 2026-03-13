export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

// Use /api/ollama proxy (server.cjs or Vite dev proxy) so Ollama can run as desktop app only
const BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_OLLAMA_URL) ||
  '/api/ollama'

const MODEL = 'llama3.1:latest'

export async function checkOllamaAvailable(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/api/tags`, {
      signal: AbortSignal.timeout(3000),
    })
    return res.ok
  } catch {
    return false
  }
}

export async function* streamChat(
  messages: ChatMessage[],
  system: string,
): AsyncGenerator<string> {
  const body = {
    model: MODEL,
    messages: [{ role: 'system' as const, content: system }, ...messages],
    stream: true,
  }

  const res = await fetch(`${BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    throw new Error(`Ollama returned ${res.status}: ${res.statusText}`)
  }

  const reader = res.body?.getReader()
  if (!reader) throw new Error('No response body')

  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        if (!line.trim()) continue
        try {
          const parsed = JSON.parse(line)
          if (parsed.message?.content) {
            yield parsed.message.content
          }
        } catch {
          // skip malformed JSON lines
        }
      }
    }

    if (buffer.trim()) {
      try {
        const parsed = JSON.parse(buffer)
        if (parsed.message?.content) {
          yield parsed.message.content
        }
      } catch {
        // skip
      }
    }
  } finally {
    reader.releaseLock()
  }
}

export async function chat(
  messages: ChatMessage[],
  system: string,
): Promise<string> {
  const body = {
    model: MODEL,
    messages: [{ role: 'system' as const, content: system }, ...messages],
    stream: false,
  }

  const res = await fetch(`${BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    throw new Error(`Ollama returned ${res.status}: ${res.statusText}`)
  }

  const data = await res.json()
  return data.message?.content ?? ''
}
