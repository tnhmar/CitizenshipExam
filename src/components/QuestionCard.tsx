import { Pressable, StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import type { Presented } from '../types';

interface Props {
  presented: Presented;
  selected: number | null;
  reveal: boolean;
  onSelect: (index: number) => void;
}

const RIGHT_BG = 'rgba(46,125,50,0.18)';
const WRONG_BG = 'rgba(198,40,40,0.18)';

export function QuestionCard({ presented, selected, reveal, onSelect }: Props) {
  const theme = useTheme();
  const { question, options, correctIndex } = presented;
  return (
    <View style={styles.wrap}>
      <Text variant='titleMedium'>{question.text}</Text>
      {options.map((opt, i) => {
        const isRight = i === correctIndex;
        const isSel = i === selected;
        let bg = theme.colors.surface;
        let border = theme.colors.outline;
        let mark = isSel ? '●' : '';
        if (reveal && isRight) {
          bg = RIGHT_BG;
          border = '#2E7D32';
          mark = '✓';
        } else if (reveal && isSel) {
          bg = WRONG_BG;
          border = '#C62828';
          mark = '✗';
        }
        return (
          <Pressable
            key={`${i}-${opt}`}
            disabled={reveal}
            onPress={() => onSelect(i)}
            accessibilityRole='button'
            accessibilityState={{ selected: isSel, disabled: reveal }}
            style={[styles.option, { backgroundColor: bg, borderColor: border }]}
          >
            <Text style={styles.letter}>{String.fromCharCode(65 + i)}</Text>
            <Text style={styles.text}>{opt}</Text>
            <Text style={styles.mark}>{mark}</Text>
          </Pressable>
        );
      })}
      {reveal && question.explanation ? <Text variant='bodyMedium'>{question.explanation}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderWidth: 1.5, borderRadius: 12 },
  letter: { fontWeight: '700', width: 22 },
  text: { flex: 1 },
  mark: { fontSize: 18, width: 22, textAlign: 'center' },
});
