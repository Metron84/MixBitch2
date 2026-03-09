/**
 * Sound engine using Web Audio API with layered synthesis.
 * Produces richer card-game-appropriate sounds without external assets.
 * Persists sound on/off in localStorage.
 */

const STORAGE_KEY = 'all-in-game-sound'

let ctx: AudioContext | null = null

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ctx) ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

function playTone(
  frequency: number,
  duration: number,
  volume: number,
  type: OscillatorType = 'sine',
  delay = 0,
  detune = 0
) {
  const context = getContext()
  if (!context) return
  const osc = context.createOscillator()
  const gain = context.createGain()
  osc.connect(gain)
  gain.connect(context.destination)
  osc.type = type
  osc.frequency.value = frequency
  osc.detune.value = detune
  const t = context.currentTime + delay
  gain.gain.setValueAtTime(0, t)
  gain.gain.linearRampToValueAtTime(volume, t + 0.005)
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration)
  osc.start(t)
  osc.stop(t + duration)
}

function playNoise(duration: number, volume: number, delay = 0) {
  const context = getContext()
  if (!context) return
  const bufferSize = context.sampleRate * duration
  const buffer = context.createBuffer(1, bufferSize, context.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.5
  }
  const source = context.createBufferSource()
  source.buffer = buffer
  const bandpass = context.createBiquadFilter()
  bandpass.type = 'bandpass'
  bandpass.frequency.value = 2000
  bandpass.Q.value = 0.5
  const gain = context.createGain()
  const t = context.currentTime + delay
  gain.gain.setValueAtTime(0, t)
  gain.gain.linearRampToValueAtTime(volume, t + 0.003)
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration)
  source.connect(bandpass)
  bandpass.connect(gain)
  gain.connect(context.destination)
  source.start(t)
  source.stop(t + duration)
}

function loadEnabled(): boolean {
  if (typeof window === 'undefined') return true
  return localStorage.getItem(STORAGE_KEY) !== 'false'
}

export const sound = {
  enabled: loadEnabled(),
  volume: 0.7,

  getEnabled(): boolean {
    return this.enabled
  },

  setEnabled(value: boolean): void {
    this.enabled = value
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, value ? 'true' : 'false')
    }
  },

  play(event: 'card_play' | 'collect_pile' | 'commitment_card' | 'victory' | 'error' | 'void' | 'reversal' | 'reset') {
    if (!this.enabled) return
    const v = this.volume
    switch (event) {
      case 'card_play':
        playNoise(0.06, v * 0.4)
        playTone(600, 0.06, v * 0.3, 'triangle')
        break
      case 'collect_pile':
        playNoise(0.12, v * 0.3)
        playTone(180, 0.2, v * 0.4, 'sine')
        playTone(140, 0.15, v * 0.3, 'sine', 0.05)
        break
      case 'commitment_card':
        playTone(440, 0.08, v * 0.4, 'sine')
        playTone(554, 0.08, v * 0.35, 'sine', 0.04)
        playTone(659, 0.12, v * 0.3, 'triangle', 0.08)
        break
      case 'void':
        playNoise(0.2, v * 0.5)
        playTone(300, 0.15, v * 0.4, 'sawtooth')
        playTone(150, 0.3, v * 0.3, 'sine', 0.05)
        playTone(100, 0.2, v * 0.2, 'sine', 0.15)
        break
      case 'reversal':
        playTone(400, 0.1, v * 0.35, 'triangle')
        playTone(600, 0.1, v * 0.35, 'triangle', 0.08)
        playTone(400, 0.1, v * 0.3, 'triangle', 0.16)
        break
      case 'reset':
        playTone(523, 0.1, v * 0.3, 'sine')
        playTone(392, 0.15, v * 0.25, 'sine', 0.06)
        break
      case 'victory':
        playTone(523, 0.15, v * 0.4, 'triangle')
        playTone(659, 0.15, v * 0.4, 'triangle', 0.12)
        playTone(784, 0.2, v * 0.45, 'triangle', 0.24)
        playTone(1047, 0.4, v * 0.5, 'sine', 0.36)
        playTone(1047, 0.4, v * 0.2, 'triangle', 0.36, 5)
        break
      case 'error':
        playTone(200, 0.12, v * 0.35, 'sawtooth')
        playTone(160, 0.15, v * 0.3, 'sawtooth', 0.08)
        break
    }
  },
}
