import { createContext, useContext, type ReactNode } from 'react'
import { useColorScheme } from 'react-native'

import { palettes, type Palette } from './tokens'

const ThemeContext = createContext<Palette>(palettes.light)

/**
 * Follows the OS appearance. There is no in-app override yet — on mobile the
 * system setting is what people expect to win, and adding a third state before
 * there is a settings screen to host it would be guessing.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const scheme = useColorScheme()
  return (
    <ThemeContext.Provider value={scheme === 'dark' ? palettes.dark : palettes.light}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}

export function useIsDark() {
  return useTheme() === palettes.dark
}
