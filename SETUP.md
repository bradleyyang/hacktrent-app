# Sign Language Translator - Setup Guide

## Architecture Overview

This application implements a bidirectional sign language translator with two main flows:

### 1. Speech → Sign Language (ASL)
- **Frontend**: Uses `react-speech-recognition` library (wraps Web Speech API)
- **Process**: Speech → Text → Sign Language Representation
- **Libraries Used**:
  - `react-speech-recognition`: Real-time speech recognition
  - Local sign language mapper (fallback)
  - Backend API integration (optional)

### 2. Sign Language → Speech
- **Frontend**: WebSocket-based real-time video streaming
- **Process**: Camera → Video Frames → Backend ML Model → Text → Speech
- **Libraries Used**:
  - Native WebSocket API
  - Web Speech API (for TTS)
  - MediaDevices API (camera access)

## Installation

```bash
npm install
```

## Key Libraries

### Frontend Dependencies

1. **react-speech-recognition** (`^3.10.0`)
   - Purpose: Speech-to-text recognition
   - Why: Provides React hooks for Web Speech API with better error handling
   - Browser Support: Chrome, Edge, Safari (Web Speech API support required)

2. **React & TypeScript**
   - Modern React with TypeScript for type safety

## Project Structure

```
src/
├── components/
│   ├── SpeechToSign.tsx          # Speech → ASL component
│   ├── SpeechToSign.css
│   ├── SignToSpeech.tsx           # ASL → Speech component (WebSocket)
│   ├── SignToSpeech.css
│   └── SpeechRecognitionProvider.tsx  # Provider wrapper
├── utils/
│   ├── signLanguageMapper.ts     # Text to sign language conversion
│   └── speechRecognition.ts      # Speech recognition utilities
├── App.tsx                        # Main app component
└── main.tsx                       # Entry point
```

## How It Works

### Speech-to-Sign Flow

1. User clicks "Start Listening"
2. `react-speech-recognition` captures audio via microphone
3. Speech is transcribed to text in real-time
4. Text is converted to sign language using:
   - Backend API (if `useBackendAPI={true}`)
   - Local mapping (fallback)
5. Sign language is displayed (emoji/text or video)

**Key Features**:
- Continuous listening mode
- Real-time transcription
- Interim results display
- Automatic sign language conversion

### Sign-to-Speech Flow

1. User clicks "Start Streaming"
2. Camera feed is captured
3. Frames are extracted at configurable FPS (1-15 fps)
4. Motion detection filters redundant frames
5. Frames sent to backend via WebSocket
6. Backend processes with ML model
7. Text transcript received
8. Audio played automatically (if backend provides audio URL)

**Key Features**:
- Real-time WebSocket streaming
- Motion detection to reduce bandwidth
- Frame optimization (320px width, JPEG compression)
- Automatic audio playback queue

## Configuration

### Speech-to-Sign Component

```tsx
<SpeechToSign 
  useBackendAPI={true}  // Use backend API instead of local mapping
  apiUrl="/api/text-to-sign"  // Backend API endpoint
/>
```

### Sign-to-Speech Component

```tsx
<SignToSpeech
  wsUrl="wss://your-backend.com/ws/signstream"  // WebSocket URL
  initialFps={6}  // Frames per second (1-15)
  sendMotionThreshold={0.02}  // Motion sensitivity
  enableTTS={true}  // Enable text-to-speech
/>
```

## Backend Integration Points

### Speech-to-Sign Backend API

**Endpoint**: `POST /api/text-to-sign`

**Request**:
```json
{
  "text": "Hello, how are you?"
}
```

**Response**:
```json
{
  "sign_language": "👋 👋 🤚 👋 👋",
  "video_url": "https://..." // optional
}
```

### Sign-to-Speech WebSocket

**Connection**: `wss://your-backend.com/ws/signstream`

**Client → Server**:
1. JSON metadata: `{ "type": "frame", "ts": 1234567890, "width": 320, "height": 240 }`
2. Binary: JPEG image data (ArrayBuffer)

**Server → Client**:
```json
{
  "type": "transcript",
  "text": "Hello, how are you?",
  "sign_language": "👋 👋 🤚 👋 👋",  // optional
  "audio_url": "https://..."  // optional, for TTS
}
```

## Browser Requirements

### Speech Recognition (Speech-to-Sign)
- Chrome/Edge: Full support
- Safari: Full support (macOS/iOS)
- Firefox: Not supported (Web Speech API not available)

### Camera Access (Sign-to-Speech)
- All modern browsers support MediaDevices API
- HTTPS required (or localhost for development)

### WebSocket
- All modern browsers support WebSocket API

## Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Best Practices

1. **Speech Recognition**:
   - Always check `browserSupportsSpeechRecognition` before using
   - Request microphone permissions gracefully
   - Handle errors (no-speech, permission denied, etc.)

2. **Camera Access**:
   - Request camera permissions with clear messaging
   - Handle permission denial gracefully
   - Stop camera when component unmounts

3. **WebSocket**:
   - Implement reconnection logic
   - Handle connection errors
   - Clean up on component unmount

4. **Performance**:
   - Use motion detection to reduce frame sending
   - Compress images before sending
   - Throttle FPS based on network conditions

## Future Enhancements

- [ ] Add more comprehensive sign language vocabulary
- [ ] Integrate sign language video/animation library
- [ ] Add offline mode support
- [ ] Implement caching for common phrases
- [ ] Add multiple language support
- [ ] Improve error handling and user feedback
- [ ] Add analytics and usage tracking

## Troubleshooting

### Speech Recognition Not Working
- Check browser compatibility (Chrome/Edge/Safari)
- Ensure microphone permissions are granted
- Check if Web Speech API is enabled in browser settings

### Camera Not Accessing
- Check browser permissions
- Ensure HTTPS (or localhost)
- Check if camera is being used by another application

### WebSocket Connection Issues
- Verify backend is running
- Check WebSocket URL is correct
- Check network/firewall settings
- Verify backend accepts WebSocket connections

## License

MIT

