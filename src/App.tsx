import { useState, useRef } from "react";
import SpeechToText from "./components/SpeechToText";
import SignToSpeech from "./components/SignToSpeech";
import "./App.css";
import sayless from "./assets/sayless.png";

type Mode = "speech-to-text" | "sign-to-speech";

function App() {
    const [mode, setMode] = useState<Mode>("speech-to-text");
    const navTabsRef = useRef<HTMLDivElement>(null);
    const button1Ref = useRef<HTMLButtonElement>(null);
    const button2Ref = useRef<HTMLButtonElement>(null);

    return (
        <div className="app">
            <header className="app-header">
                <div className="header-content">
                    <h1 className="app-title">
                        <span className="title-icon">
                            <img
                                src={sayless}
                                alt="Hand"
                                className="title-icon-img"
                            />
                        </span>
                        Sayless
                    </h1>
                    <nav className="nav-tabs" ref={navTabsRef}>
                        <button
                            ref={button1Ref}
                            className={`mode-button ${
                                mode === "speech-to-text" ? "active" : ""
                            }`}
                            onClick={() => setMode("speech-to-text")}
                        >
                            Speech to Text
                        </button>
                        <span className="mode-separator">/</span>
                        <button
                            ref={button2Ref}
                            className={`mode-button ${
                                mode === "sign-to-speech" ? "active" : ""
                            }`}
                            onClick={() => setMode("sign-to-speech")}
                        >
                            Sign to Speech
                        </button>
                    </nav>
                </div>
            </header>

            <main className="app-main">
                <section className="hero-section">
                    <div className="hero-content">
                        <div className="hero-text">
                            <h2 className="hero-title">
                                Breaking Communication Barriers
                            </h2>
                            <p className="hero-subtitle">
                                Real-time AI-powered translation between speech
                                and sign language. Built for accessibility,
                                designed for everyone.
                            </p>
                        </div>
                        <div className="hero-visual">
                            <div className="gradient-orb"></div>
                        </div>
                    </div>
                </section>

                {mode === "speech-to-text" ? (
                    <SpeechToText />
                ) : (
                    <SignToSpeech />
                )}
            </main>

            <footer className="app-footer">
                <p>HackTrent 2025</p>
            </footer>
        </div>
    );
}

export default App;