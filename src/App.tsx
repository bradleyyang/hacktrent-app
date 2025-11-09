import { useState, useRef } from "react";
import SpeechToText from "./components/SpeechToText";
import SignToSpeech from "./components/SignToSpeech";
import "./App.css";
import sayless from "./assets/sayless.png";

import { useScrollAnimation } from "./hooks/useScrollAnimation";

type Mode = "speech-to-text" | "sign-to-speech";

function App() {
    const [mode, setMode] = useState<Mode>("speech-to-text");
    const navTabsRef = useRef<HTMLDivElement>(null);
    const button1Ref = useRef<HTMLButtonElement>(null);
    const button2Ref = useRef<HTMLButtonElement>(null);

    const heroTitle = useScrollAnimation();
    const heroSubtitle = useScrollAnimation();
    const heroOrb = useScrollAnimation();
    const modeComponent = useScrollAnimation();

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
                            <h2
                                ref={
                                    heroTitle.ref as React.RefObject<HTMLHeadingElement>
                                }
                                className={`hero-title fade-in-element ${
                                    heroTitle.isVisible ? "visible" : ""
                                }`}
                            >
                                Breaking Communication Barriers
                            </h2>
                            <p
                                ref={
                                    heroSubtitle.ref as React.RefObject<HTMLParagraphElement>
                                }
                                className={`hero-subtitle fade-in-element fade-in-delay-1 ${
                                    heroSubtitle.isVisible ? "visible" : ""
                                }`}
                            >
                                Real-time AI-powered translation between speech
                                and sign language. Built for accessibility,
                                designed for everyone.
                            </p>
                        </div>
                        <div
                            ref={heroOrb.ref as React.RefObject<HTMLDivElement>}
                            className={`hero-visual fade-in-element fade-in-delay-2 ${
                                heroOrb.isVisible ? "visible" : ""
                            }`}
                        >
                            <div className="gradient-orb"></div>
                        </div>
                    </div>
                </section>

                <div
                    ref={modeComponent.ref as React.RefObject<HTMLDivElement>}
                    className={`fade-in-element ${
                        modeComponent.isVisible ? "visible" : ""
                    }`}
                >
                    {mode === "speech-to-text" ? (
                        <SpeechToText />
                    ) : (
                        <SignToSpeech />
                    )}
                </div>
            </main>

            <footer className="app-footer">
                <p>HackTrent 2025</p>
            </footer>
        </div>
    );
}

export default App;
