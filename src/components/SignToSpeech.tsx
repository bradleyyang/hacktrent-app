import { useState, useRef, useEffect } from 'react'
import './SignToSpeech.css'

function SignToSpeech() {
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [detectedSign, setDetectedSign] = useState('')
  const [translatedText, setTranslatedText] = useState('')
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const handleStartCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        } 
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setIsCameraActive(true)
      }
    } catch (error) {
      console.error('Error accessing camera:', error)
      alert('Unable to access camera. Please check permissions.')
    }
  }

  const handleStopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setIsCameraActive(false)
    setDetectedSign('')
    setTranslatedText('')
  }

  const handleCaptureFrame = () => {
    if (videoRef.current && isCameraActive) {
      // TODO: Capture frame and send to backend for sign language recognition
      const canvas = document.createElement('canvas')
      canvas.width = videoRef.current.videoWidth
      canvas.height = videoRef.current.videoHeight
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0)
        const imageData = canvas.toDataURL('image/jpeg')
        console.log('Frame captured:', imageData)
        
        // Placeholder: Simulate sign language detection
        setDetectedSign('👋 👋 🤚 👋 👋')
        setTranslatedText('Hello, how are you?')
      }
    }
  }

  const handlePlayAudio = () => {
    if (translatedText) {
      // TODO: Use text-to-speech API or backend service
      const utterance = new SpeechSynthesisUtterance(translatedText)
      utterance.onstart = () => setIsPlayingAudio(true)
      utterance.onend = () => setIsPlayingAudio(false)
      speechSynthesis.speak(utterance)
    }
  }

  const handleStopAudio = () => {
    speechSynthesis.cancel()
    setIsPlayingAudio(false)
  }

  const handleClear = () => {
    setDetectedSign('')
    setTranslatedText('')
  }

  // Auto-capture mode (optional - can be enabled via toggle)
  useEffect(() => {
    if (isCameraActive) {
      const interval = setInterval(() => {
        // Auto-capture every 2 seconds for continuous recognition
        // handleCaptureFrame()
      }, 2000)
      return () => clearInterval(interval)
    }
  }, [isCameraActive])

  return (
    <div className="sign-to-speech">
      <div className="translation-card camera-card">
        <div className="card-header">
          <h2>Camera Input</h2>
          <p className="card-description">Show sign language to the camera for translation</p>
        </div>

        <div className="camera-container">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`camera-video ${isCameraActive ? 'active' : ''}`}
          />
          {!isCameraActive && (
            <div className="camera-placeholder">
              <span className="camera-icon">📹</span>
              <p>Camera feed will appear here</p>
            </div>
          )}
        </div>

        <div className="camera-controls">
          <button
            className={`camera-button ${isCameraActive ? 'stop' : 'start'}`}
            onClick={isCameraActive ? handleStopCamera : handleStartCamera}
          >
            <span className="button-icon">
              {isCameraActive ? '⏹️' : '📹'}
            </span>
            <span className="button-text">
              {isCameraActive ? 'Stop Camera' : 'Start Camera'}
            </span>
          </button>

          <button
            className="capture-button"
            onClick={handleCaptureFrame}
            disabled={!isCameraActive}
          >
            <span className="button-icon">📸</span>
            <span className="button-text">Capture & Translate</span>
          </button>

          <button
            className="clear-button"
            onClick={handleClear}
            disabled={!detectedSign && !translatedText}
          >
            Clear
          </button>
        </div>
      </div>

      <div className="translation-card">
        <div className="card-header">
          <h2>Detected Sign Language</h2>
        </div>
        <div className="output-display sign-input">
          {detectedSign || (
            <span className="placeholder">Detected sign language will appear here...</span>
          )}
        </div>
      </div>

      <div className="translation-card">
        <div className="card-header">
          <h2>Translated Text</h2>
        </div>
        <div className="output-display text-output">
          {translatedText || (
            <span className="placeholder">Translated text will appear here...</span>
          )}
        </div>
      </div>

      <div className="translation-card">
        <div className="card-header">
          <h2>Audio Output</h2>
          <p className="card-description">Listen to the translated speech</p>
        </div>
        <div className="audio-output-controls">
          <button
            className={`play-audio-button ${isPlayingAudio ? 'playing' : ''}`}
            onClick={isPlayingAudio ? handleStopAudio : handlePlayAudio}
            disabled={!translatedText}
          >
            <span className="button-icon">
              {isPlayingAudio ? '⏹️' : '🔊'}
            </span>
            <span className="button-text">
              {isPlayingAudio ? 'Stop Audio' : 'Play Audio'}
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default SignToSpeech

