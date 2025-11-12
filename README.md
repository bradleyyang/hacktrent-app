# Sign Language Translator Web App

Backend server that this frontend sends requests to: https://github.com/DanielHe09/ASL_to_text

A modern web application that translates between spoken words and sign language in both directions.

## Features

### Speech to Text Language
- Record audio using your microphone
- View transcribed text

### Sign Language to Speech
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

3. Open your browser and navigate to the URL shown in the terminal

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Project Structure

```
src/
  ├── components/
  │   ├── SpeechToText.tsx    # Speech to text language component
  │   ├── SpeechToText.css
  │   ├── SignToSpeech.tsx    # Sign language to speech component
  │   └── SignToSpeech.css
  ├── App.tsx                  # Main app component
  ├── App.css
  ├── main.tsx                 # Entry point
  └── index.css                # Global styles
```

## Browser Permissions

The app requires:
- **Microphone access** for speech-to-text translation
- **Camera access** for sign-to-speech translation

Make sure to grant these permissions when prompted by your browser.
