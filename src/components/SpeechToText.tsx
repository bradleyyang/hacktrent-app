import { useState, useRef, useEffect } from "react";
import {
    floatTo16BitPCM,
    createAudioContext,
    getAudioConstraints,
} from "../utils/audioProcessing";
import "./SpeechToText.css";

interface SpeechToTextProps {}

function resampleTo16kHz(
    buffer: Float32Array,
    originalSampleRate: number
): Float32Array {
    const targetSampleRate = 16000;
    const ratio = originalSampleRate / targetSampleRate;
    const newLength = Math.round(buffer.length / ratio);
    const resampled = new Float32Array(newLength);
    let offsetResult = 0;
    let offsetBuffer = 0;

    while (offsetResult < newLength) {
        const nextOffsetBuffer = Math.round((offsetResult + 1) * ratio);
        // Simple linear interpolation
        let accum = 0;
        let count = 0;
        for (
            let i = offsetBuffer;
            i < nextOffsetBuffer && i < buffer.length;
            i++
        ) {
            accum += buffer[i];
            count++;
        }
        resampled[offsetResult] = accum / count;
        offsetResult++;
        offsetBuffer = nextOffsetBuffer;
    }

    return resampled;
}

function SpeechToText({}: SpeechToTextProps = {}) {
    const [isRecording, setIsRecording] = useState(false);
    const [transcribedText, setTranscribedText] = useState("");

    const isRecordingRef = useRef(false);
    const audioContextRef = useRef<AudioContext | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const audioChunksRef = useRef<Int16Array[]>([]);
    const batchIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
        null
    );

    function pcm16ToWav(pcmData: any, sampleRate = 16000) {
        const buffer = new ArrayBuffer(44 + pcmData.length * 2);
        const view = new DataView(buffer);

        // RIFF header
        view.setUint32(0, 0x52494646, false);
        view.setUint32(4, 36 + pcmData.length * 2, true);
        view.setUint32(8, 0x57415645, false);

        // fmt chunk
        view.setUint32(12, 0x666d7420, false);
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, 1, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * 2, true);
        view.setUint16(32, 2, true);
        view.setUint16(34, 16, true);

        // data chunk
        view.setUint32(36, 0x64617461, false);
        view.setUint32(40, pcmData.length * 2, true);

        let offset = 44;
        for (let i = 0; i < pcmData.length; i++, offset += 2) {
            view.setInt16(offset, pcmData[i], true);
        }

        return new Blob([new Uint8Array(buffer)], { type: "audio/wav" });
    }

    async function sendAudioBatch(pcmData: any) {
        try {
            const wavBlob = pcm16ToWav(pcmData);

            const formData = new FormData();
            formData.append("file", wavBlob, "audio.wav");

            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/transcribe`,
                {
                    method: "POST",
                    body: formData,
                }
            );

            if (!res.ok) {
                console.error("Backend transcription error");
                return;
            }

            const { transcription } = await res.json();
            if (transcription) {
                setTranscribedText((prev) => prev + " " + transcription);
            }
        } catch (err) {
            console.error("Error sending audio batch:", err);
        }
    }

    const handleStartRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia(
                getAudioConstraints()
            );
            streamRef.current = stream;

            audioContextRef.current = createAudioContext();
            const source =
                audioContextRef.current.createMediaStreamSource(stream);

            const bufferSize = 4096;
            processorRef.current =
                audioContextRef.current.createScriptProcessor(bufferSize, 1, 1);

            source.connect(processorRef.current);
            processorRef.current.connect(audioContextRef.current.destination);

            audioChunksRef.current = [];
            isRecordingRef.current = true;
            setIsRecording(true);

            processorRef.current.onaudioprocess = (e) => {
                if (!isRecordingRef.current) return;

                const inputData = e.inputBuffer.getChannelData(0);

                // Resample to 16 kHz
                const resampled = resampleTo16kHz(
                    inputData,
                    audioContextRef.current!.sampleRate
                );

                const pcm16Buffer = floatTo16BitPCM(resampled);
                const pcm16 = new Int16Array(pcm16Buffer);
                audioChunksRef.current.push(pcm16);
            };

            batchIntervalRef.current = setInterval(() => {
                const chunks = audioChunksRef.current;
                if (chunks.length === 0) return;

                const totalLength = chunks.reduce(
                    (sum, arr) => sum + arr.length,
                    0
                );
                if (totalLength < 16000) return; // at least 1 second of audio at 16kHz

                const merged = new Int16Array(totalLength);
                let offset = 0;
                for (const chunk of chunks) {
                    merged.set(chunk, offset);
                    offset += chunk.length;
                }

                audioChunksRef.current = [];
                sendAudioBatch(merged);
            }, 1000); // send every 1 second
        } catch (error) {
            console.error("Error accessing microphone:", error);
            alert("Unable to access microphone. Please check permissions.");
        }
    };

    const handleStopRecording = () => {
        isRecordingRef.current = false;
        setIsRecording(false);

        if (batchIntervalRef.current) {
            clearInterval(batchIntervalRef.current);
            batchIntervalRef.current = null;
        }

        if (processorRef.current) {
            processorRef.current.disconnect();
            processorRef.current = null;
        }

        if (audioContextRef.current) {
            audioContextRef.current.close().catch(console.error);
            audioContextRef.current = null;
        }

        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }
    };

    const toggleRecording = () => {
        if (isRecording) {
            handleStopRecording();
        } else {
            handleStartRecording();
        }
    };

    useEffect(() => {
        return () => {
            if (batchIntervalRef.current)
                clearInterval(batchIntervalRef.current);
            if (isRecordingRef.current) handleStopRecording();
        };
    }, []);

    // Fade in hook
    function useFadeIn(delay = 0) {
        const ref = useRef<HTMLDivElement>(null);
        const [isVisible, setIsVisible] = useState(false);

        useEffect(() => {
            const t = setTimeout(() => setIsVisible(true), delay);
            return () => clearTimeout(t);
        }, [delay]);

        return { ref, isVisible };
    }

    const conversationArea = useFadeIn(0);
    const inputArea = useFadeIn(200);

    return (
        <div className="speech-to-text-container">
            <div
                ref={conversationArea.ref}
                className={`conversation-area fade-in-element ${
                    conversationArea.isVisible ? "visible" : ""
                }`}
            >
                {transcribedText && (
                    <div className="message">
                        <div className="message-content">{transcribedText}</div>
                    </div>
                )}

                {!transcribedText && !isRecording && (
                    <div className="empty-state">
                        <p className="empty-text">
                            Click the button below to start recording
                        </p>
                    </div>
                )}

                {isRecording && (
                    <div className="recording-status">
                        <div className="recording-pulse"></div>
                        <span>Recording...</span>
                    </div>
                )}
            </div>

            <div
                ref={inputArea.ref}
                className={`input-area fade-in-element fade-in-delay-1 ${
                    inputArea.isVisible ? "visible" : ""
                }`}
            >
                <button
                    className={`record-button ${
                        isRecording ? "recording" : ""
                    }`}
                    onClick={toggleRecording}
                    aria-label={
                        isRecording ? "Stop recording" : "Start recording"
                    }
                >
                    {isRecording ? (
                        <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <rect x="6" y="6" width="12" height="12" rx="2" />
                        </svg>
                    ) : (
                        <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                            <line x1="12" y1="19" x2="12" y2="23" />
                            <line x1="8" y1="23" x2="16" y2="23" />
                        </svg>
                    )}
                </button>
            </div>
        </div>
    );
}

export default SpeechToText;
