// Duration visual mappings for NoteStack Duration type
export const DURATION_VISUALS: Record<import('../types/notestack').Duration, {
  stemHeight: number;
  hasFlag: boolean;
  flagCount: number;
  isOpen: boolean;
}> = {
  'whole': { stemHeight: 0, hasFlag: false, flagCount: 0, isOpen: true },
  'half': { stemHeight: 30, hasFlag: false, flagCount: 0, isOpen: true },
  'quarter': { stemHeight: 30, hasFlag: false, flagCount: 0, isOpen: false },
  'eighth': { stemHeight: 30, hasFlag: true, flagCount: 1, isOpen: false },
  'sixteenth': { stemHeight: 30, hasFlag: true, flagCount: 2, isOpen: false }
}; 