import { MD3DarkTheme, MD3LightTheme, type MD3Theme } from 'react-native-paper';

export const lightTheme: MD3Theme = {
  ...MD3LightTheme,
  colors: { ...MD3LightTheme.colors, primary: '#C22020', secondary: '#12377C' },
};

export const darkTheme: MD3Theme = {
  ...MD3DarkTheme,
  colors: { ...MD3DarkTheme.colors, primary: '#FF8A80', secondary: '#9DB7F5' },
};
