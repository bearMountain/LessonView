import { useState, useRef } from 'react'
import './App.css'
import TabViewer from './TabViewer'
import Fretboard from './Fretboard'
import Controls from './Controls'
import type { ControlsRef } from './Controls'
import type { Note, NoteDuration, CursorPosition, TabData, TimePosition } from './types'
import { getLongestDuration } from './types'

// Start with empty tab data
const initialTabData: TabData = [];

function App() {
  const [tabData, setTabData] = useState<TabData>(initialTabData);
  const [cursorPosition, setCursorPosition] = useState<CursorPosition>({ timeIndex: 0, stringIndex: 2 }); // Start on Hi D string
  const [currentlyPlaying, setCurrentlyPlaying] = useState<{ fret: number; stringIndex: number }[]>([]);
  const [tempo, setTempo] = useState<number>(120); // Default 120 BPM
  const controlsRef = useRef<ControlsRef>(null);

  const addNote = (fret: number | null, duration: NoteDuration, type: 'note' | 'rest' = 'note') => {
    setTabData(prevData => {
      const newData = [...prevData];
      
      // Ensure we have a time position at the cursor location
      while (newData.length <= cursorPosition.timeIndex) {
        newData.push({
          notes: [],
          duration: 'quarter' // Default duration, will be updated
        });
      }
      
      const timePosition = newData[cursorPosition.timeIndex];
      const newNote: Note = {
        type,
        fret: type === 'rest' ? null : fret,
        duration,
        stringIndex: cursorPosition.stringIndex
      };
      
      // Remove any existing note on this string at this time position
      const filteredNotes = timePosition.notes.filter(note => note.stringIndex !== cursorPosition.stringIndex);
      
      // Add the new note
      const updatedNotes = [...filteredNotes, newNote];
      
      // Update the time position with the new note and longest duration
      newData[cursorPosition.timeIndex] = {
        notes: updatedNotes,
        duration: getLongestDuration(updatedNotes)
      };
      
      return newData;
    });
    
    // Don't automatically move cursor - let TabViewer control cursor movement explicitly
  };

  const moveCursor = (direction: 'left' | 'right' | 'up' | 'down') => {
    setCursorPosition(prev => {
      const newPosition = { ...prev };
      
      switch (direction) {
        case 'left':
          newPosition.timeIndex = Math.max(0, prev.timeIndex - 1);
          break;
        case 'right':
          newPosition.timeIndex = Math.min(tabData.length, prev.timeIndex + 1);
          break;
        case 'up':
          newPosition.stringIndex = Math.min(2, prev.stringIndex + 1); // Hi D is index 2
          break;
        case 'down':
          newPosition.stringIndex = Math.max(0, prev.stringIndex - 1); // Low D is index 0
          break;
      }
      
      return newPosition;
    });
  };

  const handleNotesPlaying = (notes: { fret: number; stringIndex: number }[]) => {
    setCurrentlyPlaying(notes);
  };

  const handleTempoChange = (newTempo: number) => {
    setTempo(newTempo);
  };

  const removeNote = () => {
    setTabData(prevData => {
      const newData = [...prevData];
      
      // If there's no time position at cursor, nothing to remove
      if (cursorPosition.timeIndex >= newData.length) {
        return prevData;
      }
      
      const timePosition = newData[cursorPosition.timeIndex];
      
      // Remove any existing note on this string at this time position
      const filteredNotes = timePosition.notes.filter(note => note.stringIndex !== cursorPosition.stringIndex);
      
      // Update the time position with filtered notes
      newData[cursorPosition.timeIndex] = {
        notes: filteredNotes,
        duration: getLongestDuration(filteredNotes)
      };
      
      return newData;
    });
  };

  return (
    <div className="app-container">
      <h1>Strumstick Tab Viewer</h1>
      <div style={{ display: 'flex', gap: '2rem', flexDirection: 'column' }}>
        <div>
          <TabViewer 
            tabData={tabData} 
            cursorPosition={cursorPosition}
            onAddNote={addNote}
            onRemoveNote={removeNote}
            onMoveCursor={moveCursor}
            onCursorClick={(timeIndex: number, stringIndex: number) => setCursorPosition({ timeIndex, stringIndex })}
            onPlayPreviewNote={(fret: number, stringIndex: number) => controlsRef.current?.playPreviewNote(fret, stringIndex)}
          />
          <Controls 
            ref={controlsRef}
            tabData={tabData} 
            cursorPosition={cursorPosition}
            onNotesPlaying={handleNotesPlaying}
            tempo={tempo}
            onTempoChange={handleTempoChange}
          />
        </div>
        <Fretboard currentlyPlaying={currentlyPlaying} />
      </div>
    </div>
  )
}

export default App
