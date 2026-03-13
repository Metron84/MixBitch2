import { useState, useEffect } from 'react'
import type { Card } from '../../types/game'

const VALUE_LABELS: Record<number, string> = { 11: 'J', 12: 'Q', 13: 'K', 14: 'A' }
function getValueLabel(value: number): string {
  return VALUE_LABELS[value] ?? String(value)
}

function getConsecutiveTriple(hand: readonly Card[]): [number, number, number] | null {
  if (hand.length !== 3) return null
  const sorted = [...hand].map((c) => c.value).sort((a, b) => a - b)
  if (sorted[1] === sorted[0] + 1 && sorted[2] === sorted[1] + 1) {
    return [sorted[0], sorted[1], sorted[2]]
  }
  return null
}

interface SequenceHintProps {
  handCards: readonly Card[]
}

export function SequenceHint({ handCards }: SequenceHintProps) {
  const triple = getConsecutiveTriple(handCards)
  const [visible, setVisible] = useState(!!triple)

  useEffect(() => {
    if (!triple) {
      setVisible(false)
      return
    }
    setVisible(true)
    const t = setTimeout(() => setVisible(false), 3000)
    return () => clearTimeout(t)
  }, [triple?.[0], triple?.[1], triple?.[2]])

  if (!triple || !visible) return null

  const label = triple.map(getValueLabel).join('–')
  return (
    <div className="rounded-xl bg-cedar-light border border-cedar/50 px-3 py-2 text-center text-base text-cedar-dark">
      💡 You can play {label} as a sequence
    </div>
  )
}
