import { MD3DarkTheme, MD3LightTheme, type MD3Theme } from 'react-native-paper';

export const palette = {
  success: '#2E7D32',
  successBg: 'rgba(46,125,50,0.14)',
  danger: '#C62828',
  dangerBg: 'rgba(198,40,40,0.14)',
  warning: '#ED6C02',
  warningBg: 'rgba(237,108,2,0.14)',
};

export const lightTheme: MD3Theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#C22020',
    onPrimary: '#FFFFFF',
    primaryContainer: '#FDE3E3',
    onPrimaryContainer: '#5C0A0A',
    secondary: '#12377C',
    background: '#F4F5F9',
    surface: '#FFFFFF',
    surfaceVariant: '#E9EAF1',
    outline: '#B9BCC8',
    outlineVariant: '#DEE0E8',
  },
};

export const darkTheme: MD3Theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#FF8A80',
    onPrimary: '#3B0A0A',
    primaryContainer: '#5A1E1E',
    onPrimaryContainer: '#FFDAD6',
    secondary: '#9DB7F5',
    background: '#121318',
    surface: '#1C1D24',
    surfaceVariant: '#2B2D37',
    outline: '#6D7080',
    outlineVariant: '#3A3C47',
  },
};
