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
    const [status, setStatus] = useState("idle");
    const [connectionStatus, setConnectionStatus] = useState<
        "disconnected" | "connecting" | "connected"
    >("disconnected");

    const wsRef = useRef<WebSocket | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    // Connect WebSocket
    const connectWebSocket = () => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            return;
        }

        setConnectionStatus("connecting");
        setStatus("connecting...");

        try {
            wsRef.current = new WebSocket(wsUrl);
            wsRef.current.binaryType = "arraybuffer";

            wsRef.current.onopen = () => {
                console.log("WebSocket connected");
                setConnectionStatus("connected");
                setStatus("connected");
            };

            wsRef.current.onmessage = (event) => {
                try {
                    // Handle JSON messages (transcripts)
                    if (typeof event.data === "string") {
                        const data = JSON.parse(event.data);
                        if (data.text) {
                            // Append new text to existing transcript
                            setTranscribedText((prev) => {
                                return prev ? `${prev} ${data.text}` : data.text;
                            });
                        } else if (data.transcript) {
                            // Handle full transcript updates
                            setTranscribedText(data.transcript);
                        } else if (data.type === "info") {
                            setStatus(data.message || "info");
                        }
                    }
                } catch (e) {
                    console.warn("Error parsing WebSocket message:", e);
                }
            };

            wsRef.current.onerror = (err) => {
                console.error("WebSocket error:", err);
                setConnectionStatus("disconnected");
                setStatus("connection error");
            };

            wsRef.current.onclose = () => {
                console.log("WebSocket closed");
                setConnectionStatus("disconnected");
                setStatus("disconnected");
                // Attempt to reconnect if recording is still active
                if (isRecording) {
                    setTimeout(() => {
                        connectWebSocket();
                    }, 1000);
                }
            };
        } catch (err) {
            console.error("Failed to connect WebSocket:", err);
            setConnectionStatus("disconnected");
            setStatus("connection failed");
        }
    };

    // Start real-time audio streaming
    const handleStartRecording = async () => {
        try {
            setStatus("requesting microphone access...");

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
            // Note: ScriptProcessorNode is deprecated but widely supported
            // For production, consider using AudioWorkletNode instead
            const bufferSize = 4096;
            processorRef.current =
                audioContextRef.current.createScriptProcessor(bufferSize, 1, 1);

            source.connect(processorRef.current);
            processorRef.current.connect(audioContextRef.current.destination);

            // Process audio chunks
            processorRef.current.onaudioprocess = (e) => {
                if (
                    !isRecording ||
                    !wsRef.current ||
                    wsRef.current.readyState !== WebSocket.OPEN
                ) {
                    return;
                }

                const inputData = e.inputBuffer.getChannelData(0);
                const buffer = new Float32Array(inputData);

                // Convert to 16-bit PCM
                const pcm16 = floatTo16BitPCM(buffer);

                // Send via WebSocket
                try {
                    wsRef.current.send(pcm16);
                } catch (err) {
                    console.error("Error sending audio data:", err);
                }
            };

            // Connect WebSocket
            connectWebSocket();

            setIsRecording(true);
            setStatus("recording...");
        } catch (error) {
            console.error("Error accessing microphone:", error);
            setStatus("microphone error");
            alert("Unable to access microphone. Please check permissions.");
        }
    };

    // Stop recording
    const handleStopRecording = () => {
        setIsRecording(false);
        setStatus("stopped");

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

        // Close WebSocket
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }

        setConnectionStatus("disconnected");
    };

    const handleClear = () => {
        setTranscribedText("");
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            handleStopRecording();
        };
    }, []);

    return (
        <div className="speech-to-text">
            <div className="translation-card">
                <div className="card-header">
                    <h2>Record Speech</h2>
                    <p className="card-description">
                        Click to start recording and get real-time transcription
                    </p>
                </div>

                <div className="audio-controls">
                    <button
                        className={`record-button ${
                            isRecording ? "recording" : ""
                        }`}
                        onClick={
                            isRecording
                                ? handleStopRecording
                                : handleStartRecording
                        }
                    >
                        <span className="record-icon">
                            {isRecording ? "⏹️" : "🎤"}
                        </span>
                        <span className="record-text">
                            {isRecording ? "Stop Recording" : "Start Recording"}
                        </span>
                        {isRecording && <span className="pulse-dot"></span>}
                    </button>

                    <button
                        className="clear-button"
                        onClick={handleClear}
                        disabled={!transcribedText}
                    >
                        Clear
                    </button>
                </div>

                {(isRecording || status !== "idle") && (
                    <div className="status-display">
                        <span className="status-label">Status:</span>
                        <span
                            className={`status-value ${
                                connectionStatus === "connected"
                                    ? "connected"
                                    : ""
                            }`}
                        >
                            {status}
                        </span>
                    </div>
                )}

                {isRecording && (
                    <div className="recording-indicator">
                        <span className="recording-dot"></span>
                        Recording in progress...
                    </div>
                )}
            </div>

            <div className="translation-card">
                <div className="card-header">
                    <h2>Transcription</h2>
                    {isRecording && (
                        <p className="card-description">
                            Real-time transcription updates as you speak
                        </p>
                    )}
                </div>
                <div className="output-display text-output">
                    {transcribedText || (
                        <span className="placeholder">
                            Transcribed text will appear here
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}

export default SpeechToText;

