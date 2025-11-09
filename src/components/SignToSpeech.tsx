import { useState, useRef, useEffect } from "react";
import "./SignToSpeech.css";

interface SignToSpeechProps {}

function SignToSpeech({}: SignToSpeechProps = {}) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const [isStreaming, setIsStreaming] = useState(false);
    const [translatedText, setTranslatedText] = useState("");

    const frameIntervalRef = useRef<number | null>(null);

    useEffect(() => {
        return () => {
            stopCamera();
        };
    }, []);

    async function captureFrame(): Promise<Blob | null> {
        if (!canvasRef.current || !videoRef.current) return null;

        const canvas = canvasRef.current;
        const video = videoRef.current;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext("2d");
        if (!ctx) return null;

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        return new Promise((resolve) => {
            canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.8);
        });
    }

    async function sendFrameToBackend() {
        const frameBlob = await captureFrame();
        if (!frameBlob) {
            console.warn("Failed to capture frame");
            return;
        }

        const formData = new FormData();
        formData.append("file", frameBlob, "frame.jpg");

        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/predict`,
                {
                    method: "POST",
                    body: formData,
                }
            );

            if (!response.ok) {
                const errorText = await response.text();
                console.error(
                    "Prediction request failed:",
                    response.statusText,
                    errorText
                );
                return;
            }

            const data = await response.json();

            if (data.prediction) {
                console.debug("prediction exists");
                setTranslatedText(data.prediction);
            }

            if (data.audio) {
                console.debug("audio exists");
                playAudioFromBase64(data.audio);
            }
        } catch (err) {
            console.error("Error sending frame:", err);
        }
    }

    function playAudioFromBase64(base64Audio: string) {
        try {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }

            const audio = new Audio(`data:audio/wav;base64,${base64Audio}`);
            audioRef.current = audio;

            audio.onerror = (e) => {
                console.error("Audio playback error:", e);
            };

            audio.play().catch((err) => {
                console.error("Audio play failed:", err);
            });
        } catch (err) {
            console.error("Error creating audio:", err);
        }
    }

    async function startCamera() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 1280, height: 720, facingMode: "user" },
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
            if (videoRef.current) videoRef.current.srcObject = null;
            streamRef.current = null;
        }

        if (frameIntervalRef.current !== null) {
            clearInterval(frameIntervalRef.current);
            frameIntervalRef.current = null;
        }

        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
    }

    async function handleStart() {
        const ok = await startCamera();
        if (!ok) return;

        setIsStreaming(true);

        sendFrameToBackend();

        frameIntervalRef.current = window.setInterval(() => {
            sendFrameToBackend();
        }, 2000);
    }

    function handleStop() {
        setIsStreaming(false);
        stopCamera();
    }

    const toggleStreaming = () => {
        if (isStreaming) handleStop();
        else handleStart();
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
