/**
 * Speech Recognition Utilities
 * Wrapper around Web Speech API with better error handling
 */

export interface SpeechRecognitionOptions {
  continuous?: boolean
  interimResults?: boolean
  lang?: string
}

export class SpeechRecognitionService {
  private recognition: any = null
  private isSupported: boolean = false

  constructor() {
    // Check for browser support
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition

    this.isSupported = !!SpeechRecognition

    if (this.isSupported) {
      this.recognition = new SpeechRecognition()
      this.recognition.continuous = true
      this.recognition.interimResults = true
      this.recognition.lang = 'en-US'
    }
  }

  /**
   * Check if speech recognition is supported
   */
  isAvailable(): boolean {
    return this.isSupported
  }

  /**
   * Start speech recognition
   */
  start(
    onResult: (transcript: string, isFinal: boolean) => void,
    onError?: (error: string) => void,
    options?: SpeechRecognitionOptions
  ): void {
    if (!this.isSupported || !this.recognition) {
      onError?.('Speech recognition is not supported in this browser')
      return
    }

    // Configure options
    if (options) {
      if (options.continuous !== undefined) {
        this.recognition.continuous = options.continuous
      }
      if (options.interimResults !== undefined) {
        this.recognition.interimResults = options.interimResults
      }
      if (options.lang) {
        this.recognition.lang = options.lang
      }
    }

    // Set up event handlers
    this.recognition.onresult = (event: any) => {
      let interimTranscript = ''
      let finalTranscript = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' '
        } else {
          interimTranscript += transcript
        }
      }

      if (finalTranscript) {
        onResult(finalTranscript.trim(), true)
      } else if (interimTranscript) {
        onResult(interimTranscript.trim(), false)
      }
    }

    this.recognition.onerror = (event: any) => {
      let errorMessage = 'Speech recognition error'
      if (event.error === 'no-speech') {
        errorMessage = 'No speech detected'
      } else if (event.error === 'audio-capture') {
        errorMessage = 'No microphone found'
      } else if (event.error === 'not-allowed') {
        errorMessage = 'Microphone permission denied'
      } else if (event.error) {
        errorMessage = `Error: ${event.error}`
      }
      onError?.(errorMessage)
    }

    this.recognition.onend = () => {
      // Auto-restart if continuous mode
      if (this.recognition.continuous) {
        try {
          this.recognition.start()
        } catch (e) {
          // Already started or stopped
        }
      }
    }

    try {
      this.recognition.start()
    } catch (error) {
      onError?.('Failed to start speech recognition')
    }
  }

  /**
   * Stop speech recognition
   */
  stop(): void {
    if (this.recognition) {
      this.recognition.stop()
    }
  }

  /**
   * Abort speech recognition
   */
  abort(): void {
    if (this.recognition) {
      this.recognition.abort()
    }
  }
}

// Singleton instance
let speechRecognitionInstance: SpeechRecognitionService | null = null

/**
 * Get speech recognition service instance
 */
export function getSpeechRecognition(): SpeechRecognitionService {
  if (!speechRecognitionInstance) {
    speechRecognitionInstance = new SpeechRecognitionService()
  }
  return speechRecognitionInstance
}

