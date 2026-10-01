import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import Svg, { Path } from 'react-native-svg';
import { hasBookmark } from '../logic/bookmarks';
import { useProgress } from '../store/progress';
import type { Question } from '../types';

export function BookmarkButton({ question }: { question: Question }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const saved = useProgress((s) => hasBookmark(s.bookmarks, question.conceptId));
  const toggle = useProgress((s) => s.toggleBookmark);
  const color = saved ? theme.colors.primary : theme.colors.secondary;
  return <Pressable accessibilityRole='button' accessibilityLabel={t(saved ? 'bookmarksUi.remove' : 'bookmarksUi.save')} accessibilityState={{ selected: saved }} onPress={() => toggle(question)} style={[styles.button, { borderColor: theme.colors.outlineVariant, backgroundColor: saved ? theme.colors.primaryContainer : theme.colors.surface }]}>
    <Svg width={22} height={22} viewBox='0 0 24 24'><Path d='M6 3h12v18l-6-4-6 4V3Z' stroke={color} strokeWidth={1.8} fill={saved ? color : 'none'} strokeLinejoin='round' /></Svg>
    <Text variant='labelLarge' style={{ color }}>{t(saved ? 'bookmarksUi.saved' : 'bookmarksUi.save')}</Text>
  </Pressable>;
}
const styles = StyleSheet.create({ button: { minHeight: 44, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 8 } });
