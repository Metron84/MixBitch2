const STORAGE_KEY = 'all-in-dark-mode'

export function isDark(): boolean {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored !== null) return stored === 'true'
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export function setDark(value: boolean): void {
  localStorage.setItem(STORAGE_KEY, String(value))
  document.documentElement.classList.toggle('dark', value)
}

export function initDarkMode(): void {
  document.documentElement.classList.toggle('dark', isDark())
}
