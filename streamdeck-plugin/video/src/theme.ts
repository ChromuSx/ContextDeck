export const COLORS = {
  background: "#020712",
  panel: "#071426",
  panelRaised: "#0b1d35",
  cyan: "#05d9ff",
  blue: "#2188ff",
  violet: "#7a2cff",
  magenta: "#c23bff",
  text: "#f7fbff",
  muted: "#9fb0c8",
  line: "rgba(133, 184, 255, 0.22)",
  green: "#20e6a7",
  warning: "#f7b84b",
  error: "#ff5b7c",
} as const;

export const FONT =
  '"Segoe UI", Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Arial, sans-serif';

export const PROFILE_COLORS = {
  text: COLORS.cyan,
  file: COLORS.blue,
  folder: COLORS.violet,
  image: COLORS.magenta,
} as const;

export type ContextKind = keyof typeof PROFILE_COLORS;
