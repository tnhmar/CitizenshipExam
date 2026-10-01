import { useTranslation } from 'react-i18next';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSettings } from '../store/settings';
import { palette } from '../theme';

interface Props { visible: boolean; ids: number[]; answered: number[]; flags: number[]; current: number; onChoose: (index: number) => void; onClose: () => void; }
export function ExamOverview({ visible, ids, answered, flags, current, onChoose, onClose }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const reduce = useSettings((s) => s.reduceMotion);
  const warning = theme.dark ? '#FFBB73' : palette.warning;
  if (!visible) return null;
  return <Modal transparent visible animationType={reduce ? 'none' : 'slide'} onRequestClose={onClose}>
    <View style={styles.root}>
      <Pressable accessibilityRole='button' accessibilityLabel={t('focusUi.close')} onPress={onClose} style={[StyleSheet.absoluteFill, styles.backdrop]} />
      <View accessibilityViewIsModal style={[styles.sheet, { backgroundColor: theme.colors.surface, paddingBottom: Math.max(16, insets.bottom) }]}>
        <View style={styles.header}><Text accessibilityRole='header' variant='titleLarge' style={styles.grow}>{t('focusUi.questions')}</Text><Pressable accessibilityRole='button' accessibilityLabel={t('focusUi.close')} onPress={onClose} style={styles.close}><Text style={{ fontSize: 24 }}>✕</Text></Pressable></View>
        <Text variant='bodySmall'>{t('focusUi.overviewHint')}</Text>
        <View style={styles.legend}><Text variant='bodySmall'>{`● ${t('examUi.statAnswered')}`}</Text><Text variant='bodySmall'>{`○ ${t('examUi.statUnanswered')}`}</Text><Text variant='bodySmall' style={{ color: warning }}>{`⚑ ${t('examUi.statFlagged')}`}</Text></View>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.grid}>{ids.map((id, i) => {
          const done = answered.includes(id);
          const marked = flags.includes(id);
          return <Pressable key={id} accessibilityRole='button' accessibilityState={{ selected: i === current }} accessibilityLabel={`${t('examUi.questionNo', { n: i + 1 })}, ${done ? t('examUi.statAnswered') : t('examUi.statUnanswered')}${marked ? `, ${t('examUi.statFlagged')}` : ''}`} onPress={() => onChoose(i)} style={[styles.dot, { backgroundColor: done ? theme.colors.primary : theme.colors.surface, borderWidth: i === current ? 3 : 1.5, borderColor: i === current ? theme.colors.primary : marked ? warning : theme.colors.outline }]}><Text style={{ color: done ? theme.colors.onPrimary : theme.colors.onSurface, fontWeight: '600' }}>{i + 1}</Text>{marked ? <Text style={[styles.flag, { color: warning }]}>⚑</Text> : null}</Pressable>;
        })}</ScrollView>
      </View>
    </View>
  </Modal>;
}
const styles = StyleSheet.create({ root: { flex: 1, justifyContent: 'flex-end' }, backdrop: { backgroundColor: 'rgba(0,0,0,0.45)' }, sheet: { maxHeight: '80%', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, gap: 12 }, header: { flexDirection: 'row', alignItems: 'center', gap: 12 }, grow: { flex: 1, fontWeight: '700' }, close: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }, legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 }, scroll: { flexShrink: 1 }, grid: { padding: 6, flexDirection: 'row', flexWrap: 'wrap', gap: 12 }, dot: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' }, flag: { position: 'absolute', top: -5, right: -2, fontSize: 16 } });
