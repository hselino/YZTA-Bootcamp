const light = {
  primary: '#603bf8',
  primaryLight: '#ede9fe',
  background: '#f8f9fa',
  surface: '#ffffff',
  text: '#1e293b',
  textSecondary: '#64748b',
  border: '#e2e8f0',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  white: '#ffffff',
};

const dark = {
  primary: '#8b6bfb',
  primaryLight: '#2a2350',
  background: '#0e0f14',
  surface: '#1a1c25',
  text: '#f1f5f9',
  textSecondary: '#94a3b8',
  border: '#2c2f3a',
  success: '#34d399',
  warning: '#fbbf24',
  error: '#f87171',
  white: '#ffffff',
};

export const palettes = { light, dark };

// Not: dinamik (tema-duyarlı) renk için bkz. src/context/ThemeContext.js -> useThemeColors().
// Bu statik export sadece tema context'i dışında (örn. utils/scoreColor.js) kullanılır.
export const colors = light;
