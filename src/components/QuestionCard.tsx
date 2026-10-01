import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useSettings } from '../store/settings';
import { palette, tints } from '../theme';
import type { Presented } from '../types';
import { BookmarkButton } from './BookmarkButton';

type OptionState = 'idle' | 'selected' | 'right' | 'wrong' | 'dim';
interface OptionProps { index: number; text: string; state: OptionState; selected: boolean; disabled: boolean; onPress: () => void; compact?: boolean; textSize?: number; }
function Option({ index, text, state, selected, disabled, onPress, compact = false, textSize }: OptionProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const reduce = useSettings((s) => s.reduceMotion);
  const [shake] = useState(() => new Animated.Value(0));
  const [pulse] = useState(() => new Animated.Value(1));
  useEffect(() => {
    shake.setValue(0); pulse.setValue(1);
    if (reduce) return;
    const animation = state === 'wrong' ? Animated.sequence([-8, 8, -6, 6, 0].map((v) => Animated.timing(shake, { toValue: v, duration: 60, useNativeDriver: true }))) : state === 'right' ? Animated.sequence([Animated.timing(pulse, { toValue: 1.03, duration: 120, useNativeDriver: true }), Animated.timing(pulse, { toValue: 1, duration: 160, useNativeDriver: true })]) : null;
    animation?.start();
    return () => animation?.stop();
  }, [state, reduce, shake, pulse]);
  const solid = theme.dark ? tints.dark : tints.light;
  const success = theme.dark ? '#8DCB91' : palette.success;
  const danger = theme.dark ? '#FFB4AB' : palette.danger;
  const feedback = state === 'right' ? success : state === 'wrong' ? danger : theme.colors.secondary;
  const bg = state === 'right' ? solid.success : state === 'wrong' ? solid.danger : state === 'selected' ? theme.colors.secondaryContainer : theme.colors.surface;
  const mark = state === 'right' ? '✓' : state === 'wrong' ? '✗' : String.fromCharCode(65 + index);
  const label = state === 'right' ? `${text}, ${t('quiz.correct')}` : state === 'wrong' ? `${text}, ${t('quiz.incorrect')}` : text;
  return <Animated.View style={{ transform: [{ translateX: shake }, { scale: pulse }] }}>
    <Pressable accessibilityRole='button' accessibilityLabel={label} accessibilityState={{ selected, disabled }} disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.option, compact && styles.compactOption, { backgroundColor: bg, borderColor: state === 'idle' || state === 'dim' ? theme.colors.outlineVariant : feedback, borderWidth: state === 'idle' || state === 'dim' ? 1.5 : 2.5 }, pressed && !disabled && styles.pressed]}>
      <View style={[styles.badge, compact && styles.compactBadge, { backgroundColor: state === 'idle' || state === 'dim' ? theme.colors.surfaceVariant : feedback }]}><Text style={[styles.badgeText, { color: state === 'idle' || state === 'dim' ? theme.colors.onSurfaceVariant : theme.dark ? '#121318' : '#FFFFFF' }]}>{mark}</Text></View>
      <Text variant='bodyLarge' style={[styles.text, textSize ? { fontSize: textSize, lineHeight: textSize * 1.5 } : undefined]}>{text}</Text>
    </Pressable>
  </Animated.View>;
}
interface Props { presented: Presented; selected: number | null; reveal: boolean; onSelect: (index: number) => void; showBookmark?: boolean; compact?: boolean; textSize?: number; }
export function QuestionCard({ presented, selected, reveal, onSelect, showBookmark = true, compact = false, textSize }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { question, options, correctIndex } = presented;
  const success = theme.dark ? '#8DCB91' : palette.success;
  const danger = theme.dark ? '#FFB4AB' : palette.danger;
  return <View style={[styles.wrap, compact && { gap: 10 }]}>
    <View style={[styles.questionBox, { backgroundColor: compact ? theme.colors.background : theme.colors.surface, borderColor: theme.colors.outlineVariant }, compact && styles.flatQuestion]}>
      {showBookmark ? <View style={styles.tools}><BookmarkButton question={question} /></View> : null}
      <Text variant='titleLarge' style={[styles.question, textSize ? { fontSize: textSize + 2, lineHeight: (textSize + 2) * 1.45 } : undefined]}>{question.text}</Text>
    </View>
    {options.map((opt, i) => {
      const state: OptionState = reveal ? i === correctIndex ? 'right' : i === selected ? 'wrong' : 'dim' : i === selected ? 'selected' : 'idle';
      return <Option key={`${question.id}-${i}-${opt}`} index={i} text={opt} state={state} selected={i === selected} disabled={reveal} onPress={() => onSelect(i)} compact={compact} textSize={textSize} />;
    })}
    {reveal && selected === correctIndex ? <Text accessibilityLiveRegion='polite' style={[styles.banner, { color: success }]}>{`✓ ${t('quiz.correct')}`}</Text> : null}
    {reveal && selected !== null && selected !== correctIndex ? <Text accessibilityLiveRegion='polite' style={[styles.banner, { color: danger }]}>{`✗ ${t('quiz.incorrect')}`}</Text> : null}
    {reveal && question.explanation ? <View style={[styles.explanation, { backgroundColor: theme.colors.primaryContainer }]}><Text variant='bodyMedium' style={{ color: theme.colors.onPrimaryContainer }}>{`💡 ${question.explanation}`}</Text></View> : null}
  </View>;
}
const styles = StyleSheet.create({ wrap: { gap: 12 }, questionBox: { borderRadius: 20, borderWidth: 1, padding: 18, gap: 12 }, flatQuestion: { borderWidth: 0, borderRadius: 0, paddingHorizontal: 0, paddingTop: 0, paddingBottom: 8 }, tools: { flexDirection: 'row', justifyContent: 'flex-end' }, question: { fontWeight: '600' }, option: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: 16 }, compactOption: { minHeight: 52, paddingVertical: 12, gap: 12 }, pressed: { opacity: 0.85 }, badge: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' }, compactBadge: { width: 28, height: 28, borderRadius: 14 }, badgeText: { fontWeight: '700', fontSize: 16 }, text: { flex: 1 }, banner: { fontSize: 18, fontWeight: '700' }, explanation: { borderRadius: 16, padding: 14 } });
