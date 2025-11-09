/**
 * Audio Processing Utilities
 * Functions for processing audio data for real-time streaming
 */

/**
 * Convert Float32 audio samples to 16-bit PCM format
 * @param float32Array - Float32Array of audio samples (-1.0 to 1.0)
 * @returns ArrayBuffer containing 16-bit PCM data
 */
export function floatTo16BitPCM(float32Array: Float32Array): ArrayBuffer {
  const buffer = new ArrayBuffer(float32Array.length * 2)
  const view = new DataView(buffer)
  let offset = 0

  for (let i = 0; i < float32Array.length; i++, offset += 2) {
    // Clamp value between -1 and 1
    let s = Math.max(-1, Math.min(1, float32Array[i]))
    // Convert to 16-bit integer
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true)
  }

  return buffer
}

/**
 * Create AudioContext with fallback for older browsers
 */
export function createAudioContext(): AudioContext {
  const AudioContextClass =
    window.AudioContext || (window as any).webkitAudioContext

  if (!AudioContextClass) {
    throw new Error('AudioContext is not supported in this browser')
  }

  return new AudioContextClass()
}

/**
 * Get optimal audio constraints for speech recognition
 */
export function getAudioConstraints(): MediaStreamConstraints {
  return {
    audio: {
      channelCount: 1, // Mono
      sampleRate: 16000, // Common STT sample rate
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
  }
}

