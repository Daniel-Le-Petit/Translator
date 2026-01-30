/**
 * Palette de couleurs pour les participants
 */
export const PARTICIPANT_COLORS = [
  '#3B82F6', // bleu
  '#10B981', // vert
  '#F59E0B', // orange
  '#EF4444', // rouge
  '#8B5CF6', // violet
  '#EC4899', // rose
  '#06B6D4', // cyan
  '#84CC16', // lime
  '#F97316', // orange foncé
  '#6366F1', // indigo
];

export function getColorForParticipant(index: number): string {
  return PARTICIPANT_COLORS[index % PARTICIPANT_COLORS.length];
}
