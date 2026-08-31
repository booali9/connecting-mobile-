/**
 * The same design tokens as the web app, expressed as plain values because
 * React Native has no CSS custom properties.
 *
 * The four-way split of the brand orange is carried over deliberately — it is
 * the thing that keeps the two products looking like one. See the web app's
 * UI_GUIDE.md for why each step exists:
 *
 *   brand      vivid accent — display type, icons, dots
 *   brandInk   small brand-coloured text (an orange this saturated cannot
 *              reach 4.5:1 on a light background at body size)
 *   primary    solid fills, paired with primaryOn
 *   brandPanel large brand field, always carries near-black copy
 */

const RAMP = {
  50: '#fef3ed',
  100: '#fde3d4',
  200: '#fbc6a8',
  300: '#f9a272',
  400: '#f7823f',
  500: '#f5641e',
  550: '#e8560f',
  600: '#cc4a10',
  700: '#a63a0d',
  800: '#7e2c0a',
  900: '#5c2008',
}

export type Palette = typeof light

const light = {
  background: '#fdf6f3',
  surface: '#faf1ed',
  card: '#ffffff',
  text: '#2a1e1a',
  muted: '#f4e9e4',
  mutedText: '#776359',
  border: '#ece0da',
  borderStrong: '#dbcac2',

  brand: RAMP[550],
  brandInk: RAMP[700],
  brandSubtle: RAMP[50],
  brandPanel: RAMP[500],
  brandPanelOn: '#2a1e1a',

  primary: RAMP[600],
  primaryOn: '#ffffff',

  success: '#17795a',
  successOn: '#ffffff',
  successSubtle: '#e6f4ee',
  warning: '#8a5f00',
  warningOn: '#ffffff',
  warningSubtle: '#fbf1da',
  danger: '#b42318',
  dangerOn: '#ffffff',
  dangerSubtle: '#fdeceb',
  info: '#1e5ea8',
  infoOn: '#ffffff',
  infoSubtle: '#e8f0f9',
}

const dark: Palette = {
  background: '#1a1310',
  surface: '#211815',
  card: '#241a16',
  text: '#f4ece8',
  muted: '#2e221d',
  mutedText: '#a89890',
  border: '#362721',
  borderStrong: '#4a362e',

  // Ink lightens on dark; the panel stays vivid and keeps its dark copy.
  brand: RAMP[400],
  brandInk: RAMP[400],
  brandSubtle: 'rgba(247,130,63,0.14)',
  brandPanel: RAMP[500],
  brandPanelOn: '#1a1310',

  primary: RAMP[500],
  primaryOn: '#1a1310',

  success: '#4cb98d',
  successOn: '#0d2b20',
  successSubtle: 'rgba(76,185,141,0.16)',
  warning: '#d8a53a',
  warningOn: '#2b1f00',
  warningSubtle: 'rgba(216,165,58,0.16)',
  danger: '#f2776b',
  dangerOn: '#2b0e0b',
  dangerSubtle: 'rgba(242,119,107,0.16)',
  info: '#6ba5e6',
  infoOn: '#0c1e33',
  infoSubtle: 'rgba(107,165,230,0.16)',
}

export const palettes = { light, dark }

/** 4-point spacing scale, matching the web app's rhythm. */
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 }

export const radius = { sm: 6, md: 8, lg: 10, xl: 14, xxl: 18, pill: 999 }

export const type = {
  display: { fontSize: 28, fontWeight: '600' as const, letterSpacing: -0.4 },
  title: { fontSize: 20, fontWeight: '600' as const, letterSpacing: -0.2 },
  heading: { fontSize: 16, fontWeight: '600' as const },
  body: { fontSize: 14, fontWeight: '400' as const },
  label: { fontSize: 13, fontWeight: '500' as const },
  caption: { fontSize: 12, fontWeight: '400' as const },
  mono: { fontSize: 12, fontWeight: '500' as const },
}
