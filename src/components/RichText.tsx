import { useMemo } from 'react';
import { Text as InlineText, type StyleProp, type TextStyle } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { richSegments, type GlossaryMatcher } from '../logic/glossary';
import type { GlossaryTerm } from '../types';

interface Props {
  text: string;
  variant?: 'bodyLarge' | 'bodyMedium' | 'titleMedium';
  style?: StyleProp<TextStyle>;
  size?: number;
  matcher?: GlossaryMatcher;
  onTerm?: (term: GlossaryTerm) => void;
}

export function RichText({ text, variant = 'bodyLarge', style, size, matcher, onTerm }: Props) {
  const theme = useTheme();
  const parts = useMemo(() => richSegments(text, onTerm ? matcher : undefined), [text, matcher, onTerm]);
  return <Text variant={variant} style={size ? [style, { fontSize: size, lineHeight: size * 1.65 }] : style}>
    {parts.map((p, i) => {
      const term = p.term;
      return <InlineText key={i} accessibilityRole={term ? 'link' : undefined} onPress={term && onTerm ? () => onTerm(term) : undefined} style={[p.bold && { fontWeight: '700' }, term && { color: theme.colors.secondary, textDecorationLine: 'underline' }]}>{p.text}</InlineText>;
    })}
  </Text>;
}
