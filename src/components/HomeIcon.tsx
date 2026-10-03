import Svg, { Circle, Path, Rect } from 'react-native-svg';
export type HomeIconKind = 'review' | 'calendar' | 'streak' | 'settings';
export function HomeIcon({ kind, color, size = 20 }: { kind: HomeIconKind; color: string; size?: number }) {
  return <Svg width={size} height={size} viewBox='0 0 24 24' fill='none' stroke={color} strokeWidth={1.8} strokeLinecap='round' strokeLinejoin='round' accessible={false}>
    {kind === 'review' ? <><Path d='M20 4v6h-6M4 20v-6h6' /><Path d='M5 9a7 7 0 0 1 12-4l3 5M19 15a7 7 0 0 1-12 4l-3-5' /></> : null}
    {kind === 'calendar' ? <><Rect x={3} y={5} width={18} height={16} rx={2} /><Path d='M7 3v4M17 3v4M3 10h18M7 14h3M14 14h3' /></> : null}
    {kind === 'streak' ? <Path d='M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-2 1-4 3-6 0 3 1 4 2 4 1-2 1-5 0-8Z' /> : null}
    {kind === 'settings' ? <><Path d='M10 2h4l.7 3 2.3 1.3 3-.8 2 3.5-2.2 2.2v2.6l2.2 2.2-2 3.5-3-.8-2.3 1.3-.7 3h-4l-.7-3-2.3-1.3-3 .8-2-3.5 2.2-2.2v-2.6L2 9l2-3.5 3 .8L9.3 5 10 2Z' /><Circle cx={12} cy={12} r={3} /></> : null}
  </Svg>;
}
