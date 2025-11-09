import { useState, useRef, useEffect } from "react";
import {
    floatTo16BitPCM,
    createAudioContext,
    getAudioConstraints,
} from "../utils/audioProcessing";
import "./SpeechToText.css";

interface SpeechToTextProps {
    wsUrl?: string;
}

function SpeechToText({
    wsUrl = "ws://localhost:8000/ws",
}: SpeechToTextProps = {}) {
    const [isRecording, setIsRecording] = useState(false);
    const [transcribedText, setTranscribedText] = useState("");

    const audioContextRef = useRef<AudioContext | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const audioChunksRef = useRef<Int16Array[]>([]);

    // const batchIntervalRef = useRef<NodeJS.Timer | null>(null); // ADDED
    const batchIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
        null
    );

    // ADDED
    async function sendAudioBatch(pcmData: Int16Array) {
        try {
            const res = await fetch("http://localhost:8000/stt-chunk", {
                method: "POST",
                headers: {
                    "Content-Type": "application/octet-stream",
                },
                body: pcmData.slice().buffer,
            });

            if (!res.ok) {
                console.error("Backend transcription error");
                return;
            }

            const { text } = await res.json();
            if (text) {
                setTranscribedText((prev) => prev + " " + text);
            }
        } catch (err) {
            console.error("Error sending audio batch:", err);
        }
    }

    // Start recording
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

            processorRef.current.onaudioprocess = (e) => {
                if (!isRecording) return;

                const inputData = e.inputBuffer.getChannelData(0);
                const buffer = new Float32Array(inputData);

                // const pcm16 = floatTo16BitPCM(buffer);
                // audioChunksRef.current.push(pcm16); // ✅ UNCOMMENTED

                const pcm16Buffer = floatTo16BitPCM(buffer);
                const pcm16 = new Int16Array(pcm16Buffer); // ✅ wrap
                audioChunksRef.current.push(pcm16);
            };

            // ✅ ADDED batching loop
            batchIntervalRef.current = setInterval(() => {
                const chunks = audioChunksRef.current;
                if (chunks.length === 0) return;

                const totalLength = chunks.reduce(
                    (sum, arr) => sum + arr.length,
                    0
                );
                const merged = new Int16Array(totalLength);

                let offset = 0;
                for (const chunk of chunks) {
                    merged.set(chunk, offset);
                    offset += chunk.length;
                }

                audioChunksRef.current = []; // clear batch

                sendAudioBatch(merged);
            }, 300);

            setIsRecording(true);
        } catch (error) {
            console.error("Error accessing microphone:", error);
            alert("Unable to access microphone. Please check permissions.");
        }
    };

    // Stop recording
    const handleStopRecording = () => {
        setIsRecording(false);

        // ✅ stop batching timer
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

            if (isRecording) handleStopRecording();
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
