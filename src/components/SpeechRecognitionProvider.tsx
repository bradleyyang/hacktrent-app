import { ReactNode } from 'react'
import { SpeechRecognitionProvider as SRProvider } from 'react-speech-recognition'

interface SpeechRecognitionProviderProps {
  children: ReactNode
}

/**
 * Wrapper component for react-speech-recognition provider
 * This is required for the useSpeechRecognition hook to work
 */
export function SpeechRecognitionProvider({ children }: SpeechRecognitionProviderProps) {
  return <SRProvider>{children}</SRProvider>
}

