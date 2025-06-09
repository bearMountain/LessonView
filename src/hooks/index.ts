// Hooks Index - Centralized exports for all custom hooks

// Primary state management hook (NoteStack architecture)
export { useNoteStackEditor, type NoteStackEditorAPI } from './useNoteStackEditor'

// Legacy hooks for gradual migration
export { useTabEditor, type TabEditorAPI } from './useTabEditor'
export { useNoteInput, type NoteInputAPI } from './useNoteInput'
export { useNavigation, type NavigationAPI } from './useNavigation'
// usePlayback removed - replaced with functional AudioContext 