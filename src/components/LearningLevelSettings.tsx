import { Button, Text } from 'react-native-paper';
import { useLearningLevelText } from '../i18n/learningLevels';
import { LEARNING_LEVELS, LEARNING_THRESHOLDS } from '../logic/learningLevels';
import { useSettings } from '../store/settings';
import { Panel } from './Panel';

export function LearningLevelSettings() {
  const text = useLearningLevelText();
  const level = useSettings((s) => s.quizLevel);
  const setLevel = useSettings((s) => s.setQuizLevel);
  return <Panel>
    <Text>{text.hint}</Text>
    {LEARNING_LEVELS.map((choice) => <Button
      key={choice}
      mode={level === choice ? 'contained' : 'outlined'}
      accessibilityState={{ selected: level === choice }}
      onPress={() => setLevel(choice)}
    >{text[choice]} · {LEARNING_THRESHOLDS[choice]} %</Button>)}
    <Text variant='bodySmall'>{text.history}</Text>
  </Panel>;
}
