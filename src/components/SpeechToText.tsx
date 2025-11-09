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

    // Start recording
    const handleStartRecording = async () => {
        try {
            // Get microphone access
            const stream = await navigator.mediaDevices.getUserMedia(
                getAudioConstraints()
            );
            streamRef.current = stream;

            // Create AudioContext
            audioContextRef.current = createAudioContext();
            const source =
                audioContextRef.current.createMediaStreamSource(stream);

            // Create ScriptProcessorNode for audio processing
            const bufferSize = 4096;
            processorRef.current =
                audioContextRef.current.createScriptProcessor(bufferSize, 1, 1);

            source.connect(processorRef.current);
            processorRef.current.connect(audioContextRef.current.destination);

            // Clear previous chunks
            audioChunksRef.current = [];

            // Process audio chunks
            processorRef.current.onaudioprocess = (e) => {
                if (!isRecording) {
                    return;
                }

                const inputData = e.inputBuffer.getChannelData(0);
                const buffer = new Float32Array(inputData);

                // Convert to 16-bit PCM and store
                const pcm16 = floatTo16BitPCM(buffer);
                // audioChunksRef.current.push(pcm16);
            };

            setIsRecording(true);
        } catch (error) {
            console.error("Error accessing microphone:", error);
            alert("Unable to access microphone. Please check permissions.");
        }
    };

    // Stop recording
    const handleStopRecording = () => {
        setIsRecording(false);

        // Disconnect audio processing
        if (processorRef.current) {
            processorRef.current.disconnect();
            processorRef.current = null;
        }

        // Close audio context
        if (audioContextRef.current) {
            audioContextRef.current.close().catch(console.error);
            audioContextRef.current = null;
        }

        // Stop media stream
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }

        // TODO: Send audioChunksRef.current to backend
        console.log("Audio recorded, ready to send to backend:", audioChunksRef.current.length, "chunks");
    };

    const toggleRecording = () => {
        if (isRecording) {
            handleStopRecording();
        } else {
            handleStartRecording();
        }
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (isRecording) {
                handleStopRecording();
            }
        };
    }, []);

    return (
        <div className="speech-to-text-container">
            <div className="conversation-area">
                {transcribedText && (
                    <div className="message">
                        <div className="message-content">{transcribedText}</div>
                    </div>
                )}
                
                {!transcribedText && !isRecording && (
                    <div className="empty-state">
                        <p className="empty-text">Click the button below to start recording</p>
                    </div>
                )}

                {isRecording && (
                    <div className="recording-status">
                        <div className="recording-pulse"></div>
                        <span>Recording...</span>
                    </div>
                )}
            </div>

            <div className="input-area">
                <button
                    className={`record-button ${isRecording ? "recording" : ""}`}
                    onClick={toggleRecording}
                    aria-label={isRecording ? "Stop recording" : "Start recording"}
                >
                    {isRecording ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="6" y="6" width="12" height="12" rx="2" />
                        </svg>
                    ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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