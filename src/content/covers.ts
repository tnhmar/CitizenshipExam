const COVERS = ['🍁', '📜', '🦅', '🗿', '⚔️', '🚂', '🏙️', '🏛️', '🗳️', '⚖️', '🏒', '💼', '🗺️', '🏔️'];

export function chapterCover(order: number): string {
  return COVERS[order - 1] ?? '📖';
}
