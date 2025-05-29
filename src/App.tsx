import { useState } from 'react'
import './App.css'
import TabViewer from './TabViewer'
import Fretboard from './Fretboard'
import Controls from './Controls'

// Initial tab data - each array represents a measure, each inner array represents a beat
const initialTabData = [
  // Measure 1
  [
    [null, null, 0],  // First beat
    [null, null, 2],  // Second beat
    [null, null, 4],  // Third beat
    [null, null, 5],  // Fourth beat
  ],
  // Measure 2
  [
    [null, null, 4],  // First beat
    [null, null, 2],  // Second beat
    [null, null, 0],  // Third beat
    [null, null, 0],  // Fourth beat
  ],
];

function App() {
  const [tabData, setTabData] = useState<(number | null)[][][]>(initialTabData);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<{ fret: number; stringIndex: number }[]>([]);
  const [tempo, setTempo] = useState<number>(120); // Default 120 BPM

  const updateTabData = (measureIndex: number, beatIndex: number, stringIndex: number, value: number | null) => {
    setTabData(prevData => {
      const newData = [...prevData];
      newData[measureIndex] = [...newData[measureIndex]];
      newData[measureIndex][beatIndex] = [...newData[measureIndex][beatIndex]];
      newData[measureIndex][beatIndex][stringIndex] = value;
      return newData;
    });
  };

  const handleNotesPlaying = (notes: { fret: number; stringIndex: number }[]) => {
    setCurrentlyPlaying(notes);
  };

  const handleTempoChange = (newTempo: number) => {
    setTempo(newTempo);
  };

  return (
    <div className="app-container">
      <h1>Strumstick Tab Viewer</h1>
      <div style={{ display: 'flex', gap: '2rem', flexDirection: 'column' }}>
        <div>
          <TabViewer 
            tabData={tabData} 
            onUpdateTab={updateTabData}
          />
          <Controls 
            tabData={tabData} 
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
