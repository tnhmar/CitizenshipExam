import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useSettings } from '../store/settings';
import { palette } from '../theme';
import type { Presented } from '../types';

type OptionState = 'idle' | 'selected' | 'right' | 'wrong' | 'dim';

interface OptionProps {
  index: number;
  text: string;
  state: OptionState;
  disabled: boolean;
  onPress: () => void;
}

function Option({ index, text, state, disabled, onPress }: OptionProps) {
  const theme = useTheme();
  const reduce = useSettings((s) => s.reduceMotion);
  const [shake] = useState(() => new Animated.Value(0));
  const [pulse] = useState(() => new Animated.Value(1));

  useEffect(() => {
    if (reduce) return;
    if (state === 'wrong') {
      Animated.sequence([-8, 8, -6, 6, 0].map((v) => Animated.timing(shake, { toValue: v, duration: 60, useNativeDriver: true }))).start();
    } else if (state === 'right') {
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.03, duration: 120, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 160, useNativeDriver: true }),
      ]).start();
    }
  }, [state, reduce, shake, pulse]);

  const look = {
    idle: { bg: theme.colors.surface, border: theme.colors.outlineVariant, width: 1.5, badge: theme.colors.surfaceVariant, badgeText: theme.colors.onSurfaceVariant, mark: String.fromCharCode(65 + index) },
    selected: { bg: theme.colors.primaryContainer, border: theme.colors.primary, width: 2.5, badge: theme.colors.primary, badgeText: theme.colors.onPrimary, mark: '✓' },
    right: { bg: palette.successBg, border: palette.success, width: 2.5, badge: palette.success, badgeText: '#FFFFFF', mark: '✓' },
    wrong: { bg: palette.dangerBg, border: palette.danger, width: 2.5, badge: palette.danger, badgeText: '#FFFFFF', mark: '✗' },
    dim: { bg: theme.colors.surface, border: theme.colors.outlineVariant, width: 1.5, badge: theme.colors.surfaceVariant, badgeText: theme.colors.onSurfaceVariant, mark: String.fromCharCode(65 + index) },
  }[state];

  return (
    <Animated.View style={{ transform: [{ translateX: shake }, { scale: pulse }], opacity: state === 'dim' ? 0.55 : 1 }}>
      <Pressable
        accessibilityRole='button'
        accessibilityState={{ selected: state === 'selected' || state === 'right' || state === 'wrong', disabled }}
        disabled={disabled}
        onPress={onPress}
        style={({ pressed }) => [styles.option, { backgroundColor: look.bg, borderColor: look.border, borderWidth: look.width }, pressed && !disabled && styles.pressed]}
      >
        <View style={[styles.badge, { backgroundColor: look.badge }]}>
          <Text style={[styles.badgeText, { color: look.badgeText }]}>{look.mark}</Text>
        </View>
        <Text variant='bodyLarge' style={styles.text}>
          {text}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

interface Props {
  presented: Presented;
  selected: number | null;
  reveal: boolean;
  onSelect: (index: number) => void;
}

export function QuestionCard({ presented, selected, reveal, onSelect }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { question, options, correctIndex } = presented;
  const answeredRight = reveal && selected === correctIndex;
  const answeredWrong = reveal && selected !== null && selected !== correctIndex;

  return (
    <View style={styles.wrap}>
      <View style={[styles.questionBox, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant }]}>
        <Text variant='titleLarge' style={styles.question}>
          {question.text}
        </Text>
      </View>
      {options.map((opt, i) => {
        let state: OptionState = 'idle';
        if (reveal) state = i === correctIndex ? 'right' : i === selected ? 'wrong' : 'dim';
        else if (i === selected) state = 'selected';
        return <Option key={`${i}-${opt}`} index={i} text={opt} state={state} disabled={reveal} onPress={() => onSelect(i)} />;
      })}
      {answeredRight ? <Text style={[styles.banner, { color: palette.success }]}>{`✓ ${t('quiz.correct')}`}</Text> : null}
      {answeredWrong ? <Text style={[styles.banner, { color: palette.danger }]}>{`✗ ${t('quiz.incorrect')}`}</Text> : null}
      {reveal && question.explanation ? (
        <View style={[styles.explanation, { backgroundColor: theme.colors.primaryContainer }]}>
          <Text variant='bodyMedium' style={{ color: theme.colors.onPrimaryContainer }}>{`💡 ${question.explanation}`}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  questionBox: { borderRadius: 20, borderWidth: 1, padding: 18 },
  question: { fontWeight: '600' },
  option: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: 16 },
  pressed: { opacity: 0.85 },
  badge: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  badgeText: { fontWeight: '700', fontSize: 16 },
  text: { flex: 1 },
  banner: { fontSize: 18, fontWeight: '700' },
  explanation: { borderRadius: 16, padding: 14 },
});
