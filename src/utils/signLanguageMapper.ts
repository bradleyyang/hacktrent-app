/**
 * Sign Language Mapper
 * Maps text to sign language representations
 * This is a basic implementation that can be extended with:
 * - Backend API calls for accurate translations
 * - Video/animation libraries
 * - More comprehensive word mappings
 */

// Basic word-to-sign language mapping
// In production, this would be replaced with backend API calls or a comprehensive library
const signLanguageMap: Record<string, string> = {
  hello: '👋',
  hi: '👋',
  how: '🤔',
  are: '👉',
  you: '👆',
  thank: '🙏',
  thanks: '🙏',
  please: '🤲',
  yes: '👍',
  no: '👎',
  good: '👍',
  bad: '👎',
  morning: '🌅',
  afternoon: '☀️',
  evening: '🌆',
  night: '🌙',
  water: '💧',
  food: '🍽️',
  help: '🆘',
  stop: '✋',
  go: '👉',
  come: '👈',
  love: '❤️',
  happy: '😊',
  sad: '😢',
  angry: '😠',
  tired: '😴',
  hungry: '🍔',
  thirsty: '🥤',
  bathroom: '🚽',
  doctor: '👨‍⚕️',
  hospital: '🏥',
  home: '🏠',
  school: '🏫',
  work: '💼',
  friend: '👫',
  family: '👨‍👩‍👧‍👦',
  mother: '👩',
  father: '👨',
  sister: '👧',
  brother: '👦',
  // Numbers
  one: '1️⃣',
  two: '2️⃣',
  three: '3️⃣',
  four: '4️⃣',
  five: '5️⃣',
  six: '6️⃣',
  seven: '7️⃣',
  eight: '8️⃣',
  nine: '9️⃣',
  ten: '🔟',
}

/**
 * Converts text to sign language representation
 * @param text - The text to convert
 * @returns Sign language representation (emoji/text format)
 */
export function textToSignLanguage(text: string): string {
  if (!text || text.trim().length === 0) {
    return ''
  }

  // Normalize text: lowercase, remove punctuation
  const normalized = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .trim()

  // Split into words
  const words = normalized.split(/\s+/).filter((word) => word.length > 0)

  // Map each word to sign language
  const signs = words.map((word) => {
    // Check exact match first
    if (signLanguageMap[word]) {
      return signLanguageMap[word]
    }

    // Check if word contains a mapped word (for compound words)
    for (const [key, value] of Object.entries(signLanguageMap)) {
      if (word.includes(key)) {
        return value
      }
    }

    // Return first letter as fallback (can be improved)
    return word.charAt(0).toUpperCase()
  })

  return signs.join(' ')
}

/**
 * Converts text to sign language using backend API
 * This is the preferred method for production
 * @param text - The text to convert
 * @param apiUrl - Backend API URL
 * @returns Promise with sign language representation
 */
export async function textToSignLanguageAPI(
  text: string,
  apiUrl: string = '/api/text-to-sign'
): Promise<string> {
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`)
    }

    const data = await response.json()
    return data.sign_language || data.result || ''
  } catch (error) {
    console.error('Error calling sign language API:', error)
    // Fallback to local mapping
    return textToSignLanguage(text)
  }
}

/**
 * Get sign language video/animation URL from backend
 * @param text - The text to convert
 * @param apiUrl - Backend API URL
 * @returns Promise with video URL or animation data
 */
export async function getSignLanguageVideo(
  text: string,
  apiUrl: string = '/api/text-to-sign-video'
): Promise<string | null> {
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`)
    }

    const data = await response.json()
    return data.video_url || data.animation_url || null
  } catch (error) {
    console.error('Error getting sign language video:', error)
    return null
  }
}

