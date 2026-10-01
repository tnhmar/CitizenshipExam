import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { Panel } from './Panel';
export function SettingsSection({ title, children }: { title: string; children: ReactNode }) { const theme = useTheme(); return <View style={styles.group}><Text variant='titleMedium' style={{ color: theme.colors.secondary }}>{title}</Text><Panel>{children}</Panel></View>; }
const styles = StyleSheet.create({ group: { gap: 8 } });
