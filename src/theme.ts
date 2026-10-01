import { MD3DarkTheme, MD3LightTheme, type MD3Theme } from 'react-native-paper';

export const palette = {
  success: '#2E7D32', successBg: '#E3F1E4',
  danger: '#C62828', dangerBg: '#F9E0E0',
  warning: '#ED6C02', warningBg: '#FDEBD9',
};
export const tints = {
  light: { success: '#E3F1E4', warning: '#FDEBD9', danger: '#F9E0E0' },
  dark: { success: '#1F3A22', warning: '#43301A', danger: '#472122' },
};
export const lightTheme: MD3Theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#C22020', onPrimary: '#FFFFFF', primaryContainer: '#FDE3E3', onPrimaryContainer: '#5C0A0A',
    secondary: '#12377C', onSecondary: '#FFFFFF', secondaryContainer: '#E2EAFB', onSecondaryContainer: '#12377C',
    background: '#F4F5F9', surface: '#FFFFFF', surfaceVariant: '#E9EAF1', outline: '#B9BCC8', outlineVariant: '#DEE0E8',
  },
};
export const darkTheme: MD3Theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#FF8A80', onPrimary: '#3B0A0A', primaryContainer: '#5A1E1E', onPrimaryContainer: '#FFDAD6',
    secondary: '#9DB7F5', onSecondary: '#102853', secondaryContainer: '#263C64', onSecondaryContainer: '#DCE6FF',
    background: '#121318', surface: '#1C1D24', surfaceVariant: '#2B2D37', outline: '#6D7080', outlineVariant: '#3A3C47',
  },
};
export const headerOptions = (theme: MD3Theme) => ({
  headerStyle: { backgroundColor: theme.colors.primary },
  headerTintColor: theme.colors.onPrimary,
  headerTitleStyle: { fontWeight: '700' as const },
  headerShadowVisible: false,
});
