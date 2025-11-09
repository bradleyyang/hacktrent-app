// import { useState, useRef, useEffect } from "react";
// import SpeechToText from "./components/SpeechToText";
// import SignToSpeech from "./components/SignToSpeech";
// import "./App.css";

// type Mode = "speech-to-text" | "sign-to-speech";

// function App() {
//     const [mode, setMode] = useState<Mode>("speech-to-text");
//     const navTabsRef = useRef<HTMLDivElement>(null);
//     const sliderRef = useRef<HTMLDivElement>(null);
//     const button1Ref = useRef<HTMLButtonElement>(null);
//     const button2Ref = useRef<HTMLButtonElement>(null);

//     useEffect(() => {
//         const updateSliderPosition = () => {
//             if (!sliderRef.current || !button1Ref.current || !button2Ref.current) return;

//             if (!navTabsRef.current) return;

//             const activeButton = mode === "speech-to-text" ? button1Ref.current : button2Ref.current;
//             const navTabs = navTabsRef.current;

//             const navRect = navTabs.getBoundingClientRect();
//             const buttonRect = activeButton.getBoundingClientRect();

//             const left = buttonRect.left - navRect.left;
//             const width = buttonRect.width;

//             sliderRef.current.style.transform = `translateX(${left}px)`;
//             sliderRef.current.style.width = `${width}px`;
//         };

//         // Small delay to ensure DOM is fully rendered
//         const timeoutId = setTimeout(() => {
//             updateSliderPosition();
//         }, 0);

//         // Update on window resize
//         window.addEventListener("resize", updateSliderPosition);
        
//         return () => {
//             clearTimeout(timeoutId);
//             window.removeEventListener("resize", updateSliderPosition);
//         };
//     }, [mode]);

//     return (
//         <div className="app">
//             <header className="app-header">
//                 <div className="header-content">
//                     <h1 className="app-title">
//                         <span className="title-icon">🤟</span>
//                         GestureAI
//                     </h1>
//                     <nav className="nav-tabs" ref={navTabsRef}>
//                         <div className="nav-slider" ref={sliderRef}></div>
//                         <button
//                             ref={button1Ref}
//                             className={`mode-button ${
//                                 mode === "speech-to-text" ? "active" : ""
//                             }`}
//                             onClick={() => setMode("speech-to-text")}
//                         >
//                             <span className="button-icon">🎤</span>
//                             Speech to Text
//                         </button>
//                         <button
//                             ref={button2Ref}
//                             className={`mode-button ${
//                                 mode === "sign-to-speech" ? "active" : ""
//                             }`}
//                             onClick={() => setMode("sign-to-speech")}
//                         >
//                             <span className="button-icon">📹</span>
//                             Sign to Speech
//                         </button>
//                     </nav>
//                 </div>
//             </header>

//             <main className="app-main">
//                 {mode === "speech-to-text" ? (
//                     <SpeechToText
//                         wsUrl={
//                             import.meta.env.VITE_WS_URL ||
//                             "ws://localhost:8000/ws"
//                         }
//                     />
//                 ) : (
//                     <SignToSpeech />
//                 )}
//             </main>

//             <footer className="app-footer">
//                 <p>HackTrent 2025</p>
//             </footer>
//         </div>
//     );
// }

// export default App;


import { useState, useRef, useEffect } from "react";
import SpeechToText from "./components/SpeechToText";
import SignToSpeech from "./components/SignToSpeech";
import "./App.css";

type Mode = "speech-to-text" | "sign-to-speech";

function App() {
    const [mode, setMode] = useState<Mode>("speech-to-text");
    const navTabsRef = useRef<HTMLDivElement>(null);
    const sliderRef = useRef<HTMLDivElement>(null);
    const button1Ref = useRef<HTMLButtonElement>(null);
    const button2Ref = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        const updateSliderPosition = () => {
            if (!sliderRef.current || !button1Ref.current || !button2Ref.current) return;

            if (!navTabsRef.current) return;

            const activeButton = mode === "speech-to-text" ? button1Ref.current : button2Ref.current;
            const navTabs = navTabsRef.current;

            const navRect = navTabs.getBoundingClientRect();
            const buttonRect = activeButton.getBoundingClientRect();

            const left = buttonRect.left - navRect.left;
            const width = buttonRect.width;

            sliderRef.current.style.transform = `translateX(${left}px)`;
            sliderRef.current.style.width = `${width}px`;
        };

        // Small delay to ensure DOM is fully rendered
        const timeoutId = setTimeout(() => {
            updateSliderPosition();
        }, 0);

        // Update on window resize
        window.addEventListener("resize", updateSliderPosition);
        
        return () => {
            clearTimeout(timeoutId);
            window.removeEventListener("resize", updateSliderPosition);
        };
    }, [mode]);

    return (
        <div className="app">
            <header className="app-header">
                <div className="header-content">
                    <h1 className="app-title">
                        <span className="title-icon">🤟</span>
                        GestureAI
                    </h1>
                    <nav className="nav-tabs" ref={navTabsRef}>
                        <div className="nav-slider" ref={sliderRef}></div>
                        <button
                            ref={button1Ref}
                            className={`mode-button ${
                                mode === "speech-to-text" ? "active" : ""
                            }`}
                            onClick={() => setMode("speech-to-text")}
                        >
                            <span className="button-icon">🎤</span>
                            Speech to Text
                        </button>
                        <button
                            ref={button2Ref}
                            className={`mode-button ${
                                mode === "sign-to-speech" ? "active" : ""
                            }`}
                            onClick={() => setMode("sign-to-speech")}
                        >
                            <span className="button-icon">📹</span>
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
                                Real-time AI-powered translation between speech and sign language.
                                Built for accessibility, designed for everyone.
                            </p>
                        </div>
                        <div className="hero-visual">
                            <div className="gradient-orb"></div>
                        </div>
                    </div>
                </section>

                {mode === "speech-to-text" ? (
                    <SpeechToText
                        wsUrl={
                            import.meta.env.VITE_WS_URL ||
                            "ws://localhost:8000/ws"
                        }
                    />
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
