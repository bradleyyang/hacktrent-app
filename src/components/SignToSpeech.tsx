import { useState, useRef, useEffect } from "react";
import "./SignToSpeech.css";

interface SignToSpeechProps {
    wsUrl?: string;
    initialFps?: number;
    sendMotionThreshold?: number;
    enableTTS?: boolean;
}

function SignToSpeech({
    wsUrl = "wss://your-backend.example/ws/signstream",
    initialFps = 6,
    sendMotionThreshold = 0.02,
    enableTTS = true,
}: SignToSpeechProps = {}) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const [running, setRunning] = useState(false);
    const [fps, setFps] = useState(initialFps);
    const [translatedText, setTranslatedText] = useState("");
    const [detectedSign, setDetectedSign] = useState("");
    const [status, setStatus] = useState("idle");
    const [isPlayingAudio, setIsPlayingAudio] = useState(false);
    const [audioQueue, setAudioQueue] = useState<string[]>([]);
    const [lastSentImageHash, setLastSentImageHash] = useState<string | null>(
        null
    );

    // Cleanup WebSocket on unmount
    useEffect(() => {
        return () => {
            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
            }
        };
    }, []);

    // Helper: Start camera
    async function startCamera() {
        setStatus("starting camera...");
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
            setStatus("camera ready");
            return true;
        } catch (err) {
            console.error("Camera error", err);
            setStatus(
                "camera error: " + ((err as Error).message || String(err))
            );
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
        setStatus("camera stopped");
    }

    function connectWebSocket() {
        setStatus("connecting websocket...");
        try {
            wsRef.current = new WebSocket(wsUrl);
            wsRef.current.binaryType = "arraybuffer";

            wsRef.current.onopen = () => {
                console.log("ws open");
                setStatus("connected");
            };

            wsRef.current.onmessage = (ev) => {
                try {
                    const data = JSON.parse(ev.data);
                    if (data.type === "transcript") {
                        setTranslatedText(data.text || "");
                        // If backend returns sign language representation
                        if (data.sign_language) {
                            setDetectedSign(data.sign_language);
                        }
                        // If backend returns audio URL, play it
                        if (data.audio_url && enableTTS) {
                            enqueueAudio(data.audio_url);
                        }
                    } else if (data.type === "info") {
                        setStatus(data.message || "info");
                    }
                } catch (e) {
                    console.warn("Non-JSON WS message", e);
                }
            };

            wsRef.current.onerror = (err) => {
                console.error("WS error", err);
                setStatus("ws error");
            };

            wsRef.current.onclose = () => {
                console.log("ws closed");
                setStatus("ws closed");
            };
        } catch (err) {
            console.error("ws connect failed", err);
            setStatus("ws failed");
        }
    }

    function disconnectWebSocket() {
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
            setStatus("ws disconnected");
        }
    }

    // Simple image hashing: average color per channel compressed -> string
    function quickImageHash(imageData: ImageData): string {
        const d = imageData.data;
        let r = 0,
            g = 0,
            b = 0;
        const step = Math.max(4, Math.floor(d.length / 5000)); // sample up to ~5000 px
        let count = 0;

        for (let i = 0; i < d.length; i += 4 * step) {
            r += d[i];
            g += d[i + 1];
            b += d[i + 2];
            count++;
        }

        r = Math.round(r / count);
        g = Math.round(g / count);
        b = Math.round(b / count);
        return `${r}-${g}-${b}`;
    }

    // Lightweight motion detection between two pixel buffers
    function computeMotionFraction(
        a: Uint8ClampedArray | null,
        b: Uint8ClampedArray | null
    ): number {
        if (!a || !b || a.length !== b.length) return 1;

        let diffs = 0;
        const len = a.length;
        const step = 4 * 10; // sample every 10th pixel (RGBA)

        for (let i = 0; i < len; i += step) {
            const dr = Math.abs(a[i] - b[i]);
            const dg = Math.abs(a[i + 1] - b[i + 1]);
            const db = Math.abs(a[i + 2] - b[i + 2]);
            if (dr + dg + db > 30) diffs++;
        }

        const totalSamples = Math.ceil(len / step);
        return diffs / totalSamples;
    }

    // Frame sending loop using requestAnimationFrame but throttled to `fps`
    useEffect(() => {
        if (!running) return;

        let rafId: number | null = null;
        let lastTime = performance.now();
        const interval = 1000 / Math.max(1, fps);
        const ctx = canvasRef.current?.getContext("2d");
        let prevImageData: ImageData | null = null;

        async function step(now: number) {
            rafId = requestAnimationFrame(step);

            if (!videoRef.current || videoRef.current.readyState < 2) return;
            if (now - lastTime < interval) return;
            lastTime = now;

            // Draw video frame to canvas (downscale to reduce bandwidth)
            const w = 320; // send small frames for speed
            const h =
                Math.round(
                    (videoRef.current.videoHeight /
                        videoRef.current.videoWidth) *
                        w
                ) || 240;

            if (!canvasRef.current || !ctx) return;

            canvasRef.current.width = w;
            canvasRef.current.height = h;
            ctx.drawImage(videoRef.current, 0, 0, w, h);
            const imageData = ctx.getImageData(0, 0, w, h);

            // Motion detection
            const motion = computeMotionFraction(
                prevImageData?.data || null,
                imageData.data
            );
            prevImageData = imageData;

            if (motion < sendMotionThreshold) {
                // Very little change -> skip sending
                return;
            }

            // Quick hash to avoid sending near-duplicate frames
            const hash = quickImageHash(imageData);
            if (hash === lastSentImageHash) return;
            setLastSentImageHash(hash);

            // Convert to JPEG blob for smaller payloads
            canvasRef.current.toBlob(
                async (blob) => {
                    if (!blob) return;

                    // If websocket is available, send JSON header then binary
                    if (
                        wsRef.current &&
                        wsRef.current.readyState === WebSocket.OPEN
                    ) {
                        try {
                            const meta = {
                                type: "frame",
                                ts: Date.now(),
                                width: w,
                                height: h,
                            };
                            wsRef.current.send(JSON.stringify(meta));
                            const ab = await blob.arrayBuffer();
                            wsRef.current.send(ab);
                        } catch (err) {
                            console.error("Failed to send frame over ws", err);
                        }
                    } else {
                        // Fallback: send HTTP POST (throttled by fps)
                        try {
                            const form = new FormData();
                            form.append("frame", blob, "frame.jpg");
                            await fetch("/api/signframe", {
                                method: "POST",
                                body: form,
                            });
                        } catch (err) {
                            console.error("HTTP frame send failed", err);
                        }
                    }
                },
                "image/jpeg",
                0.65
            );
        }

        rafId = requestAnimationFrame(step);

        return () => {
            if (rafId) cancelAnimationFrame(rafId);
        };
    }, [running, fps, sendMotionThreshold]);

    function enqueueAudio(url: string) {
        setAudioQueue((q) => [...q, url]);
    }

    // Play queued audio sequentially
    useEffect(() => {
        if (!audioQueue.length) return;

        const url = audioQueue[0];
        const a = new Audio(url);

        setIsPlayingAudio(true);
        a.onended = () => {
            setAudioQueue((q) => q.slice(1));
            setIsPlayingAudio(false);
        };
        a.onerror = () => {
            setAudioQueue((q) => q.slice(1));
            setIsPlayingAudio(false);
        };
        a.play().catch((e) => {
            console.warn("audio play failed", e);
            setAudioQueue((q) => q.slice(1));
            setIsPlayingAudio(false);
        });
    }, [audioQueue]);

    async function handleStart() {
        setTranslatedText("");
        setDetectedSign("");
        const ok = await startCamera();
        if (!ok) return;
        connectWebSocket();
        setRunning(true);
    }

    function handleStop() {
        setRunning(false);
        disconnectWebSocket();
        stopCamera();
    }

    const handleClear = () => {
        setDetectedSign("");
        setTranslatedText("");
    };

    const handleStopAudio = () => {
        setAudioQueue([]);
        setIsPlayingAudio(false);
    };

    return (
        <div className="sign-to-speech">
            <div className="translation-card camera-card">
                <div className="card-header">
                    <h2>Camera Input</h2>
                    <p className="card-description">
                        Show sign language to the camera for real-time
                        translation
                    </p>
                </div>

                <div className="camera-container">
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className={`camera-video ${running ? "active" : ""}`}
                    />
                    {!running && (
                        <div className="camera-placeholder">
                            <span className="camera-icon">📹</span>
                            <p>Camera feed will appear here</p>
                        </div>
                    )}
                    <canvas ref={canvasRef} style={{ display: "none" }} />
                </div>

                <div className="status-display">
                    <span className="status-label">Status:</span>
                    <span
                        className={`status-value ${
                            status === "connected" ? "connected" : ""
                        }`}
                    >
                        {status}
                    </span>
                </div>

                <div className="camera-controls">
                    {!running ? (
                        <button
                            className="camera-button start"
                            onClick={handleStart}
                        >
                            <span className="button-icon">📹</span>
                            <span className="button-text">Start Streaming</span>
                        </button>
                    ) : (
                        <button
                            className="camera-button stop"
                            onClick={handleStop}
                        >
                            <span className="button-icon">⏹️</span>
                            <span className="button-text">Stop Streaming</span>
                        </button>
                    )}

                    <div className="fps-control">
                        <label className="fps-label">FPS:</label>
                        <input
                            type="range"
                            min={1}
                            max={15}
                            value={fps}
                            onChange={(e) => setFps(Number(e.target.value))}
                            disabled={running}
                            className="fps-slider"
                        />
                        <span className="fps-value">{fps}</span>
                    </div>

                    <button
                        className="clear-button"
                        onClick={handleClear}
                        disabled={!detectedSign && !translatedText}
                    >
                        Clear
                    </button>
                </div>
            </div>

            <div className="translation-card">
                <div className="card-header">
                    <h2>Detected Sign Language</h2>
                </div>
                <div className="output-display sign-input">
                    {detectedSign || (
                        <span className="placeholder">
                            Detected sign language will appear here...
                        </span>
                    )}
                </div>
            </div>

            <div className="translation-card">
                <div className="card-header">
                    <h2>Translated Text (Real-time)</h2>
                </div>
                <div className="output-display text-output">
                    {translatedText || (
                        <span className="placeholder">
                            Translated text will appear here...
                        </span>
                    )}
                </div>
            </div>

            {enableTTS && (
                <div className="translation-card">
                    <div className="card-header">
                        <h2>Audio Output</h2>
                        <p className="card-description">
                            Audio will play automatically when received from
                            backend
                        </p>
                    </div>
                    <div className="audio-output-controls">
                        {isPlayingAudio && (
                            <div className="audio-status">
                                <span className="audio-playing-indicator"></span>
                                Playing audio...
                            </div>
                        )}
                        {audioQueue.length > 0 && (
                            <div className="audio-queue-info">
                                {audioQueue.length} audio file
                                {audioQueue.length > 1 ? "s" : ""} in queue
                            </div>
                        )}
                        {isPlayingAudio && (
                            <button
                                className="play-audio-button playing"
                                onClick={handleStopAudio}
                            >
                                <span className="button-icon">⏹️</span>
                                <span className="button-text">Stop Audio</span>
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default SignToSpeech;
