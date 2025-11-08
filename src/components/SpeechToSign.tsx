import { useState, useRef } from 'react'
import './SpeechToSign.css'

function SpeechToSign() {
  const [isRecording, setIsRecording] = useState(false)
  const [transcribedText, setTranscribedText] = useState('')
  const [signLanguageOutput, setSignLanguageOutput] = useState('')
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' })
        // TODO: Send audioBlob to backend for transcription and sign language translation
        console.log('Audio recorded:', audioBlob)
        
        // Placeholder: Simulate transcription
        setTranscribedText('Hello, how are you?')
        setSignLanguageOutput('👋 👋 🤚 👋 👋')
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (error) {
      console.error('Error accessing microphone:', error)
      alert('Unable to access microphone. Please check permissions.')
    }
  }

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
      setIsRecording(false)
    }
  }

  const handleClear = () => {
    setTranscribedText('')
    setSignLanguageOutput('')
  }

  return (
    <div className="speech-to-sign">
      <div className="translation-card">
        <div className="card-header">
          <h2>Speech Input</h2>
          <p className="card-description">Speak into your microphone to translate to sign language</p>
        </div>

        <div className="audio-controls">
          <button
            className={`record-button ${isRecording ? 'recording' : ''}`}
            onClick={isRecording ? handleStopRecording : handleStartRecording}
            disabled={false}
          >
            <span className="record-icon">
              {isRecording ? '⏹️' : '🎤'}
            </span>
            <span className="record-text">
              {isRecording ? 'Stop Recording' : 'Start Recording'}
            </span>
            {isRecording && <span className="pulse-dot"></span>}
          </button>

          <button
            className="clear-button"
            onClick={handleClear}
            disabled={!transcribedText && !signLanguageOutput}
          >
            Clear
          </button>
        </div>

        {isRecording && (
          <div className="recording-indicator">
            <span className="recording-dot"></span>
            Recording in progress...
          </div>
        )}
      </div>

      <div className="translation-card">
        <div className="card-header">
          <h2>Transcribed Text</h2>
        </div>
        <div className="output-display text-output">
          {transcribedText || (
            <span className="placeholder">Transcribed text will appear here...</span>
          )}
        </div>
      </div>

      <div className="translation-card">
        <div className="card-header">
          <h2>Sign Language Output</h2>
          <p className="card-description">Visual representation of sign language</p>
        </div>
        <div className="output-display sign-output">
          {signLanguageOutput ? (
            <div className="sign-visualization">
              <div className="sign-animation-area">
                {/* Placeholder for sign language animation/video */}
                <div className="sign-placeholder">
                  {signLanguageOutput}
                </div>
              </div>
              <div className="sign-text">
                {signLanguageOutput}
              </div>
            </div>
          ) : (
            <span className="placeholder">Sign language translation will appear here...</span>
          )}
        </div>
      </div>
    </div>
  )
}

export default SpeechToSign

