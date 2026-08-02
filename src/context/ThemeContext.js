import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { palettes } from '../theme/colors';

const ThemeContext = createContext(palettes.light);

export const ThemeProvider = ({ children }) => {
  const scheme = useColorScheme();
  const colors = useMemo(() => (scheme === 'dark' ? palettes.dark : palettes.light), [scheme]);
  return <ThemeContext.Provider value={colors}>{children}</ThemeContext.Provider>;
};

// Ekran/bileşenlerde StyleSheet'i her render'da güncel renklerle yeniden oluşturmak için kullanılır.
export const useThemeColors = () => useContext(ThemeContext);
