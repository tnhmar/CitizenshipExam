import type { StyleProp, TextStyle } from 'react-native';
import { Text } from 'react-native-paper';

interface Props {
  text: string;
  variant?: 'bodyLarge' | 'bodyMedium' | 'titleMedium';
  style?: StyleProp<TextStyle>;
}

export function RichText({ text, variant = 'bodyLarge', style }: Props) {
  const parts = text.split('**');
  return (
    <Text variant={variant} style={style}>
      {parts.map((p, i) =>
        i % 2 === 1 ? (
          <Text key={i} style={{ fontWeight: '700' }}>
            {p}
          </Text>
        ) : (
          p
        ),
      )}
    </Text>
  );
}
