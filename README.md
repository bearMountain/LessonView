# Strumstick Tab Viewer

An interactive strumstick tablature viewer and editor with advanced note duration support, visual stems, and realistic audio playback.

## Features

### Enhanced Tab Editing
- **Note Duration Support**: Create tabs with different note durations (whole, half, quarter, eighth, sixteenth notes)
- **Visual Note Stems**: Notes display with proper stems and flags just like sheet music
- **Duration Selector**: Easy-to-use radio button interface for selecting note durations
- **Real-time Editing**: Click on any fret position to edit notes in-place

### Visual Elements
- **Note Heads**: Different visual styles for different durations
  - Whole notes: Open circles with no stems
  - Half notes: Open circles with stems
  - Quarter notes: Filled circles with stems
  - Eighth notes: Filled circles with stems and single flags
  - Sixteenth notes: Filled circles with stems and double flags
- **String Layout**: Three-string strumstick layout (Hi D, A, Low D) with simplified notation
- **Measure Separators**: Clear visual separation between measures

### Audio Playback
- **Realistic Guitar Sound**: Multi-layer synthesis with:
  - Sawtooth wave for brightness
  - Square wave harmonics for metallic string character
  - Triangle wave sub-harmonics for body resonance
  - Pick noise simulation
- **Audio Effects Chain**:
  - Reverb for spatial depth
  - Distortion for harmonic saturation
  - Chorus for richness
  - Vibrato for realism
  - Low-pass filtering for natural frequency response
- **Duration-Aware Playback**: Note sustain scales with duration values
- **Tempo Control**: Adjustable BPM (30-300) with real-time tempo changes

### Interactive Fretboard
- **Visual Feedback**: Red dots show finger positions during playback
- **Precise Positioning**: Accurate fret positioning based on actual strumstick measurements
- **Real-time Updates**: Fretboard updates dynamically during playback

## Usage

### Editing Notes
1. Select a note duration using the radio buttons at the top
2. Click on any fret input field in the tablature
3. Enter a fret number (0-12) or leave blank for no note
4. The note will automatically use the selected duration and display appropriate visual elements

### Note Durations
- **Whole Note (4 beats)**: No stem, open circle
- **Half Note (2 beats)**: Stem, open circle
- **Quarter Note (1 beat)**: Stem, filled circle
- **Eighth Note (0.5 beats)**: Stem with single flag, filled circle
- **Sixteenth Note (0.25 beats)**: Stem with double flag, filled circle

### Playback Controls
- **Play/Pause**: Start or stop playback
- **Tempo Control**: Adjust playback speed (BPM)
- **Visual Feedback**: Watch the fretboard light up with current finger positions

## Technical Implementation

### Data Structure
```typescript
interface Note {
  fret: number | null;
  duration: NoteDuration;
}

type NoteDuration = 'whole' | 'half' | 'quarter' | 'eighth' | 'sixteenth';
type TabData = Note[][][][]; // [measure][beat][string][note]
```

### Duration Values
- Whole: 4 quarter note beats
- Half: 2 quarter note beats  
- Quarter: 1 quarter note beat
- Eighth: 0.5 quarter note beats
- Sixteenth: 0.25 quarter note beats

### Audio Synthesis
The audio engine uses Tone.js with a sophisticated multi-layer approach:
- **Main Synth**: Sawtooth oscillator for primary tone
- **Harmonic Layer**: Square wave for upper harmonics
- **Sub Layer**: Triangle wave for body resonance
- **Effects Chain**: Reverb → Distortion → Chorus → Vibrato → Filter

## Development

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation
```bash
npm install
```

### Development Server
```bash
npm run dev
```

### Build
```bash
npm run build
```

## Technologies Used
- **React 18** with TypeScript
- **Vite** for build tooling
- **Tone.js** for audio synthesis
- **SVG** for tablature rendering
- **CSS3** for styling

## Future Enhancements
- Multiple notes per beat (chords)
- Triplets and other complex rhythms
- Export to MIDI/MusicXML
- Import from standard tablature formats
- Advanced audio effects
- Multiple instrument support

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Run the development server:**
   ```bash
   npm run dev
   ```
3. **Open your browser:**
   Visit [http://localhost:5173](http://localhost:5173) to view the app.

## Project Structure
- `src/TabViewer.tsx` — Tab grid display
- `src/Fretboard.tsx` — SVG fretboard visualization
- `src/Controls.tsx` — Playback controls

---

This is an early prototype. More features and polish coming soon!

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config({
  extends: [
    // Remove ...tseslint.configs.recommended and replace with this
    ...tseslint.configs.recommendedTypeChecked,
    // Alternatively, use this for stricter rules
    ...tseslint.configs.strictTypeChecked,
    // Optionally, add this for stylistic rules
    ...tseslint.configs.stylisticTypeChecked,
  ],
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config({
  plugins: {
    // Add the react-x and react-dom plugins
    'react-x': reactX,
    'react-dom': reactDom,
  },
  rules: {
    // other rules...
    // Enable its recommended typescript rules
    ...reactX.configs['recommended-typescript'].rules,
    ...reactDom.configs.recommended.rules,
  },
})
```
