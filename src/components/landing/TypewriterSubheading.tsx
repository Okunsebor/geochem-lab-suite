import { useState, useEffect } from "react";

const TYPEWRITER_PHRASES = [
  "digitizes laboratory workflows from intake to analytical reporting.",
  "eliminates manual custody errors and duplicate assay miscalculations.",
  "ensures ISO 17025 compliance with real-time QA/QC anomaly detection.",
  "automates instrument queues, preparation tracking, and report dispatch.",
];

export default function TypewriterSubheading() {
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [cursorVisible, setCursorVisible] = useState(true);

  useEffect(() => {
    const cursorTimer = setInterval(() => setCursorVisible(v => !v), 530);
    return () => clearInterval(cursorTimer);
  }, []);

  useEffect(() => {
    const phrase = TYPEWRITER_PHRASES[phraseIdx];
    let timeout: ReturnType<typeof setTimeout>;
    if (!isDeleting && displayed.length < phrase.length) {
      timeout = setTimeout(() => setDisplayed(phrase.slice(0, displayed.length + 1)), 38);
    } else if (!isDeleting && displayed.length === phrase.length) {
      timeout = setTimeout(() => setIsDeleting(true), 2800);
    } else if (isDeleting && displayed.length > 0) {
      timeout = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 18);
    } else if (isDeleting && displayed.length === 0) {
      setIsDeleting(false);
      setPhraseIdx(i => (i + 1) % TYPEWRITER_PHRASES.length);
    }
    return () => clearTimeout(timeout);
  }, [displayed, isDeleting, phraseIdx]);

  return (
    <span className="text-muted-foreground">
      GeoChem Suite{" "}
      <span className="text-foreground/90">{displayed}</span>
      <span
        className="inline-block w-[2px] h-[1.1em] bg-accent ml-[1px] align-middle"
        style={{ opacity: cursorVisible ? 1 : 0, transition: "opacity 0.1s" }}
      />
    </span>
  );
}
