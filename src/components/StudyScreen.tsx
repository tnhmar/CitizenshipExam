import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useTheme } from 'react-native-paper';

interface Props {
  children: ReactNode;
  top?: ReactNode;
  footer?: ReactNode;
  scrollKey?: string | number;
}

export function StudyScreen({ children, top, footer, scrollKey }: Props) {
  const theme = useTheme();
  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      {top ? <View style={styles.top}>{top}</View> : null}
      <ScrollView key={scrollKey} style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps='handled'>
        {children}
      </ScrollView>
      {footer ? (
        <View style={[styles.footer, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.outlineVariant }]}>
          {footer}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  top: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8, gap: 8 },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 24, gap: 16 },
  footer: { borderTopWidth: 1, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12, gap: 8 },
});
