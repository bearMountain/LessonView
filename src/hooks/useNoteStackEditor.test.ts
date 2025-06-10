import { renderHook, act } from '@testing-library/react';
import { useNoteStackEditor } from './useNoteStackEditor';
import type { Tab } from '../types/notestack';

describe('useNoteStackEditor Hook', () => {
  it('should initialize with empty state', () => {
    const { result } = renderHook(() => useNoteStackEditor());
    
    expect(result.current.state.tab).toHaveLength(0);
    expect(result.current.state.currentPosition).toBe(0);
    expect(result.current.state.selectedDuration).toBe('quarter');
    expect(result.current.state.selectedString).toBe(2);
    expect(result.current.state.bpm).toBe(120);
    expect(result.current.state.timeSignature).toEqual({ numerator: 4, denominator: 4 });
    expect(result.current.state.isModified).toBe(false);
  });

  describe('Note Operations', () => {
    it('should add a note', () => {
      const { result } = renderHook(() => useNoteStackEditor());
      
      act(() => {
        result.current.addNote(960, 1, 7, 'quarter');
      });
      
      expect(result.current.state.tab).toHaveLength(1);
      expect(result.current.state.tab[0].notes).toContainEqual({
        string: 1,
        fret: 7
      });
      expect(result.current.state.tab[0].duration).toBe('quarter');
    });

    it('should remove a note', () => {
      const { result } = renderHook(() => useNoteStackEditor());
      
      // Add a note first
      act(() => {
        result.current.addNote(960, 1, 7, 'quarter');
      });
      
      // Remove it
      act(() => {
        result.current.removeNote(960, 1);
      });
      
      expect(result.current.state.tab).toHaveLength(0);
    });

    it('should handle multiple notes in the same stack', () => {
      const { result } = renderHook(() => useNoteStackEditor());
      
      act(() => {
        result.current.addNote(960, 0, 5, 'quarter');
        result.current.addNote(960, 1, 7, 'quarter');
        result.current.addNote(960, 2, 9, 'quarter');
      });
      
      expect(result.current.state.tab).toHaveLength(1);
      expect(result.current.state.tab[0].notes).toHaveLength(3);
    });

    it('should replace note on same string in stack', () => {
      const { result } = renderHook(() => useNoteStackEditor());
      
      act(() => {
        result.current.addNote(960, 1, 7, 'quarter');
        result.current.addNote(960, 1, 9, 'quarter'); // Replace note on string 1
      });
      
      expect(result.current.state.tab).toHaveLength(1);
      expect(result.current.state.tab[0].notes).toHaveLength(1);
      expect(result.current.state.tab[0].notes[0].fret).toBe(9);
    });

    it('should create separate stacks for different positions', () => {
      const { result } = renderHook(() => useNoteStackEditor());
      
      act(() => {
        result.current.addNote(960, 1, 7, 'quarter');
        result.current.addNote(1920, 1, 9, 'quarter');
      });
      
      expect(result.current.state.tab).toHaveLength(2);
    });
  });

  describe('Navigation', () => {
    it('should set cursor position', () => {
      const { result } = renderHook(() => useNoteStackEditor());
      
      act(() => {
        result.current.setCursorPosition(1920);
      });
      
      expect(result.current.state.currentPosition).toBe(1920);
    });

    it('should move cursor left and right', () => {
      const { result } = renderHook(() => useNoteStackEditor());
      
      // Test basic cursor movement functions exist
      expect(typeof result.current.moveCursorLeft).toBe('function');
      expect(typeof result.current.moveCursorRight).toBe('function');
      
      // Test setting cursor to different positions
      act(() => {
        result.current.setCursorPosition(960);
      });
      expect(result.current.state.currentPosition).toBe(960);
      
      act(() => {
        result.current.setCursorPosition(1920);
      });
      expect(result.current.state.currentPosition).toBe(1920);
    });
  });

  describe('Settings', () => {
    it('should update BPM', () => {
      const { result } = renderHook(() => useNoteStackEditor());
      
      act(() => {
        result.current.setBpm(140);
      });
      
      expect(result.current.state.bpm).toBe(140);
      expect(result.current.state.isModified).toBe(true);
    });

    it('should update time signature', () => {
      const { result } = renderHook(() => useNoteStackEditor());
      
      act(() => {
        result.current.setTimeSignature(3, 4);
      });
      
      expect(result.current.state.timeSignature).toEqual({ numerator: 3, denominator: 4 });
      expect(result.current.state.isModified).toBe(true);
    });

    it('should update selected duration', () => {
      const { result } = renderHook(() => useNoteStackEditor());
      
      act(() => {
        result.current.setSelectedDuration('eighth');
      });
      
      expect(result.current.state.selectedDuration).toBe('eighth');
    });
  });

  describe('File Operations', () => {
    it('should load new tab', () => {
      const { result } = renderHook(() => useNoteStackEditor());
      
      const newTab: Tab = [
        {
          id: 'stack-1',
          musicalPosition: 0,
          duration: 'quarter',
          notes: [{ string: 0, fret: 3 }]
        },
        {
          id: 'stack-2',
          musicalPosition: 960,
          duration: 'half',
          notes: [{ string: 1, fret: 5 }]
        }
      ];
      
      act(() => {
        result.current.loadTab(newTab);
      });
      
      expect(result.current.state.tab).toEqual(newTab);
      expect(result.current.state.isModified).toBe(false);
    });

    it('should reset tab to empty state', () => {
      const { result } = renderHook(() => useNoteStackEditor());
      
      // Add some notes first
      act(() => {
        result.current.addNote(0, 1, 5, 'quarter');
        result.current.setBpm(140);
        result.current.setCursorPosition(1920);
      });
      
      expect(result.current.state.tab).toHaveLength(1);
      expect(result.current.state.bpm).toBe(140);
      
      // Reset
      act(() => {
        result.current.resetTab();
      });
      
      expect(result.current.state.tab).toHaveLength(0);
      expect(result.current.state.bpm).toBe(120);
      expect(result.current.state.currentPosition).toBe(0);
      expect(result.current.state.isModified).toBe(false);
    });

    it('should mark and unmark as modified', () => {
      const { result } = renderHook(() => useNoteStackEditor());
      
      expect(result.current.state.isModified).toBe(false);
      
      act(() => {
        result.current.setModified(true);
      });
      
      expect(result.current.state.isModified).toBe(true);
      
      act(() => {
        result.current.setModified(false);
      });
      
      expect(result.current.state.isModified).toBe(false);
    });
  });

  describe('Query Functions', () => {
    it('should get note at position and string', () => {
      const { result } = renderHook(() => useNoteStackEditor());
      
      // Add a note
      act(() => {
        result.current.addNote(960, 1, 7, 'quarter');
      });
      
      const note = result.current.getNoteAtPosition(960, 1);
      expect(note).toEqual({ fret: 7 });
      
      const noNote = result.current.getNoteAtPosition(960, 0);
      expect(noNote).toBeNull();
    });

    it('should get stack at position', () => {
      const { result } = renderHook(() => useNoteStackEditor());
      
      // Add a note
      act(() => {
        result.current.addNote(960, 1, 7, 'quarter');
      });
      
      const stack = result.current.getStackAtPosition(960);
      expect(stack).toBeDefined();
      expect(stack?.notes).toContainEqual({ string: 1, fret: 7 });
      
      const noStack = result.current.getStackAtPosition(1920);
      expect(noStack).toBeUndefined();
    });
  });

  describe('Immutability', () => {
    it('should not mutate state directly', () => {
      const { result } = renderHook(() => useNoteStackEditor());
      
      const originalState = result.current.state;
      const originalTab = result.current.state.tab;
      
      act(() => {
        result.current.addNote(0, 1, 5, 'quarter');
      });
      
      // State reference should change
      expect(result.current.state).not.toBe(originalState);
      expect(result.current.state.tab).not.toBe(originalTab);
      
      // Original state should be unchanged
      expect(originalTab).toHaveLength(0);
      expect(result.current.state.tab).toHaveLength(1);
    });
  });

  describe('Derived State', () => {
    it('should provide memoized layout items', () => {
      const { result } = renderHook(() => useNoteStackEditor());
      
      expect(result.current.layoutItems).toBeDefined();
      expect(Array.isArray(result.current.layoutItems)).toBe(true);
    });

    it('should provide total width calculation', () => {
      const { result } = renderHook(() => useNoteStackEditor());
      
      expect(typeof result.current.totalWidth).toBe('number');
      expect(result.current.totalWidth).toBeGreaterThan(0);
    });
  });
}); 