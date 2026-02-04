/**
 * Character state snapshot for UI display
 */
export interface CharacterStateSnapshot {
    health: number;
    skillModifiers: Record<string, number>;
}
