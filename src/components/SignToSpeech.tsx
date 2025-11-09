import { useState, useRef, useEffect } from "react";
import "./SignToSpeech.css";

interface SignToSpeechProps {
    wsUrl?: string;
    initialFps?: number;
    sendMotionThreshold?: number;
}

function SignToSpeech({}: SignToSpeechProps = {}) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const [isStreaming, setIsStreaming] = useState(false);
    const [translatedText, setTranslatedText] = useState("");

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (isStreaming) {
                stopCamera();
            }
        };
    }, []);

    // Start camera
    async function startCamera() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: "user",
                },
                audio: false,
            });

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                streamRef.current = stream;
                await videoRef.current.play();
            }
            return true;
        } catch (err) {
            console.error("Camera error", err);
            alert("Unable to access camera. Please check permissions.");
            return false;
        }
    }

    function stopCamera() {
        const stream = videoRef.current?.srcObject as MediaStream | null;
        if (stream) {
            stream.getTracks().forEach((track) => track.stop());
            if (videoRef.current) {
                videoRef.current.srcObject = null;
            }
            streamRef.current = null;
        }
    }

    async function handleStart() {
        const ok = await startCamera();
        if (!ok) return;
        setIsStreaming(true);
        // TODO: Connect to backend and start sending frames
        console.log("Camera started, ready to send frames to backend");
    }

    function handleStop() {
        setIsStreaming(false);
        stopCamera();
    }

    const toggleStreaming = () => {
        if (isStreaming) {
            handleStop();
        } else {
            handleStart();
        }
    };

    function useFadeIn(delay = 0) {
        const ref = useRef<HTMLDivElement>(null);
        const [isVisible, setIsVisible] = useState(false);

        useEffect(() => {
            const t = setTimeout(() => setIsVisible(true), delay);
            return () => clearTimeout(t);
        }, [delay]);

        return { ref, isVisible };
    }

    const videoArea = useFadeIn(0);
    const inputArea = useFadeIn(200);

    return (
        <div className="sign-to-speech-container">
            <div
                ref={videoArea.ref as React.RefObject<HTMLDivElement>}
                className={`video-area fade-in-element ${
                    videoArea.isVisible ? "visible" : ""
                }`}
            >
                <div className="video-wrapper">
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="camera-video"
                    />
                    {!isStreaming && (
                        <div className="video-placeholder">
                            <svg
                                width="64"
                                height="64"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.5"
                            >
                                <path d="M23 7l-7 5 7 5V7z" />
                                <rect
                                    x="1"
                                    y="5"
                                    width="15"
                                    height="14"
                                    rx="2"
                                    ry="2"
                                />
                            </svg>
                            <p>Camera feed will appear here</p>
                        </div>
                    )}
                </div>
                <canvas ref={canvasRef} style={{ display: "none" }} />

                {translatedText && (
                    <div className="translation-display">
                        <div className="translation-content">
                            {translatedText}
                        </div>
                    </div>
                )}
            </div>

            <div
                ref={inputArea.ref as React.RefObject<HTMLDivElement>}
                className={`input-area fade-in-element fade-in-delay-1 ${
                    inputArea.isVisible ? "visible" : ""
                }`}
            >
                <button
                    className={`stream-button ${
                        isStreaming ? "streaming" : ""
                    }`}
                    onClick={toggleStreaming}
                    aria-label={
                        isStreaming ? "Stop streaming" : "Start streaming"
                    }
                >
                    {isStreaming ? (
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
                            <path d="M23 7l-7 5 7 5V7z" />
                            <rect
                                x="1"
                                y="5"
                                width="15"
                                height="14"
                                rx="2"
                                ry="2"
                            />
                        </svg>
                    )}
                </button>
            </div>
        </div>
    );
}

export default SignToSpeech;
