"use client";
export const dynamic = "force-dynamic";
import { useState, useEffect, useCallback, useRef } from "react";
import { formatEventDate } from "../lib/chain-display.js";
import { isCorrectPosition } from "../lib/answer-check.js";
import { eventHeadline } from "../lib/event-headlines.js";
import { pacificDate, nextPacificMidnight } from "../lib/puzzle-clock.js";
import { calculateCurrentStreak, dailyResultForDate, recordDailyResult, editionTimeStats, editionLabel, EDITION_NAMES } from "../lib/player-stats.js";
import { losingShareText, winningShareText } from "../lib/share-score.js";
import { legacyFormatForScore } from "../lib/legacy-format.js";
import { gameplayHeadline, SORT_INSTRUCTIONS } from "../lib/gameplay-copy.js";
import { dailyIntroCopy } from "../lib/intro-copy.js";
import { BLUE_SCREEN_BACKGROUND, introPresentation } from "../lib/intro-presentation.js";

const LOSER_IMG = "/bg/loser-toy-fine-lines-v6.png";

const C = {
  bg:       "#0A1628",
  card:     "rgba(255,255,255,0.07)",
  cardOver: "rgba(255,255,255,0.13)",
  locked:   "#F5C518",
  border:   "rgba(255,255,255,0.12)",
  borderHi: "rgba(255,255,255,0.28)",
  red:      "#B22234",
  gold:     "#F5C518",
  text:     "#ffffff",
  dim:      "rgba(255,255,255,0.75)",
  dimmer:   "rgba(255,255,255,0.60)",
  dimmest:  "rgba(255,255,255,0.08)",
};

function shuffleArray(arr) {
  const s = [...arr];
  for (let i = s.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [s[i], s[j]] = [s[j], s[i]];
  }
  return s;
}

function formatTime(ms) {
  const mins = Math.floor(ms / 60000);
  const secs = Math.floor((ms % 60000) / 1000);
  const centis = Math.floor((ms % 1000) / 10);
  return { display: mins + ":" + secs.toString().padStart(2,"0") + "." + centis.toString().padStart(2,"0") };
}

let cardAudioContext = null;
function playCardTone(kind) {
  if (typeof window === "undefined") return;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  try {
    cardAudioContext ||= new AudioContext();
    if (cardAudioContext.state === "suspended") cardAudioContext.resume();
    const now = cardAudioContext.currentTime;
    const oscillator = cardAudioContext.createOscillator();
    const gain = cardAudioContext.createGain();
    oscillator.type = kind === "pickup" ? "sine" : "triangle";
    oscillator.frequency.setValueAtTime(kind === "pickup" ? 620 : 480, now);
    oscillator.frequency.exponentialRampToValueAtTime(kind === "pickup" ? 760 : 360, now + 0.032);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(kind === "pickup" ? 0.018 : 0.014, now + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.038);
    oscillator.connect(gain);
    gain.connect(cardAudioContext.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.04);
  } catch {}
}

// stars = what you EARN if you solve it on this attempt
// failedAttempts = wrong Lock-Its so far (0, 1, 2)
// After 3 failed attempts → game over, never reaches complete
function getStars(failedAttempts) {
  if (failedAttempts === 0) return 3;
  if (failedAttempts === 1) return 2;
  return 1; // failedAttempts === 2
}

const MAX_ATTEMPTS = 3; // game over after this many failed lock-ins

function getStats(referenceDate = null) {
  if (typeof window === "undefined") return { played: 0, perfects: 0, best: null, history: [], results: [], streak: 0 };
  try {
    const history = JSON.parse(localStorage.getItem("trumple_history") || "[]");
    const results = JSON.parse(localStorage.getItem("trumple_results") || "[]");
    return {
      played:   parseInt(localStorage.getItem("trumple_played")   || "0", 10),
      perfects: parseInt(localStorage.getItem("trumple_perfects") || "0", 10),
      best:     parseInt(localStorage.getItem("trumple_best")     || "0", 10) || null,
      history,
      results,
      streak: calculateCurrentStreak(results, referenceDate),
    };
  } catch { return { played: 0, perfects: 0, best: null, history: [], results: [], streak: 0 }; }
}
function saveStats(timeMs, stars, puzzleDate, edition, hintUsed = false, eventCount) {
  if (typeof window === "undefined") return;
  try {
    const prev = getStats(puzzleDate);
    if (dailyResultForDate(prev.results, puzzleDate)) return;
    localStorage.setItem("trumple_played",   String(prev.played + 1));
    localStorage.setItem("trumple_perfects", String(prev.perfects + (stars === 3 ? 1 : 0)));
    // Leave the old mixed-format best/history keys untouched for recovery.
    // New records derive their edition-specific times from structured results.
    const results = recordDailyResult(prev.results, puzzleDate, stars > 0, { timeMs, stars, edition, hintUsed, eventCount });
    localStorage.setItem("trumple_results", JSON.stringify(results));
  } catch {}
}

function useNextPuzzleCountdown() {
  const getRemaining = useCallback(() => {
    const now = new Date();
    return Math.max(0, nextPacificMidnight(now) - now.getTime());
  }, []);
  const [remaining, setRemaining] = useState(getRemaining);
  useEffect(() => {
    const timerId = setInterval(() => setRemaining(getRemaining()), 1000);
    return () => clearInterval(timerId);
  }, [getRemaining]);
  const hours = Math.floor(remaining / 3600000);
  const minutes = Math.floor((remaining % 3600000) / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  return [hours, minutes, seconds].map(value => String(value).padStart(2, "0")).join(":");
}

function useTimer() {
  const [time, setTime] = useState(0);
  const startRef = useRef(null);
  const rafRef   = useRef(null);
  const runRef   = useRef(false);
  const tick = useCallback(() => {
    if (!runRef.current) return;
    setTime(Date.now() - startRef.current);
    rafRef.current = requestAnimationFrame(tick);
  }, []);
  const start = useCallback(() => {
    startRef.current = Date.now(); runRef.current = true;
    rafRef.current = requestAnimationFrame(tick);
  }, [tick]);
  const stop = useCallback(() => {
    runRef.current = false;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);
  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);
  return { time, start, stop };
}

const WORDS_3 = ["Democracy survived. Barely.", "You beat the news cycle.", "Fact-checkers applaud politely.", "Chaos never stood a chance.", "The timeline has been indicted."];
const WORDS_2 = ["Messy, but constitutional.", "Chaos contained. Mostly.", "You found the plot eventually.", "A respectable act of resistance.", "The timeline put up a fight."];
const WORDS_1 = ["By the skin of democracy.", "That was alarmingly close.", "The timeline nearly won.", "You survived the chaos."];
function getCelebWord(stars) {
  const list = stars === 3 ? WORDS_3 : stars === 2 ? WORDS_2 : WORDS_1;
  return list[Math.floor(Math.random() * list.length)];
}

const SHARE_CTAS = ["Spread the chaos!", "Brag responsibly!", "Make the group chat nervous!"];
const shareCta = SHARE_CTAS[Math.floor(Math.random() * SHARE_CTAS.length)];

function Confetti({ active }) {
  const pieces = useRef(
    Array.from({ length: 70 }, (_, i) => ({
      id: i, x: Math.random() * 100, delay: Math.random() * 1.4,
      duration: 1.6 + Math.random() * 1.4,
      color: ["#B22234","#B22234","#ffffff","#ffffff","#1C3F8C","#1C3F8C","#F5C518"][i % 7],
      size: 5 + Math.random() * 7, drift: (Math.random() - 0.5) * 80, rot: Math.random() * 360,
    }))
  ).current;
  if (!active) return null;
  return (
    <div style={{ position:"fixed", inset:0, pointerEvents:"none", overflow:"hidden", zIndex:9999 }}>
      {pieces.map(pc => (
        <div key={pc.id} style={{
          position:"absolute", top:0, left:pc.x+"%",
          width:pc.size+"px", height:(pc.size*0.45)+"px",
          background:pc.color, borderRadius:"2px",
          "--cdrift":pc.drift+"px", "--crot":(pc.rot+540)+"deg",
          animation:"confettiFall "+pc.duration+"s ease-in "+pc.delay+"s both",
        }}/>
      ))}
    </div>
  );
}

function StarDisplay({ stars, size = 28, celebrate = false }) {
  const [vis, setVis] = useState(celebrate ? 0 : stars);
  useEffect(() => {
    if (!celebrate) { setVis(stars); return; }
    setVis(0);
    const timers = [];
    for (let i = 1; i <= stars; i++)
      timers.push(setTimeout(() => setVis(i), 200 + i * 145));
    return () => timers.forEach(clearTimeout);
  }, [celebrate, stars]);
  return (
    <div style={{ display:"flex", gap:"8px" }}>
      {Array.from({ length: stars }, (_, i) => {
        const filled = i + 1 <= vis;
        return (
          <svg key={i} width={size} height={size} viewBox="0 0 24 24"
            fill={filled ? C.gold : "none"} stroke={C.gold} strokeWidth="2" strokeLinejoin="round"
            style={{
              opacity: filled ? 1 : 0.15, transform: filled ? "scale(1.15)" : "scale(0.9)",
              transition: "all 0.35s cubic-bezier(0.34,1.56,0.64,1)",
              animation: filled && celebrate ? "starPop 0.35s ease "+(0.17+(i+1)*0.145)+"s both" : "none",
            }}>
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
        );
      })}
    </div>
  );
}

function AnimatedLogo({ onSolved }) {
  const word = "TRUMPLE";
  const letters = word.split("");
  const n = letters.length;
  const [positions, setPositions] = useState(() => {
    const idx = letters.map((_, i) => i);
    for (let i = idx.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [idx[i], idx[j]] = [idx[j], idx[i]];
    }
    return idx;
  });
  const [solved, setSolved] = useState(false);
  const onSolvedRef = useRef(onSolved);
  onSolvedRef.current = onSolved;

  useEffect(() => {
    let current = [...positions];
    let tick = 0; const CHAOS = 28; let step = 0;
    const interval = setInterval(() => {
      tick++;
      if (tick <= CHAOS) {
        for (let k = 0; k < 4; k++) {
          const a = Math.floor(Math.random() * n);
          const b = Math.floor(Math.random() * n);
          [current[a], current[b]] = [current[b], current[a]];
        }
        setPositions([...current]);
      } else {
        let moved = false;
        for (let i = step; i < n; i++) {
          if (current[i] !== i) {
            const from = current.indexOf(step);
            [current[from], current[step]] = [current[step], current[from]];
            setPositions([...current]); step++; moved = true; break;
          } else { step++; }
        }
        if (!moved || current.every((v, i) => v === i)) {
          clearInterval(interval); setSolved(true);
          if (onSolvedRef.current) onSolvedRef.current();
        }
      }
    }, 48);
    return () => clearInterval(interval);
  }, []);

  const lw = "clamp(2.4rem, 8.4vw, 4.8rem)";
  const fs = "clamp(2.4rem, 8.4vw, 4.8rem)";
  const h  = "clamp(3rem, 10.5vw, 5.7rem)";

  return (
    <div className={solved ? "intro-logo intro-logo-solved" : "intro-logo"} style={{ position:"relative", height:h, width:"calc("+lw+" * "+n+")", margin:"0 auto" }}>
      {letters.map((letter, correctIdx) => {
        const dispIdx = positions.indexOf(correctIdx);
        return (
          <span key={correctIdx} style={{
            position:"absolute", left:"calc("+lw+" * "+dispIdx+")", top:0,
            width:lw, textAlign:"center", fontSize:fs, fontWeight:900,
            fontFamily:"'Nunito', sans-serif",
            color: solved ? C.text : C.dimmer,
            transition:"left 0.16s cubic-bezier(0.34,1.56,0.64,1), color 0.5s ease",
            lineHeight:1.1, userSelect:"none",
          }}>{letter}</span>
        );
      })}
    </div>
  );
}

function LoadingScreen() {
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"100dvh" }}>
      <div style={{ fontFamily:"'Space Grotesk', sans-serif", fontWeight:900, fontSize:"2.2rem", color:C.text }}>TRUMPLE</div>
      <div style={{ marginTop:"1rem", color:C.dimmer, fontSize:"0.8rem", fontFamily:"'JetBrains Mono', monospace", animation:"pulse 1.5s ease infinite" }}>
        Loading today&apos;s chaos...
      </div>
    </div>
  );
}

function ErrorScreen({ weeklyNotReady = false }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"100dvh", padding:"2rem", textAlign:"center" }}>
      <div style={{ fontFamily:"'Space Grotesk', sans-serif", fontWeight:900, fontSize:"2.2rem", color:C.text }}>TRUMPLE</div>
      <div style={{ marginTop:"1.5rem", color:C.dim, fontSize:"0.9rem" }}>{weeklyNotReady ? "This week's chaos is still being sorted." : "Couldn't load the puzzle."}</div>
      <div style={{ marginTop:"0.5rem", color:C.dimmer, fontSize:"0.75rem" }}>{weeklyNotReady ? "Fresh stories only. Please try again shortly." : "Check your connection and try again."}</div>
      <button onClick={() => window.location.reload()} style={{ marginTop:"1.5rem", padding:"0.8rem 1.4rem", background:C.red, color:C.text, border:0, borderRadius:"10px", cursor:"pointer" }}>Try again</button>
    </div>
  );
}

function IntroScreen({ onStart, puzzle, editionMeta }) {
  const isDaily = editionMeta.key === "second-term";
  const toyArtwork = editionMeta.layoutVariant === "toy";
  const [dailyCopy, setDailyCopy] = useState(() => dailyIntroCopy());
  const [show, setShow] = useState(false);
  const [logoSolved, setLogoSolved] = useState(false);
  const [badgeVisible, setBadgeVisible] = useState(false);
  const [taglineCount, setTaglineCount] = useState(0);
  useEffect(() => { const timer = setTimeout(() => setShow(true), 100); return () => clearTimeout(timer); }, []);

  useEffect(() => {
    if (!isDaily) return;
    const update = () => setDailyCopy(dailyIntroCopy());
    const interval = setInterval(update, 1000);
    document.addEventListener("visibilitychange", update);
    return () => { clearInterval(interval); document.removeEventListener("visibilitychange", update); };
  }, [isDaily]);

  // The daily stamp lands while the logo is still sorting itself out.
  useEffect(() => {
    if (!isDaily) return;
    const timers = [650, 1150, 1550].map((delay, index) => setTimeout(() => setTaglineCount(index + 1), delay));
    return () => timers.forEach(clearTimeout);
  }, [isDaily]);

  useEffect(() => {
    if (!logoSolved || isDaily) return;
    const timers = [
      setTimeout(() => setBadgeVisible(true), 0),
      setTimeout(() => setTaglineCount(1), 350),
      setTimeout(() => setTaglineCount(2), 750),
      setTimeout(() => setTaglineCount(3), 1150),
    ];
    return () => timers.forEach(clearTimeout);
  }, [logoSolved, isDaily]);

  const dateLabel = new Date(puzzle.date + "T12:00:00").toLocaleDateString("en-US", {
    weekday:"long", month:"long", day:"numeric", year:"numeric"
  });

  // editionMeta is a guaranteed, fully self-describing object from the API.
  const {
    label:            editionLabel,
    taglines:         editionTaglines,
    badgeStyle,
    buttonColor,
    bgImageUrl,
    bgOverlayOpacity: overlayOpacity,
    layoutVariant,
  } = editionMeta;

  const taglinesBelow = layoutVariant === "taglines-below";
  const taglines = (isDaily ? dailyCopy.lines : editionTaglines).map((text, index) => ({
    text,
    stamp: isDaily && dailyCopy.stamp && index === 0,
    size: isDaily && index === 0 ? "clamp(1.05rem, 5.1vw, 1.65rem)" : index === 0 ? "clamp(1.1rem, 4.8vw, 1.45rem)" : "clamp(1rem, 4.2vw, 1.2rem)",
    weight: index === 0 ? 900 : 700,
    color: index === 0 ? C.gold : C.text,
  }));
  const bgStyle = { backgroundColor:editionMeta.bgColor || C.bg, backgroundImage:"url("+bgImageUrl+")", backgroundSize:editionMeta.key === "weekly" ? "100% auto" : "cover", backgroundRepeat:"no-repeat", backgroundPosition:"center bottom" };

  const renderBadge = () => {
    if (!editionLabel) return null;
    if (badgeStyle === "dark") {
      return (
        <div style={{ background:"rgba(10,10,20,0.75)", border:"1.5px solid rgba(255,255,255,0.22)", color:"#ffffff", borderRadius:"20px", padding:"0.28rem 1rem", fontSize:"1.3rem", fontWeight:900, fontFamily:"'JetBrains Mono', monospace", letterSpacing:"0.1em" }}>
          {editionLabel}
        </div>
      );
    }
    // gold badge (weekly, or any badgeStyle:"gold")
    return (
      <div className="intro-edition-badge" style={{ background:C.gold, color:"#1a1a2e", borderRadius:"10px", padding:"0.125rem 0.45rem", fontSize:"0.975rem", fontWeight:900, fontFamily:"'JetBrains Mono', monospace", letterSpacing:"0.12em", transform: badgeVisible ? "rotate(-10deg) scale(1)" : "rotate(-10deg) scale(0.7)", display:"inline-block", marginTop:"-3.5rem", position:"relative", zIndex:3, opacity: badgeVisible ? 1 : 0, transition:"opacity 0.35s ease, transform 0.35s ease" }}>
        {editionLabel}
      </div>
    );
  };

  return (
    <div className={`intro-screen${isDaily ? " intro-daily" : ""}${editionMeta.key === "weekly" ? " intro-weekly" : ""}${toyArtwork ? " intro-toy" : ""}`} style={{
      position:"fixed", inset:0,
      ...bgStyle,
      display:"flex", flexDirection:"column", alignItems:"center",
    }}>
      <div className="intro-overlay" style={{ position:"absolute", inset:0, background:"rgba(10,22,40,"+overlayOpacity+")", pointerEvents:"none" }}/>

      <div style={{
        position:"relative", zIndex:1, flex:1, width:"100%",
        display:"flex", flexDirection:"column", alignItems:"center",
        opacity: show ? 1 : 0, transition:"opacity 0.8s ease",
      }}>
        <div className="intro-date" style={{ width:"100%", textAlign:"center", paddingTop:"clamp(2rem, 7vh, 3.5rem)", fontSize:"0.72rem", color:C.dimmer, fontFamily:"'JetBrains Mono', monospace", letterSpacing:"0.06em" }}>
          {dateLabel}
        </div>
        <div style={{ marginTop:"0.65rem", display:"flex", alignItems:"center", justifyContent:"center", gap:"0.75rem", color:C.text, fontFamily:"'JetBrains Mono', monospace", fontSize:"0.66rem", letterSpacing:"0.08em" }}>
          <span style={{ color:C.text, fontWeight:700 }}>YOUR DAILY GAME OF SANITY</span>
        </div>

        <div className="intro-message" style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:"clamp(1rem, 3vh, 1.8rem)", paddingBottom: taglinesBelow ? "0" : isDaily ? "clamp(10rem, 30dvh, 18rem)" : "clamp(6rem, 16vh, 10rem)" }}>
          <AnimatedLogo onSolved={() => setLogoSolved(true)} />
          {renderBadge()}
          {!taglinesBelow && (
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"0.35rem" }}>
              {taglines.map((t, i) => (
                <div key={i} className={`intro-tagline${t.stamp ? " intro-stamp" : ""}${i < taglineCount ? " intro-tagline-visible" : ""}`} style={{ fontSize:t.size, fontWeight:t.weight, color:t.color, fontFamily:"'Space Grotesk', sans-serif" }}>{t.text}</div>
              ))}
            </div>
          )}
        </div>
      </div>

      {taglinesBelow && (
        <div style={{ position:"absolute", bottom:"clamp(8rem, 18vh, 12rem)", zIndex:2, display:"flex", flexDirection:"column", alignItems:"center", gap:"0.35rem", width:"100%" }}>
          {taglines.map((t, i) => (
            <div key={i} className={`intro-tagline${t.stamp ? " intro-stamp" : ""}${i < taglineCount ? " intro-tagline-visible" : ""}`} style={{ fontSize:t.size, fontWeight:t.weight, color:t.color, fontFamily:"'Space Grotesk', sans-serif" }}>{t.text}</div>
          ))}
        </div>
      )}

      <div className="intro-action" style={{ position:"absolute", bottom:"clamp(4rem, 11vh, 7rem)", zIndex:2, display:"flex", justifyContent:"center", width:"100%" }}>
        <button className={taglineCount >= taglines.length ? "intro-cta intro-cta-ready" : "intro-cta"} onClick={onStart} style={{
          background:buttonColor, color:"#ffffff", border:"none", borderRadius:"14px",
          padding:"1rem 3rem", fontSize:"1.05rem", fontWeight:700, cursor:"pointer",
          fontFamily:"'Space Grotesk', sans-serif", letterSpacing:"0.05em",
          transition:"transform 0.2s ease",
          boxShadow: taglinesBelow ? "0 4px 24px rgba(10,22,40,0.6)" : "0 4px 24px rgba(178,34,52,0.5)",
          width:"clamp(220px, 65vw, 280px)",
        }}
          onMouseEnter={e => e.target.style.transform="scale(1.05)"}
          onMouseLeave={e => e.target.style.transform="scale(1)"}
        >{isDaily ? "SORT THE CHAOS" : "SORT THE CHAOS!"}</button>
      </div>
    </div>
  );
}

function RevealScreen({ events, onRevealComplete }) {
  const [revealed, setRevealed] = useState(0);
  useEffect(() => {
    if (revealed < events.length) { const t = setTimeout(() => setRevealed(r => r+1), 400); return () => clearTimeout(t); }
    else { const t = setTimeout(onRevealComplete, 800); return () => clearTimeout(t); }
  }, [revealed, events.length, onRevealComplete]);
  return (
    <div className="timeline-screen" style={{ "--event-count": events.length }}>
      <div style={{ height:"1rem", flexShrink:0 }}/>
      <div className="event-stack">
        {events.map((event, i) => (
          <div key={event.id} style={{
            background:C.card, border:"1px solid "+C.border, borderRadius:"12px",
            padding:"clamp(0.5rem,1.2vh,1rem) clamp(1rem,3vw,1.5rem)",
            display:"flex", alignItems:"center", justifyContent:"center", flex:1, minHeight:0, overflow:"hidden",
            opacity: i < revealed ? 1 : 0, transform: i < revealed ? "translateX(0)" : "translateX(-20px)",
            transition:"all 0.4s cubic-bezier(0.16,1,0.3,1)",
          }}>
            <div style={{ fontSize:"clamp(0.92rem,2.6vw,1.08rem)", fontWeight:600, color:C.text, fontFamily:"'DM Sans', sans-serif", lineHeight:1.18, textAlign:"center" }}>
              {eventHeadline(event)}
            </div>
          </div>
        ))}
      </div>
      {revealed >= events.length && (
        <div style={{ textAlign:"center", marginTop:"1.5rem", fontSize:"0.85rem", color:C.dimmer, fontFamily:"'JetBrains Mono', monospace", animation:"pulse 1s ease infinite" }}>Shuffling...</div>
      )}
    </div>
  );
}

function reorderAroundLocks(events, fromIndex, toIndex, lockedCorrect) {
  const dragged = events[fromIndex];
  const result = new Array(events.length).fill(null);
  events.forEach((ev, i) => { if (lockedCorrect[ev.id]) result[i] = ev; });
  const unlocked = events.filter((ev, i) => !lockedCorrect[ev.id] && i !== fromIndex);
  let insertAt = 0;
  for (let i = 0; i < toIndex; i++) { if (!result[i]) insertAt++; }
  unlocked.splice(insertAt, 0, dragged);
  let ui = 0;
  for (let i = 0; i < result.length; i++) { if (!result[i]) result[i] = unlocked[ui++]; }
  return result;
}

function DraggableList({ events, lockedCorrect, wrongCards, onReorder }) {
  const [dragIndex, setDragIndex] = useState(null);
  const [overIndex, setOverIndex] = useState(null);
  const listRef = useRef(null);
  const pointerCleanup = useRef(null);
  useEffect(() => () => pointerCleanup.current?.(), []);
  const eventsRef = useRef(events);
  eventsRef.current = events;

  const moveCard = (index, direction) => {
    let target = index + direction;
    while (target >= 0 && target < events.length && lockedCorrect[events[target].id]) target += direction;
    if (target < 0 || target >= events.length || lockedCorrect[events[index].id]) return;
    playCardTone("drop");
    onReorder(reorderAroundLocks(events, index, target, lockedCorrect));
  };

  // Pointer events work consistently for mouse, pen and touch. Native HTML
  // dragging varies between WebKit and embedded browsers.
  const handlePointerStart = (e, index) => {
    if (e.button !== 0 || !e.isPrimary || e.target.closest("button") || lockedCorrect[events[index].id]) return;
    pointerCleanup.current?.();
    const target=e.currentTarget;
    target.focus();
    const rect=target.getBoundingClientRect();
    const startY=e.clientY;
    const clone=target.cloneNode(true);
    clone.setAttribute("aria-hidden","true");
    Object.assign(clone.style,{position:"fixed",left:`${rect.left}px`,top:`${rect.top}px`,width:`${rect.width}px`,height:`${rect.height}px`,zIndex:9999,opacity:".9",transform:"scale(1.03)",pointerEvents:"none",transition:"none"});
    document.body.appendChild(clone);
    playCardTone("pickup");
    setDragIndex(index);
    let destination=null;
    const move=ev=>{
      if(ev.pointerId!==e.pointerId) return;
      ev.preventDefault();
      clone.style.top=`${rect.top+ev.clientY-startY}px`;
      destination=null;
      Array.from(listRef.current?.children || []).forEach((item,i)=>{
        const bounds=item.getBoundingClientRect();
        if(ev.clientY>=bounds.top && ev.clientY<=bounds.bottom && i!==index) destination=i;
      });
      setOverIndex(destination);
    };
    const cleanup=()=>{
      document.removeEventListener("pointermove",move);
      document.removeEventListener("pointerup",end);
      document.removeEventListener("pointercancel",end);
      clone.remove();
      pointerCleanup.current=null;
    };
    const end=ev=>{
      if(ev.pointerId!==e.pointerId) return;
      cleanup();
      playCardTone("drop");
      if(ev.type==="pointerup" && destination!==null) onReorder(reorderAroundLocks(eventsRef.current,index,destination,lockedCorrect));
      setDragIndex(null); setOverIndex(null);
    };
    pointerCleanup.current=cleanup;
    document.addEventListener("pointermove",move,{passive:false});
    document.addEventListener("pointerup",end);
    document.addEventListener("pointercancel",end);
  };


  return (
    <div ref={listRef} className="event-stack" role="list" aria-label="Timeline, oldest first">
      {events.map((event, index) => {
        const isLocked = !!lockedCorrect[event.id];
        const isWrong  = !!wrongCards[event.id];
        const isOver   = overIndex === index;
        return (
          <div key={event.id} draggable={false} role="listitem" tabIndex={isLocked ? -1 : 0}
            aria-label={`${index + 1}. ${eventHeadline(event)}. ${isLocked ? "Correct and locked." : "Use up and down arrow keys to move."}`}
            onKeyDown={e => { if (e.key === "ArrowUp" || e.key === "ArrowDown") { e.preventDefault(); moveCard(index, e.key === "ArrowUp" ? -1 : 1); } }}
            onPointerDown={e => handlePointerStart(e,index)}
            style={{
              background: isLocked ? C.locked : isOver ? C.cardOver : C.card,
              border: isLocked ? "none" : isOver ? "1px solid "+C.borderHi : "1px solid "+C.border,
              borderRadius:"12px", padding:"clamp(0.4rem,1.2vh,1rem) clamp(1rem,3vw,1.5rem)",
              display:"flex", alignItems:"center", justifyContent:"center",
              position:"relative", minHeight:0, overflow:"hidden",
              cursor: isLocked ? "default" : "grab", userSelect:"none", touchAction:isLocked ? "auto" : "none",
              opacity: dragIndex === index ? 0.3 : 1,
              transition: isLocked ? "background 0.3s ease" : "none",
              animation: isWrong ? "shake 0.4s ease" : isLocked ? "celebrate 0.5s ease" : "none",
            }}>
            <div style={{ flex:1, fontSize:"clamp(0.92rem,2.6vw,1.08rem)", fontWeight:600, color: isLocked ? C.bg : C.text, fontFamily:"'DM Sans', sans-serif", lineHeight:1.18, textAlign:"center" }}>
              {eventHeadline(event)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Live star row shown during play, dims one star per failed attempt
function LiveStars({ failedAttempts }) {
  const total = MAX_ATTEMPTS;
  return (
    <div style={{ display:"flex", gap:"5px", alignItems:"center" }}>
      {Array.from({ length: total }, (_, i) => {
        const active = i < (total - failedAttempts);
        return (
          <svg key={i} width="18" height="18" viewBox="0 0 24 24"
            fill={active ? C.gold : "none"}
            stroke={active ? C.gold : C.dimmer}
            strokeWidth="2" strokeLinejoin="round"
            style={{ transition:"all 0.35s cubic-bezier(0.34,1.56,0.64,1)", transform: active ? "scale(1)" : "scale(0.8)", opacity: active ? 1 : 0.3 }}>
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
        );
      })}
    </div>
  );
}

// Game Over screen, shows correct answer with hints
function GameOverScreen({ events, onViewChain, firstVisit, onMount, meta, puzzleDate }) {
  const hasRun = useRef(false);
  const [portraitReady, setPortraitReady] = useState(false);
  const [bubbleVisible, setBubbleVisible] = useState(false);
  useEffect(() => {
    if (!portraitReady) return;
    const timer = setTimeout(() => setBubbleVisible(true), 1000);
    return () => clearTimeout(timer);
  }, [portraitReady]);
  const countdown = useNextPuzzleCountdown();
  useEffect(() => {
    if (!hasRun.current) {
      hasRun.current = true;
      if (firstVisit) {
        onMount();
        saveStats(null, 0, puzzleDate, meta?.key, false, events.length);
      }
    }
  }, [firstVisit, onMount, puzzleDate, meta?.key, events.length]);

  return (
    <div className="game-over-screen" data-ready={portraitReady} style={{ position:"fixed", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"flex-start", background:BLUE_SCREEN_BACKGROUND, overflowY:"auto", overflowX:"hidden" }}>
      {/* The portrait stays still. Only the separate speech bubble stamps in. */}
      <div className="loser-artwork">
        <div className="loser-character"><img className="loser-portrait" src={LOSER_IMG} alt="" onLoad={() => setPortraitReady(true)} onError={() => setPortraitReady(true)} /></div>
        {bubbleVisible && <div className="loser-bubble-position"><div className="loser-bubble">LOSER!</div></div>}
      </div>

      {/* Overlay gradient so text is readable at top */}


      {/* Content */}
      <div className="game-over-copy" style={{ position:"relative", zIndex:2, flexShrink:0, width:"100%", maxWidth:"440px", padding:"0 1.5rem", display:"flex", flexDirection:"column", alignItems:"center", paddingTop:"clamp(2rem, 6dvh, 3.5rem)", paddingBottom:0 }}>
        {/* GAME OVER */}
        <div style={{ fontFamily:"'Space Grotesk', sans-serif", fontSize:"3rem", fontWeight:900, color:C.red, letterSpacing:"-0.02em", lineHeight:1, textAlign:"center", marginBottom:"0.4rem", textShadow:"0 2px 24px rgba(220,53,69,0.5)" }}>
          GAME OVER
        </div>

        {/* See The Right Timeline */}
        <button
          onClick={onViewChain}
          style={{ background:"#1a1f2e", border:"1.5px solid rgba(255,255,255,0.15)", borderRadius:"14px", padding:"0.85rem 2rem", color:C.text, fontFamily:"'Space Grotesk', sans-serif", fontSize:"1rem", fontWeight:700, cursor:"pointer", letterSpacing:"0.01em", marginTop:"0.75rem", width:"100%" }}>
          See The Right Timeline
        </button>

        {/* Share your horrible score */}
        <button
          onClick={async () => {
            const msg = losingShareText({ puzzleDate, eventCount: events.length });
            if (navigator.share) {
              try { await navigator.share({ text: msg }); return; } catch (_) {}
            }
            try { await navigator.clipboard.writeText(msg); alert("Copied to clipboard!"); } catch (_) {}
          }}
          style={{ background:"#1a1f2e", border:"1.5px solid rgba(255,255,255,0.15)", borderRadius:"14px", padding:"0.85rem 2rem", color:C.text, fontFamily:"'Space Grotesk', sans-serif", fontSize:"1rem", fontWeight:700, cursor:"pointer", letterSpacing:"0.01em", marginTop:"0.6rem", width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:"0.5rem" }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
          Share Your Horrible Score
        </button>

        {/* Try Again Tomorrow */}
        <div style={{ marginTop:"0.75rem", fontFamily:"'JetBrains Mono', monospace", fontSize:"0.75rem", color:C.dimmer, letterSpacing:"0.06em", textAlign:"center" }}>
          NEXT CHAOS IN {countdown}
        </div>
      </div>
    </div>
  );
}
function PlayingScreen({ events, edition, lockedCorrect, wrongCards, onReorder, onLockIn, timeDisplay, failedAttempts=0, feedback, isReadOnly=false, onBackToResults, backLabel="Back to Score" }) {
  const [detail, setDetail] = useState(null);
  const detailRef = useRef(null);
  const detailTrigger = useRef(null);
  useEffect(() => {
    if (detail) detailRef.current?.showModal();
    else if (detailRef.current?.open) detailRef.current.close();
  }, [detail]);
  const allCorrect = events.length > 0 && events.every(ev => lockedCorrect[ev.id]);
  const lockedCount = Object.keys(lockedCorrect).length;

  if (isReadOnly) {
    return (
      <div className="timeline-screen" style={{ "--event-count": events.length }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0, marginBottom:"0.75rem" }}>
          <button onClick={onBackToResults} style={{ background:"transparent", border:"none", color:C.dim, cursor:"pointer", fontFamily:"'DM Sans', sans-serif", fontSize:"0.85rem" }}>&#8592; {backLabel}</button>
          <div/>
        </div>
        <div className="event-stack">
          {events.map(event => (
            <button key={event.id} onClick={e => { detailTrigger.current = e.currentTarget; setDetail(event); }} style={{ border:0, cursor:"pointer", background:C.locked, borderRadius:"12px", padding:"clamp(0.38rem,0.8vh,0.62rem) clamp(0.8rem,2.6vw,1.2rem)", display:"flex", alignItems:"center", justifyContent:"center", minHeight:0, overflow:"hidden" }}>
              <div style={{ textAlign:"center", width:"100%", minWidth:0 }}>
                <div style={{ fontSize:"clamp(0.86rem,2.4vw,1rem)", fontWeight:700, color:C.bg, fontFamily:"'DM Sans', sans-serif", lineHeight:1.12, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>{eventHeadline(event)}</div>
                <div style={{ marginTop:"0.3rem", fontSize:"0.75rem", color:"#24313c", fontFamily:"'JetBrains Mono', monospace", fontWeight:700 }}>{formatEventDate(event.date, event.year)}</div>
              </div>
            </button>
          ))}
        </div>
        <dialog ref={detailRef} className="event-detail" onClose={() => { setDetail(null); detailTrigger.current?.focus(); }}>
          {detail && <>
            <button autoFocus className="detail-close" onClick={() => detailRef.current?.close()}>Close</button>
            <p>{formatEventDate(detail.date, detail.year)}</p>
            <h2>{eventHeadline(detail)}</h2>
            {detail.sources?.length ? <ul>{detail.sources.map(source => <li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer">Read {source.name} ↗</a></li>)}</ul> : <p>Source link not yet available for this archived card.</p>}
          </>}
        </dialog>
      </div>
    );
  }

  return (
    <div className="timeline-screen playing-screen" style={{ "--event-count": events.length }}>
      <div className="gameplay-content">
      <h1 className="gameplay-headline">{gameplayHeadline(edition)}</h1>
      {/* Header: stars left, timer right */}
      <div className="gameplay-status" style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0, marginBottom:"0.5rem" }}>
        <LiveStars failedAttempts={failedAttempts}/>
        <div style={{ fontSize:"clamp(1.1rem,3.2vw,1.35rem)", fontFamily:"'JetBrains Mono', monospace", color:C.gold, fontWeight:700, letterSpacing:"0.04em" }}>{timeDisplay}</div>
      </div>
      <p className="timeline-instructions">{SORT_INSTRUCTIONS}</p>
      <div className="gameplay-progress" style={{ height:"3px", background:C.dimmest, borderRadius:"2px", marginBottom:"0.6rem", flexShrink:0 }}>
        <div style={{ height:"100%", width:((lockedCount/events.length)*100)+"%", background:C.red, borderRadius:"2px", transition:"width 0.4s ease" }}/>
      </div>
      <DraggableList events={events} lockedCorrect={lockedCorrect} wrongCards={wrongCards} onReorder={onReorder}/>
      <div className="sr-only" role="status" aria-live="polite">{feedback}</div>
      {!allCorrect && (
        <button className="lock-in-button" onClick={onLockIn} style={{
          marginTop:"clamp(0.5rem,1.5vh,1rem)", background:C.red, color:"#fff",
          border:"none", borderRadius:"14px", padding:"clamp(0.7rem,1.8vh,1rem) 2rem",
          fontSize:"clamp(0.9rem,2.5vw,1.05rem)", fontWeight:900, cursor:"pointer",
          fontFamily:"'Space Grotesk', sans-serif", letterSpacing:"0.04em",
          flexShrink:0, width:"100%", transition:"transform 0.15s ease",
          boxShadow:"0 4px 18px rgba(178,34,52,0.4)",
        }}
          onMouseEnter={e => e.currentTarget.style.transform="scale(1.02)"}
          onMouseLeave={e => e.currentTarget.style.transform="scale(1)"}
        >Lock It In!</button>
      )}
      {allCorrect && (
        <div className="gameplay-sorted" style={{ textAlign:"center", marginTop:"1rem", fontSize:"0.85rem", color:C.dim, fontFamily:"'JetBrains Mono', monospace", animation:"pulse 1s ease infinite", flexShrink:0 }}>Chaos sorted...</div>
      )}
      </div>
    </div>
  );
}

function ShareIcons({ time, stars, puzzleDate, hintUsed, eventCount }) {
  const { display } = formatTime(time);
  const msg = winningShareText({ display, stars, puzzleDate, hintUsed, eventCount });

  async function generateAndShare() {
    if (navigator.share) {
      try { await navigator.share({ text: msg }); return; } catch (_) {}
    }

    try {
      await navigator.clipboard.writeText(msg);
      alert("Copied to clipboard!");
    } catch (_) {}
  }

  return (
    <button onClick={generateAndShare} style={{
      marginTop:"0.6rem",
      width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:"0.55rem",
      background:C.card, border:"1px solid "+C.border, borderRadius:"14px",
      padding:"0.9rem 0", cursor:"pointer", fontFamily:"'DM Sans', sans-serif",
      fontSize:"0.95rem", fontWeight:700, color:C.text, transition:"background 0.15s, transform 0.15s",
    }}
      onMouseEnter={e => { e.currentTarget.style.background=C.cardOver; e.currentTarget.style.transform="scale(1.03)"; }}
      onMouseLeave={e => { e.currentTarget.style.background=C.card; e.currentTarget.style.transform="scale(1)"; }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
        <polyline points="16 6 12 2 8 6"/>
        <line x1="12" y1="2" x2="12" y2="15"/>
      </svg>
      Share Your Score
    </button>
  );
}

function CompleteScreen({ time, failedAttempts, onViewChain, firstVisit, onMount, meta, puzzleDate, hintUsed, eventCount, scoreEventCount }) {
  const stars = getStars(failedAttempts);
  const { display } = formatTime(time);
  const [celebWord] = useState(() => getCelebWord(stars));
  const [showConfetti, setShowConfetti] = useState(false);
  const [stats, setStats] = useState({ played: 0, perfects: 0, best: null, streak: 0 });
  const hasRun = useRef(false);
  const countdown = useNextPuzzleCountdown();
  const editionName = EDITION_NAMES[meta?.key] || "Trumple";
  const records = editionTimeStats(stats.results, meta?.key, eventCount);
  const hasTime = Number.isFinite(time) && time > 0;

  useEffect(() => {
    if (!hasRun.current) {
      hasRun.current = true;
      if (firstVisit) {
        onMount(); saveStats(time, stars, puzzleDate, meta?.key, hintUsed, eventCount);
        setShowConfetti(true); setTimeout(() => setShowConfetti(false), 4000);
      }
      setStats(getStats(puzzleDate));
    }
  }, [firstVisit, onMount, time, stars, puzzleDate, meta?.key, hintUsed, eventCount]);

  return (
    <>
      <Confetti active={showConfetti}/>
      <div className="results-screen" style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"1.5rem 1.25rem", maxWidth:"440px", margin:"0 auto", height:"100dvh", overflowY:"auto", justifyContent:"safe center" }}>
        <StarDisplay stars={stars} size={32} celebrate={firstVisit}/>
        <div style={{ marginTop:"0.6rem", fontSize:"1.6rem", fontWeight:900, fontFamily:"'Space Grotesk', sans-serif", color:C.gold, letterSpacing:"-0.01em" }}>{celebWord}</div>
        <div style={{ marginTop:"1rem", fontSize:hasTime ? "clamp(3rem,12vw,4.5rem)" : "1rem", fontWeight:700, fontFamily:"'JetBrains Mono', monospace", color:C.text, letterSpacing:"-0.02em", lineHeight:1 }}>{hasTime ? display : "Time not recorded"}</div>
        <div style={{ marginTop:"1rem", display:"grid", gridTemplateColumns:"repeat(3, minmax(0, 1fr))", gap:"0.5rem", width:"100%" }}>
          {[
            { label:"PLAYED",         val: stats.played   || 1 },
            { label:"PERFECT SCORES", val: stats.perfects || 0 },
            { label:"STREAK",         val: "🔥 " + (stats.streak || 0) },
          ].map(({ label, val }) => (
            <div key={label} style={{ minWidth:0, background:C.card, border:"1px solid "+C.border, borderRadius:"12px", padding:"0.75rem 0.35rem", textAlign:"center" }}>
              <div style={{ fontSize:"0.48rem", color:C.dimmer, fontFamily:"'JetBrains Mono', monospace", letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:"0.3rem", lineHeight:1.3 }}>{label}</div>
              <div style={{ fontSize:"clamp(0.8rem, 3.6vw, 1rem)", fontWeight:700, fontFamily:"'JetBrains Mono', monospace", color:C.text, whiteSpace:"nowrap" }}>{val}</div>
            </div>
          ))}
        </div>
        {records.history.length > 0 && (() => {
          const minTime = records.best;
          const history = records.history;
          return (
            <div style={{ width:"100%", marginTop:"1.25rem" }}>
              <div style={{ fontSize:"0.6rem", color:C.dimmer, fontFamily:"'JetBrains Mono', monospace", letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:"0.6rem" }}>YOUR LAST 5 {editionName.toUpperCase()} WINS · {eventCount} EVENTS</div>
              {history.map((result, i) => {
                const t = result.timeMs;
                const pct = t > 0 ? (minTime / t) * 100 : 100;
                return (
                  <div key={result.date} title={result.date} style={{ display:"flex", alignItems:"center", gap:"0.5rem", marginBottom:"0.35rem" }}>
                    <div style={{ width:"1rem", fontSize:"0.6rem", color:C.dimmer, fontFamily:"'JetBrains Mono', monospace", textAlign:"right", flexShrink:0 }}>{history.length - i}</div>
                    <div style={{ flex:1, background:C.card, borderRadius:"6px", height:"2rem", position:"relative", overflow:"hidden" }}>
                      <div style={{ position:"absolute", left:0, top:0, height:"100%", width:pct+"%", background: "rgba(255,255,255,0.08)", borderRadius:"6px", transition:"width 0.6s ease" }}/>
                      <div style={{ position:"absolute", right:"0.6rem", top:"50%", transform:"translateY(-50%)", fontSize:"0.75rem", fontWeight:700, fontFamily:"'JetBrains Mono', monospace", color: C.text }}>{formatTime(t).display}{result.hintUsed ? " · nudge" : ""}</div>
                    </div>
                  </div>
                );
              })}
              {records.best && (
                <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", marginTop:"0.5rem" }}>
                  <div style={{ width:"1rem", fontSize:"0.6rem", color:C.gold, fontFamily:"'JetBrains Mono', monospace", textAlign:"right", flexShrink:0 }}>★</div>
                  <div style={{ flex:1, background:C.gold, borderRadius:"6px", height:"2rem", position:"relative", overflow:"hidden" }}>
                    <div style={{ position:"absolute", right:"0.6rem", top:"50%", transform:"translateY(-50%)", fontSize:"0.75rem", fontWeight:700, fontFamily:"'JetBrains Mono', monospace", color:"#1a1a2e" }}>BEST&nbsp;&nbsp;{formatTime(records.best).display}</div>
                  </div>
                </div>
              )}
            </div>
          );
        })()}
        {!records.history.length && <p style={{marginTop:"1rem",fontSize:".8rem",color:C.dim,textAlign:"center"}}>No recorded times yet.</p>}
        {(records.earlier.length > 0 || stats.history?.length > 0 || stats.best) && <details style={{width:"100%",marginTop:".75rem",fontSize:".75rem",color:C.dim}}>
          <summary style={{cursor:"pointer"}}>Earlier scores</summary>
          <p style={{margin:".5rem 0"}}>Older or unlabelled formats are saved, but kept out of this edition's records.</p>
          {records.earlier.map(result=><p key={result.date} style={{marginTop:".3rem"}}>{result.date} · {editionLabel(result.edition,result.eventCount)} · {formatTime(result.timeMs).display}</p>)}
          {!!stats.best && <p style={{marginTop:".5rem"}}>Old mixed-format best: {formatTime(stats.best).display}</p>}
          {Array.isArray(stats.history) && stats.history.length > 0 && <p style={{marginTop:".5rem"}}>Old mixed-format recent times: {stats.history.filter(t=>Number.isFinite(t) && t>0).slice(-5).reverse().map(t=>formatTime(t).display).join(", ")}</p>}
        </details>}
        <button onClick={onViewChain} style={{ marginTop:"0.75rem", background:"transparent", border:"1px solid "+C.border, borderRadius:"10px", padding:"0.5rem 1.25rem", color:C.dim, fontFamily:"'DM Sans', sans-serif", fontSize:"0.8rem", cursor:"pointer", display:"flex", alignItems:"center", gap:"0.4rem" }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
          View the "BEAUTIFUL" Trump Timeline
        </button>
        {hintUsed && <p style={{marginTop:".75rem",fontSize:".8rem",color:C.dim}}>Sorted with one nudge.</p>}
        {hasTime && <ShareIcons time={time} stars={stars} puzzleDate={puzzleDate} hintUsed={hintUsed} eventCount={scoreEventCount}/>}
        <div style={{ marginTop:"0.75rem", color:C.dimmer, fontFamily:"'JetBrains Mono', monospace", fontSize:"0.62rem", letterSpacing:"0.06em" }}>
          NEXT CHAOS IN {countdown}
        </div>
      </div>
    </>
  );
}

const SCREENS = { LOADING:"loading", ERROR:"error", INTRO:"intro", REVEAL:"reveal", PLAYING:"playing", CHAIN_VIEW:"chain_view", COMPLETE:"complete", GAME_OVER:"game_over" };

export default function TrumpleApp() {
  const [screen, setScreen]             = useState(SCREENS.LOADING);
  const [weeklyNotReady, setWeeklyNotReady] = useState(false);
  const [puzzle, setPuzzle]             = useState(null);
  const [answerOrder, setAnswerOrder]   = useState([]);
  const [yearMap, setYearMap]           = useState({});
  const [dateMap, setDateMap]           = useState({});
  const [isWeekly, setIsWeekly]         = useState(false);
  const [isSecondTerm, setIsSecondTerm] = useState(false);
  const [editionMeta, setEditionMeta]   = useState(null);
  const [events, setEvents]             = useState([]);
  const [revealEvents, setRevealEvents] = useState([]);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockedCorrect, setLockedCorrect] = useState({});
  const [wrongCards, setWrongCards]     = useState({});
  const [feedback, setFeedback]         = useState("");
  const [newDay, setNewDay]             = useState(null);
  const [restoredResult, setRestoredResult] = useState(null);
  const confettiShown = useRef(false);
  const gameOverShown = useRef(false);
  const chainViewSource = useRef(null);
  const terminalOutcome = useRef(null);
  const lastSubmission = useRef(0);
  const resultTransitionTimer = useRef(null);
  const timer = useTimer();

  useEffect(() => () => {
    if (resultTransitionTimer.current) clearTimeout(resultTransitionTimer.current);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const forceReplay = window.location.pathname === "/play" || params.get("challenge") === "1";
    const urlDate = params.get("date");
    const localDate = urlDate || pacificDate();
    const priorResult = dailyResultForDate(getStats(localDate).results, localDate);
    const format = params.get("format") || (!forceReplay && legacyFormatForScore(localDate, priorResult?.eventCount));
    const apiParams = new URLSearchParams({ date: localDate });
    if (format) apiParams.set("format", format);
    const abort = new AbortController();
    fetch("/api/trump-puzzle?" + apiParams, { cache:"no-store", signal:abort.signal })
      .then(async r => {
        const data = await r.json();
        if (!r.ok) {
          setWeeklyNotReady(data.code === "WEEKLY_NOT_READY");
          throw new Error(data.error || "No puzzle");
        }
        return data;
      })
      .then(data => {
        setPuzzle(data.puzzle);
        setAnswerOrder(data.answerOrder);
        setYearMap(data.yearMap);
        setDateMap(data.dateMap || {});
        setIsWeekly(!!data.isWeekly);
        setIsSecondTerm(!!data.isSecondTerm);
        setEditionMeta(introPresentation(data.editionMeta) || null);

        // Local design previews must never record a loss or change a streak.
        if (process.env.NODE_ENV === "development" && params.get("preview") === "loser") {
          setEvents(data.answerOrder.map(id => {
            const event = data.puzzle.events.find(item => item.id === id);
            return event ? { ...event, year: data.yearMap[id], date: data.dateMap?.[id] || null } : null;
          }).filter(Boolean));
          gameOverShown.current = true;
          setScreen(SCREENS.GAME_OVER);
          return;
        }

        const stats = getStats(data.puzzle.date);
        const saved = dailyResultForDate(stats.results, data.puzzle.date);
        if (!saved || forceReplay) {
          setRestoredResult(null);
          setScreen(SCREENS.INTRO);
          return;
        }

        const sorted = data.answerOrder.map(id => {
          const event = data.puzzle.events.find(item => item.id === id);
          return event ? { ...event, year: data.yearMap[id], date: data.dateMap?.[id] || null } : null;
        }).filter(Boolean);
        setEvents(sorted);
        setRevealEvents(sorted);
        setRestoredResult(saved);

        if (saved.won) {
          terminalOutcome.current = "won";
          const restoredStars = Number.isInteger(saved.stars) && saved.stars > 0 ? saved.stars : 3;
          const restoredTime = saved.timeMs || null;
          setRestoredResult({ ...saved, stars: restoredStars, timeMs: restoredTime });
          setFailedAttempts(3 - restoredStars);
          confettiShown.current = true;
          setScreen(SCREENS.COMPLETE);
        } else {
          terminalOutcome.current = "lost";
          gameOverShown.current = true;
          setScreen(SCREENS.GAME_OVER);
        }
      })
      .catch(error => { if (error.name !== "AbortError") setScreen(SCREENS.ERROR); });
    return () => abort.abort();
  }, []);

  useEffect(() => {
    if (!puzzle || new URLSearchParams(window.location.search).has("date")) return;
    const checkDate = () => { const today = pacificDate(); if (today > puzzle.date) setNewDay(today); };
    const interval = setInterval(checkDate, 1000);
    document.addEventListener("visibilitychange", checkDate);
    checkDate();
    return () => { clearInterval(interval); document.removeEventListener("visibilitychange", checkDate); };
  }, [puzzle]);

  const handleStart = () => {
    if (resultTransitionTimer.current) clearTimeout(resultTransitionTimer.current);
    terminalOutcome.current = null;
    lastSubmission.current = 0;
    const evts = puzzle.events.map(e => ({ ...e, year: yearMap[e.id], date: dateMap[e.id] || null }));
    const shuffled = shuffleArray(evts);
    setEvents(shuffled); setRevealEvents(shuffled);
    setFailedAttempts(0); setLockedCorrect({}); setWrongCards({});
    setFeedback("");
    setScreen(SCREENS.REVEAL);
  };

  const handleRevealComplete = useCallback(() => {
    const evts = puzzle.events.map(e => ({ ...e, year: yearMap[e.id], date: dateMap[e.id] || null }));
    setEvents(shuffleArray(evts)); setScreen(SCREENS.PLAYING); timer.start();
  }, [timer, puzzle, yearMap, dateMap]);

  const handleReorder = useCallback((newEvents) => setEvents(newEvents), []);

  const handleLockIn = () => {
    if (terminalOutcome.current || Date.now() - lastSubmission.current < 800) return;
    lastSubmission.current = Date.now();
    const newLocked = { ...lockedCorrect }; const newWrong = {};
    let anyNewCorrect = false;

    events.forEach((ev, i) => {
      if (lockedCorrect[ev.id]) return;
      if (isCorrectPosition(ev.id, answerOrder[i], dateMap, isWeekly)) { newLocked[ev.id] = true; anyNewCorrect = true; }
      else newWrong[ev.id] = true;
    });

    const allCorrect = Object.keys(newLocked).length === events.length;
    setLockedCorrect(newLocked); setWrongCards(newWrong);
    const count = Object.keys(newLocked).length;
    setFeedback(allCorrect ? "Chaos sorted." : `${count} of ${events.length} in the right spot. ${Math.max(0, MAX_ATTEMPTS - failedAttempts - 1)} ${MAX_ATTEMPTS - failedAttempts - 1 === 1 ? "try" : "tries"} left.`);
    setTimeout(() => setWrongCards({}), 800);

    if (allCorrect) {
      if (terminalOutcome.current) return;
      terminalOutcome.current = "won";
      timer.stop();
      resultTransitionTimer.current = setTimeout(() => {
        if (terminalOutcome.current === "won") setScreen(SCREENS.COMPLETE);
      }, 3200);
      return;
    }

    // Wrong, burn a star
    const newFailed = failedAttempts + 1;
    setFailedAttempts(newFailed);

    if (newFailed >= MAX_ATTEMPTS) {
      if (terminalOutcome.current) return;
      terminalOutcome.current = "lost";
      // Reveal correct order for game over screen
      timer.stop();
      // Sort events into correct answer order for display
      const sorted = [...answerOrder].map(id => events.find(ev => ev.id === id) || revealEvents.find(ev => ev.id === id));
      setEvents(sorted.filter(Boolean));
      resultTransitionTimer.current = setTimeout(() => {
        if (terminalOutcome.current === "lost") setScreen(SCREENS.GAME_OVER);
      }, 1000);
    }
  };

  return (
    <div className={`app-shell${newDay ? " has-new-day" : ""}`} style={{ background:screen === SCREENS.INTRO ? editionMeta?.bgColor || C.bg : C.bg, color:C.text, fontFamily:"'DM Sans', sans-serif" }}>
      <style>{globalStyles}</style>
      {newDay && <div className="new-day-banner" role="status">New day. Fresh chaos. <button onClick={() => window.location.assign(window.location.pathname)}>Play today</button></div>}
      {screen === SCREENS.LOADING    && <LoadingScreen/>}
      {screen === SCREENS.ERROR      && <ErrorScreen weeklyNotReady={weeklyNotReady}/>}
      {screen === SCREENS.INTRO      && puzzle && editionMeta && <IntroScreen puzzle={puzzle} onStart={handleStart} editionMeta={editionMeta}/>}
      {screen === SCREENS.REVEAL     && <RevealScreen events={revealEvents} onRevealComplete={handleRevealComplete}/>}
      {screen === SCREENS.PLAYING    && <PlayingScreen events={events} edition={editionMeta?.key} lockedCorrect={lockedCorrect} wrongCards={wrongCards} onReorder={handleReorder} onLockIn={handleLockIn} timeDisplay={formatTime(timer.time).display} failedAttempts={failedAttempts} feedback={feedback}/>}
      {screen === SCREENS.CHAIN_VIEW && <PlayingScreen events={events} lockedCorrect={lockedCorrect} wrongCards={{}} onReorder={()=>{}} onLockIn={()=>{}} timeDisplay="" isReadOnly={true} onBackToResults={() => setScreen(chainViewSource.current === "game_over" ? SCREENS.GAME_OVER : SCREENS.COMPLETE)} backLabel={chainViewSource.current === "game_over" ? "Game Over" : "Back to Score"}/>}
      {screen === SCREENS.COMPLETE   && <CompleteScreen time={restoredResult ? restoredResult.timeMs : timer.time} eventCount={puzzle.events.length} scoreEventCount={restoredResult ? restoredResult.eventCount : puzzle.events.length} failedAttempts={failedAttempts} onViewChain={() => { chainViewSource.current = "complete"; setScreen(SCREENS.CHAIN_VIEW); }} firstVisit={!restoredResult && !confettiShown.current} onMount={() => { confettiShown.current = true; }} meta={editionMeta} puzzleDate={puzzle.date} hintUsed={restoredResult?.hintUsed ?? false}/>}
      {screen === SCREENS.GAME_OVER  && <GameOverScreen events={events} onViewChain={() => { chainViewSource.current = "game_over"; setScreen(SCREENS.CHAIN_VIEW); }} firstVisit={!restoredResult && !gameOverShown.current} onMount={() => { gameOverShown.current = true; }} meta={editionMeta} puzzleDate={puzzle.date}/>}
    </div>
  );
}

const globalStyles = "@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@900&family=Space+Grotesk:wght@300;400;600;700;900&family=DM+Sans:wght@400;600;700&family=JetBrains+Mono:wght@400;600;700&display=swap');" +
  ".app-shell{height:100dvh;min-height:0;display:flex;flex-direction:column;overflow:hidden;}.app-shell>.timeline-screen{flex:1;height:auto;min-height:0;}" +
  ".timeline-screen{--event-count:7;--card-gap:clamp(3px,1dvh,9px);--card-height:clamp(48px,calc((100dvh - 344px)/7),104px);width:100%;max-width:440px;margin:0 auto;padding:max(.5rem,env(safe-area-inset-top)) max(.75rem,env(safe-area-inset-right)) max(.5rem,env(safe-area-inset-bottom)) max(.75rem,env(safe-area-inset-left));height:100dvh;min-height:0;display:flex;flex-direction:column;overflow:hidden;}" +
  ".gameplay-content{display:flex;flex-direction:column;flex:0 1 auto;min-height:0;max-height:100%;width:100%;margin-block:auto;}" +
  ".gameplay-headline{font-family:'Space Grotesk',sans-serif;font-size:clamp(1.25rem,5.5vw,1.55rem);font-weight:700;line-height:1.15;letter-spacing:-.025em;text-align:center;margin:0 0 .85rem;flex-shrink:0;text-wrap:balance;}" +
  ".results-screen>*{flex-shrink:0}" +
  ".event-stack{display:grid;grid-template-rows:repeat(var(--event-count),minmax(0,1fr));gap:var(--card-gap);height:calc(var(--event-count)*var(--card-height) + (var(--event-count) - 1)*var(--card-gap));flex:0 1 auto;min-height:0;container-type:size;}" +
  ".playing-screen .event-stack>div{padding:2px clamp(8px,3vw,24px) !important;}" +
  ".playing-screen .event-stack>div>div{font-size:clamp(.68rem,calc((100cqh / var(--event-count) - 10px) / 2.4),1.08rem) !important;}" +
  ".lock-in-button{min-height:44px;}" +
  "@media(max-height:600px){.gameplay-headline{font-size:1.1rem !important;margin-bottom:.35rem !important;}.timeline-instructions{margin-bottom:.35rem !important;}.gameplay-status{margin-bottom:.25rem !important;}.lock-in-button{padding:.5rem 1rem !important;}}" +
  "@media(max-height:500px) and (min-width:600px){.playing-screen{max-width:900px;}.gameplay-content{height:100%;display:grid;grid-template-columns:minmax(160px,.45fr) minmax(0,1fr);grid-template-rows:auto auto auto 1fr auto;column-gap:1rem;}.gameplay-headline{grid-column:1;grid-row:1;}.gameplay-status{grid-column:1;grid-row:2;}.timeline-instructions{grid-column:1;grid-row:3;}.gameplay-progress{grid-column:1;grid-row:4;}.gameplay-content>.event-stack{grid-column:2;grid-row:1/6;height:100%;}.lock-in-button,.gameplay-sorted{grid-column:1;grid-row:5;}}" +
  ".timeline-instructions{font-size:.78rem;line-height:1.4;color:#c5cbd3;text-align:center;margin:0 0 .65rem;flex-shrink:0;}" +
  ".sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap;border:0;}" +
  "button:focus-visible,[tabindex]:focus-visible,a:focus-visible{outline:3px solid #79bfff;outline-offset:3px}" +
  ".event-detail{margin:auto;width:calc(100% - 2rem);max-width:420px;max-height:85dvh;overflow:auto;padding:1.5rem;background:#152337;color:white;border:1px solid #637085;border-radius:16px;line-height:1.5}.event-detail::backdrop{background:#000a}.event-detail h2{font-size:1.2rem;margin:.8rem 0}.event-detail p{margin:.75rem 0}.event-detail ul{padding-left:1.2rem}.event-detail a{color:#9ccbff}.detail-close{display:block;margin-left:auto;background:transparent;color:white;border:1px solid #8793a4;border-radius:6px;padding:.4rem .8rem;cursor:pointer}" +
  ".new-day-banner{position:relative;flex-shrink:0;z-index:20;padding:.6rem;background:#f5c518;color:#0a1628;text-align:center}.new-day-banner button{margin-left:.5rem;padding:.4rem;border:0;border-radius:5px;background:#0a1628;color:white;cursor:pointer}" +
  "* { box-sizing: border-box; margin: 0; padding: 0; -webkit-text-size-adjust: 100%; }" +
  "body { background: #0A1628; margin: 0; overflow: hidden; }" +
  "html { overflow: hidden; }" +
  "::-webkit-scrollbar { display: none; }" +
  ".intro-overlay { animation: introUrgency 2.4s ease-in-out infinite; }" +
  ".intro-logo { filter: drop-shadow(0 8px 18px rgba(0,0,0,0.38)); }" +
  ".intro-logo-solved { animation: logoLock 0.65s cubic-bezier(0.2,0.8,0.2,1) both; }" +
  ".intro-tagline { opacity:0; transform:translateY(20px) scale(0.92); text-align:center; text-transform:uppercase; letter-spacing:0.025em; padding:0 1rem; }" +
  ".intro-tagline-visible { animation: urgentLineIn 0.52s cubic-bezier(0.18,0.9,0.28,1.25) both; }" +
  ".intro-stamp { border:4px double #f5c518;border-radius:3px;padding:.4rem .65rem;margin:.3rem 1rem .75rem;background:transparent;white-space:nowrap;transform-origin:50% 55%; }" +
  ".intro-stamp.intro-tagline-visible { animation:stampImpact .56s linear both; }" +
  ".intro-cta-ready { animation: ctaUrgency 1.35s ease-in-out infinite; }" +
  ".intro-daily .intro-cta-ready { animation:none; }" +
  ".intro-toy .intro-overlay { animation:none; }" +
  ".intro-toy { max-width:56.25dvh; margin-inline:auto; }" +
  ".intro-toy .intro-date { padding-top:2dvh !important; color:#f4c2b7 !important; }" +
  ".intro-toy .intro-logo { zoom:.55; }" +
  ".intro-toy .intro-tagline { font-size:clamp(.8rem,2.3dvh,1.05rem) !important; }" +
  ".intro-toy .intro-stamp { margin-bottom:.25rem; }" +
  ".intro-toy .intro-message { flex:0 !important; justify-content:flex-start !important; padding-top:1.5dvh; padding-bottom:0 !important; gap:0.35rem !important; }" +
  ".intro-toy .intro-tagline { text-shadow:0 1px 6px rgba(0,0,0,.35); }" +
  ".intro-weekly.intro-toy .intro-edition-badge { margin-top:0 !important; margin-bottom:.5rem; }" +
  ".intro-weekly.intro-toy .intro-action { bottom:max(2dvh,env(safe-area-inset-bottom)) !important; }" +
  ".intro-daily .intro-tagline:not(.intro-stamp) { text-transform:none;max-width:440px;text-wrap:balance; }" +
  ".game-over-screen[data-ready=false]>.loser-artwork,.game-over-screen[data-ready=false]>.game-over-copy{visibility:hidden;}" +
  ".loser-artwork{position:absolute;bottom:0;left:50%;transform:translateX(-50%);width:min(100vw,56.25dvh,540px);aspect-ratio:9/16;pointer-events:none;user-select:none;}" +
  ".loser-character{position:absolute;inset:0;transform:scale(.75);transform-origin:left bottom;}" +
  ".loser-portrait{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;}" +
  ".loser-bubble-position{position:absolute;left:45.75%;top:85%;}" +
  ".loser-bubble{position:relative;background:#fff;color:#050505;border-radius:22px;padding:.6em .5em;font-family:'Nunito',sans-serif;font-size:clamp(1.25rem,5.5vw,1.9rem);font-weight:900;line-height:1;transform-origin:0 50%;animation:loserStamp .48s linear both;}" +
  ".loser-bubble:before{content:'';position:absolute;top:52%;left:-20px;width:26px;height:9px;background:#fff;border-radius:100% 0 0 100%;transform:rotate(18deg);}" +
  "@keyframes shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-6px)} 40%{transform:translateX(6px)} 60%{transform:translateX(-4px)} 80%{transform:translateX(4px)} }" +
  "@keyframes celebrate { 0%{transform:scale(1)} 25%{transform:scale(1.03) rotate(-0.5deg)} 50%{transform:scale(1.05) rotate(0.5deg)} 75%{transform:scale(1.03) rotate(-0.3deg)} 100%{transform:scale(1)} }" +
  "@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }" +
  "@keyframes starPop { 0%{transform:scale(0);opacity:0} 50%{transform:scale(1.5);opacity:1} 75%{transform:scale(0.9)} 100%{transform:scale(1.15);opacity:1} }" +
  "@keyframes confettiFall { 0%{transform:translateY(-10px) translateX(0) rotate(0deg);opacity:1} 85%{opacity:1} 100%{transform:translateY(110vh) translateX(var(--cdrift)) rotate(var(--crot));opacity:0} }" +
  "@keyframes introUrgency { 0%,100%{opacity:1} 50%{opacity:0.82} }" +
  "@keyframes logoLock { 0%{transform:scale(1)} 35%{transform:scale(1.13) rotate(-1deg)} 62%{transform:scale(0.96) rotate(0.5deg)} 100%{transform:scale(1)} }" +
  "@keyframes urgentLineIn { 0%{opacity:0;transform:translateY(20px) scale(0.92)} 65%{opacity:1;transform:translateY(-3px) scale(1.035)} 100%{opacity:1;transform:translateY(0) scale(1)} }" +
  "@keyframes stampImpact { 0%{opacity:0;transform:translateY(-65px) rotate(-12deg) scale(2.6);filter:blur(5px)} 12%{opacity:1} 43%{opacity:1;transform:translateY(3px) rotate(-3deg) scale(.94, .88);filter:blur(0)} 58%{transform:translateY(-2px) rotate(-2deg) scale(1.035,1.025)} 75%{transform:translateY(1px) rotate(-3.2deg) scale(.995)} 100%{opacity:1;transform:translateY(0) rotate(-3deg) scale(1);filter:blur(0)} }" +
  "@keyframes ctaUrgency { 0%,100%{box-shadow:0 4px 24px rgba(178,34,52,0.5)} 50%{box-shadow:0 4px 36px rgba(245,197,24,0.72),0 0 0 5px rgba(245,197,24,0.12)} }" +
  "@keyframes loserStamp{0%{opacity:0;transform:translateY(-55px) rotate(-10deg) scale(2.4)} 12%{opacity:1} 58%{opacity:1;transform:translateY(2px) rotate(1deg) scale(.96,.88)} 78%{transform:translateY(-1px) rotate(-.5deg) scale(1.025,1.015)} 100%{opacity:1;transform:none}}" +
  "@media (prefers-reduced-motion: reduce) { .intro-overlay,.intro-logo-solved,.intro-tagline-visible,.intro-cta-ready,.loser-bubble { animation:none !important; } .intro-tagline-visible { opacity:1; transform:none; } }";
