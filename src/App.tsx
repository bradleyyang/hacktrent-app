import { useState } from 'react'
import SpeechToSign from './components/SpeechToSign'
import SignToSpeech from './components/SignToSpeech'
import './App.css'

type Mode = 'speech-to-sign' | 'sign-to-speech'

function App() {
  const [mode, setMode] = useState<Mode>('speech-to-sign')

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">
          <span className="title-icon">🤟</span>
          Sign Language Translator
        </h1>
        <p className="app-subtitle">Bridge the gap between speech and sign language</p>
      </header>

      <div className="mode-selector">
        <button
          className={`mode-button ${mode === 'speech-to-sign' ? 'active' : ''}`}
          onClick={() => setMode('speech-to-sign')}
        >
          <span className="button-icon">🎤</span>
          Speech → Sign Language
        </button>
        <button
          className={`mode-button ${mode === 'sign-to-speech' ? 'active' : ''}`}
          onClick={() => setMode('sign-to-speech')}
        >
          <span className="button-icon">📹</span>
          Sign Language → Speech
        </button>
      </div>

      <main className="app-main">
        {mode === 'speech-to-sign' ? <SpeechToSign /> : <SignToSpeech />}
      </main>

      <footer className="app-footer">
        <p>Ready for backend integration</p>
      </footer>
    </div>
  )
}

export default App

