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
        <div className="header-content">
          <h1 className="app-title">
            <span className="title-icon">🤟</span>
            Sign Language Translator
          </h1>
          <nav className="nav-tabs">
            <button
              className={`mode-button ${mode === 'speech-to-sign' ? 'active' : ''}`}
              onClick={() => setMode('speech-to-sign')}
            >
              <span className="button-icon">🎤</span>
              Speech to Sign
            </button>
            <button
              className={`mode-button ${mode === 'sign-to-speech' ? 'active' : ''}`}
              onClick={() => setMode('sign-to-speech')}
            >
              <span className="button-icon">📹</span>
              Sign to Speech
            </button>
          </nav>
        </div>
      </header>

      <main className="app-main">
        {mode === 'speech-to-sign' ? (
          <SpeechToSign 
            wsUrl={import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws'}
            useBackendAPI={false}
          />
        ) : (
          <SignToSpeech />
        )}
      </main>

      <footer className="app-footer">
        <p>Ready for backend integration</p>
      </footer>
    </div>
  )
}

export default App

