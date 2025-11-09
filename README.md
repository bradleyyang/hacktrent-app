# Sign Language Translator Web App

Backend server that this frontend sends requests to: https://github.com/DanielHe09/ASL_to_text

A modern web application that translates between spoken words and sign language in both directions.

## Features

### Speech → Sign Language
- Record audio using your microphone
- View transcribed text
- See sign language visual representation

### Sign Language → Speech
- Use camera to capture sign language
- View detected sign language
- See translated text
- Listen to audio output using text-to-speech

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to the URL shown in the terminal (typically `http://localhost:5173`)

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Project Structure

```
src/
  ├── components/
  │   ├── SpeechToSign.tsx    # Speech to sign language component
  │   ├── SpeechToSign.css
  │   ├── SignToSpeech.tsx    # Sign language to speech component
  │   └── SignToSpeech.css
  ├── App.tsx                  # Main app component
  ├── App.css
  ├── main.tsx                 # Entry point
  └── index.css                # Global styles
```

## Backend Integration Points

The UI is ready for backend integration. Look for `TODO` comments in the code:

1. **SpeechToSign.tsx**: 
   - Line ~40: Send audio blob to backend for transcription and translation
   
2. **SignToSpeech.tsx**:
   - Line ~40: Send captured frame to backend for sign language recognition
   - Line ~60: Use backend API for text-to-speech (currently uses browser TTS)

## Browser Permissions

The app requires:
- **Microphone access** for speech-to-sign translation
- **Camera access** for sign-to-speech translation

Make sure to grant these permissions when prompted by your browser.

## Technologies Used

- React 18
- TypeScript
- Vite
- Modern CSS with CSS Variables

## License

MIT

