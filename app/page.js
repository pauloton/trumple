"use client";
export const dynamic = "force-dynamic";
import { useState, useEffect, useCallback, useRef } from "react";
import { calculateCurrentStreak, recordDailyResult } from "../lib/player-stats.js";

const LOSER_IMG = "/bg/loser.jpg";

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
  dim:      "rgba(255,255,255,0.45)",
  dimmer:   "rgba(255,255,255,0.25)",
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

// stars = what you EARN if you solve it on this attempt
// failedAttempts = wrong Lock-Its so far (0, 1, 2)
// After 3 failed attempts → game over, never reaches complete
function getStars(failedAttempts) {
  if (failedAttempts === 0) return 3;
  if (failedAttempts === 1) return 2;
  return 1; // failedAttempts === 2
}

const MAX_ATTEMPTS = 3; // game over after this many failed lock-ins

function getStats() {
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
      streak: calculateCurrentStreak(results),
    };
  } catch { return { played: 0, perfects: 0, best: null, history: [], results: [], streak: 0 }; }
}
function saveStats(timeMs, stars, puzzleDate) {
  if (typeof window === "undefined") return;
  try {
    const prev = getStats();
    localStorage.setItem("trumple_played",   String(prev.played + 1));
    localStorage.setItem("trumple_perfects", String(prev.perfects + (stars === 3 ? 1 : 0)));
    if (timeMs && stars > 0 && (!prev.best || timeMs < prev.best)) localStorage.setItem("trumple_best", String(timeMs));
    if (timeMs) {
      const history = [...prev.history, timeMs].slice(-5);
      localStorage.setItem("trumple_history", JSON.stringify(history));
    }
    const results = recordDailyResult(prev.results, puzzleDate, stars > 0);
    localStorage.setItem("trumple_results", JSON.stringify(results));
  } catch {}
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

const WORDS_3 = ["Beautiful!", "Tremendous!", "Like nobody's ever seen!", "The greatest in history!", "Unbelievable!", "Phenomenal!", "Record-breaking!"];
const WORDS_2 = ["Terrific!", "Outstanding!", "Brilliant!", "Incredible!", "Fantastic!", "Huge!", "The best!"];
const WORDS_1 = ["Amazing!", "Winning!", "Never before!"];
function getCelebWord(stars) {
  const list = stars === 3 ? WORDS_3 : stars === 2 ? WORDS_2 : WORDS_1;
  return list[Math.floor(Math.random() * list.length)];
}

const SHARE_CTAS = ["Spread the chaos!", "Tell them!", "Pass it on!"];
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
    let tick = 0; const CHAOS = 22; let step = 0;
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
    }, 65);
    return () => clearInterval(interval);
  }, []);

  const lw = "clamp(2.4rem, 8.4vw, 4.8rem)";
  const fs = "clamp(2.4rem, 8.4vw, 4.8rem)";
  const h  = "clamp(3rem, 10.5vw, 5.7rem)";

  return (
    <div style={{ position:"relative", height:h, width:"calc("+lw+" * "+n+")", margin:"0 auto" }}>
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

function ErrorScreen() {
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"100dvh", padding:"2rem", textAlign:"center" }}>
      <div style={{ fontFamily:"'Space Grotesk', sans-serif", fontWeight:900, fontSize:"2.2rem", color:C.text }}>TRUMPLE</div>
      <div style={{ marginTop:"1.5rem", color:C.dim, fontSize:"0.9rem" }}>No puzzle today</div>
      <div style={{ marginTop:"0.5rem", color:C.dimmer, fontSize:"0.75rem" }}>Check back tomorrow!</div>
    </div>
  );
}

function IntroScreen({ onStart, puzzle, editionMeta }) {
  const [show, setShow] = useState(false);
  const [logoSolved, setLogoSolved] = useState(false);
  const [badgeVisible, setBadgeVisible] = useState(false);
  const [taglineCount, setTaglineCount] = useState(0);

  useEffect(() => { setTimeout(() => setShow(true), 100); }, []);

  useEffect(() => {
    if (!logoSolved) return;
    const timers = [
      setTimeout(() => setBadgeVisible(true), 0),
      setTimeout(() => setTaglineCount(1), 350),
      setTimeout(() => setTaglineCount(2), 750),
      setTimeout(() => setTaglineCount(3), 1150),
    ];
    return () => timers.forEach(clearTimeout);
  }, [logoSolved]);

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
  const taglines = editionTaglines.map(text => ({ text, size:"1.05rem", weight:600, color:C.text }));
  const bgStyle = { backgroundImage:"url("+bgImageUrl+")", backgroundSize:"cover", backgroundPosition:"center bottom" };

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
      <div style={{ background:C.gold, color:"#1a1a2e", borderRadius:"10px", padding:"0.125rem 0.45rem", fontSize:"0.975rem", fontWeight:900, fontFamily:"'JetBrains Mono', monospace", letterSpacing:"0.12em", transform: badgeVisible ? "rotate(-10deg) scale(1)" : "rotate(-10deg) scale(0.7)", display:"inline-block", marginTop:"-3.5rem", position:"relative", zIndex:3, opacity: badgeVisible ? 1 : 0, transition:"opacity 0.35s ease, transform 0.35s ease" }}>
        {editionLabel}
      </div>
    );
  };

  return (
    <div style={{
      position:"fixed", inset:0,
      ...bgStyle,
      display:"flex", flexDirection:"column", alignItems:"center",
    }}>
      <div style={{ position:"absolute", inset:0, background:"rgba(10,22,40,"+overlayOpacity+")", pointerEvents:"none" }}/>

      <div style={{
        position:"relative", zIndex:1, flex:1, width:"100%",
        display:"flex", flexDirection:"column", alignItems:"center",
        opacity: show ? 1 : 0, transition:"opacity 0.8s ease",
      }}>
        <div style={{ width:"100%", textAlign:"center", paddingTop:"clamp(2rem, 7vh, 3.5rem)", fontSize:"0.72rem", color:C.dimmer, fontFamily:"'JetBrains Mono', monospace", letterSpacing:"0.06em" }}>
          {dateLabel}
        </div>

        <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:"clamp(1rem, 3vh, 1.8rem)", paddingBottom: taglinesBelow ? "0" : "clamp(6rem, 16vh, 10rem)" }}>
          <AnimatedLogo onSolved={() => setLogoSolved(true)} />
          {renderBadge()}
          {!taglinesBelow && (
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"0.35rem" }}>
              {taglines.map((t, i) => (
                <div key={i} style={{ fontSize:t.size, fontWeight:t.weight, color:t.color, fontFamily:"'Space Grotesk', sans-serif", opacity: i < taglineCount ? 1 : 0, transform: i < taglineCount ? "translateY(0)" : "translateY(10px)", transition:"opacity 0.45s ease, transform 0.45s ease" }}>{t.text}</div>
              ))}
            </div>
          )}
        </div>
      </div>

      {taglinesBelow && (
        <div style={{ position:"absolute", bottom:"clamp(8rem, 18vh, 12rem)", zIndex:2, display:"flex", flexDirection:"column", alignItems:"center", gap:"0.35rem", width:"100%" }}>
          {taglines.map((t, i) => (
            <div key={i} style={{ fontSize:t.size, fontWeight:t.weight, color:t.color, fontFamily:"'Space Grotesk', sans-serif", opacity: i < taglineCount ? 1 : 0, transform: i < taglineCount ? "translateY(0)" : "translateY(10px)", transition:"opacity 0.45s ease, transform 0.45s ease" }}>{t.text}</div>
          ))}
        </div>
      )}

      <div style={{ position:"absolute", bottom:"clamp(4rem, 11vh, 7rem)", zIndex:2, display:"flex", justifyContent:"center", width:"100%" }}>
        <button onClick={onStart} style={{
          background:buttonColor, color:"#ffffff", border:"none", borderRadius:"14px",
          padding:"1rem 3rem", fontSize:"1.05rem", fontWeight:700, cursor:"pointer",
          fontFamily:"'Space Grotesk', sans-serif", letterSpacing:"0.05em",
          transition:"transform 0.2s ease",
          boxShadow: taglinesBelow ? "0 4px 24px rgba(10,22,40,0.6)" : "0 4px 24px rgba(178,34,52,0.5)",
          width:"clamp(220px, 65vw, 280px)",
        }}
          onMouseEnter={e => e.target.style.transform="scale(1.05)"}
          onMouseLeave={e => e.target.style.transform="scale(1)"}
        >SORT THE CHAOS!</button>
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
    <div style={{ width:"100%", maxWidth:"440px", margin:"0 auto", padding:"1rem 0.75rem", height:"100dvh", display:"flex", flexDirection:"column", overflow:"hidden" }}>
      <div style={{ height:"1rem", flexShrink:0 }}/>
      <div style={{ display:"flex", flexDirection:"column", gap:"clamp(0.3rem,1vh,0.6rem)", flex:1, minHeight:0 }}>
        {events.map((event, i) => (
          <div key={event.id} style={{
            background:C.card, border:"1px solid "+C.border, borderRadius:"12px",
            padding:"clamp(0.5rem,1.2vh,1rem) clamp(1rem,3vw,1.5rem)",
            display:"flex", alignItems:"center", justifyContent:"center", flex:1, minHeight:0, overflow:"hidden",
            opacity: i < revealed ? 1 : 0, transform: i < revealed ? "translateX(0)" : "translateX(-20px)",
            transition:"all 0.4s cubic-bezier(0.16,1,0.3,1)",
          }}>
            <div style={{ fontSize:"clamp(0.92rem,2.6vw,1.08rem)", fontWeight:600, color:C.text, fontFamily:"'DM Sans', sans-serif", lineHeight:1.18, textAlign:"center" }}>
              {event.title}
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
  const overIndexRef = useRef(null);
  const listRef = useRef(null);
  const touchData = useRef({ active:false, index:null, startY:0, clone:null, startTop:0 });
  const eventsRef = useRef(events);
  eventsRef.current = events;

  const handleDragStart = (e, i) => { if (lockedCorrect[events[i]?.id]) return; setDragIndex(i); e.dataTransfer.effectAllowed="move"; };
  const handleDragOver  = (e, i) => { e.preventDefault(); setOverIndex(i); };
  const handleDrop = (e, ti) => {
    e.preventDefault();
    if (dragIndex !== null && dragIndex !== ti && !lockedCorrect[events[dragIndex]?.id])
      onReorder(reorderAroundLocks(events, dragIndex, ti, lockedCorrect));
    setDragIndex(null); setOverIndex(null);
  };
  const handleDragEnd = () => { setDragIndex(null); setOverIndex(null); };

  const handleTouchStart = useCallback((e, index) => {
    if (lockedCorrect[eventsRef.current[index]?.id]) return;
    const touch = e.touches[0]; const target = e.currentTarget;
    const rect = target.getBoundingClientRect();
    const clone = target.cloneNode(true);
    Object.assign(clone.style, { position:"fixed", left:rect.left+"px", top:rect.top+"px", width:rect.width+"px", zIndex:9999, opacity:"0.9", transform:"scale(1.04)", boxShadow:"0 8px 32px rgba(0,0,0,0.4)", pointerEvents:"none", transition:"none" });
    document.body.appendChild(clone);
    touchData.current = { active:true, index, startY:touch.clientY, clone, startTop:rect.top };
    overIndexRef.current = null; target.style.opacity="0.2";
    const onMove = (ev) => {
      ev.preventDefault();
      const t = ev.touches[0];
      touchData.current.clone.style.top = (touchData.current.startTop + t.clientY - touchData.current.startY)+"px";
      const items = listRef.current?.children; let found = null;
      for (let i = 0; i < items.length; i++) {
        const r = items[i].getBoundingClientRect();
        if (t.clientY >= r.top && t.clientY <= r.bottom && i !== touchData.current.index) { found = i; break; }
      }
      overIndexRef.current = found; setOverIndex(found);
    };
    const onEnd = () => {
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend", onEnd);
      if (touchData.current.clone?.parentNode) touchData.current.clone.parentNode.removeChild(touchData.current.clone);
      const from = touchData.current.index; const to = overIndexRef.current;
      if (from !== null && to !== null && from !== to && !lockedCorrect[eventsRef.current[from]?.id])
        onReorder(reorderAroundLocks(eventsRef.current, from, to, lockedCorrect));
      if (listRef.current?.children[from]) listRef.current.children[from].style.opacity="1";
      touchData.current = { active:false, index:null, startY:0, clone:null, startTop:0 };
      overIndexRef.current = null; setDragIndex(null); setOverIndex(null);
    };
    document.addEventListener("touchmove", onMove, { passive:false });
    document.addEventListener("touchend", onEnd);
  }, [lockedCorrect, onReorder]);

  return (
    <div ref={listRef} style={{ display:"flex", flexDirection:"column", gap:"clamp(0.25rem,1vh,0.55rem)", flex:1, minHeight:0 }}>
      {events.map((event, index) => {
        const isLocked = !!lockedCorrect[event.id];
        const isWrong  = !!wrongCards[event.id];
        const isOver   = overIndex === index;
        return (
          <div key={event.id} draggable={!isLocked}
            onDragStart={e => handleDragStart(e, index)} onDragOver={e => handleDragOver(e, index)}
            onDrop={e => handleDrop(e, index)} onDragEnd={handleDragEnd}
            onTouchStart={e => handleTouchStart(e, index)}
            style={{
              background: isLocked ? C.locked : isOver ? C.cardOver : C.card,
              border: isLocked ? "none" : isOver ? "1px solid "+C.borderHi : "1px solid "+C.border,
              borderRadius:"12px", padding:"clamp(0.4rem,1.2vh,1rem) clamp(1rem,3vw,1.5rem)",
              display:"flex", alignItems:"center", justifyContent:"center",
              flex:1, minHeight:0, overflow:"hidden",
              cursor: isLocked ? "default" : "grab", userSelect:"none",
              opacity: dragIndex === index ? 0.3 : 1,
              transition: isLocked ? "background 0.3s ease" : "none",
              animation: isWrong ? "shake 0.4s ease" : isLocked ? "celebrate 0.5s ease" : "none",
            }}>
            <div style={{ fontSize:"clamp(0.92rem,2.6vw,1.08rem)", fontWeight:600, color: isLocked ? C.bg : C.text, fontFamily:"'DM Sans', sans-serif", lineHeight:1.18, textAlign:"center" }}>
              {event.title}
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
  useEffect(() => {
    if (!hasRun.current) {
      hasRun.current = true;
      if (firstVisit) {
        onMount();
        saveStats(null, 0, puzzleDate);
      }
    }
  }, [firstVisit, onMount, puzzleDate]);

  return (
    <div style={{ position:"fixed", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"flex-start", background:"#0b0f18", overflow:"hidden" }}>
      {/* Backdrop image — bottom-anchored, full-width */}
      <img src={LOSER_IMG} alt="" style={{ position:"absolute", bottom:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:"440px", objectFit:"contain", objectPosition:"bottom", pointerEvents:"none", userSelect:"none" }} />

      {/* Overlay gradient so text is readable at top */}


      {/* Content */}
      <div style={{ position:"relative", zIndex:2, width:"100%", maxWidth:"440px", padding:"0 1.5rem", display:"flex", flexDirection:"column", alignItems:"center", paddingTop:"12%", paddingBottom:0 }}>
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
            const editionLabel = meta && meta.label;
            const subject = editionLabel ? `the ${editionLabel} of Trumple` : "Trumple";
            const LOSER_MSGS = [
              `I got absolutely crushed by ${subject} today. Total disaster. Think you can do better? https://trumple.app`,
              `${subject} beat me today. Rigged? Very suspicious. Think you can do better? https://trumple.app`,
              `${subject} got me. Sad! Very unfair. Think you can do better? https://trumple.app`,
              `I lost ${subject} today. A disaster the likes of which we've never seen. Think you can do better? https://trumple.app`,
              `${subject} defeated me. Many people are saying its rigged. https://trumple.app`,
              `I lost ${subject} today. Nobody thought it could happen. Think you can do better? https://trumple.app`,
              `${subject} beat me. Sad! Very sad. Think you can do better? https://trumple.app`,
            ];
            const msg = LOSER_MSGS[Math.floor(Math.random() * LOSER_MSGS.length)];
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
          TRY AGAIN TOMORROW
        </div>
      </div>
    </div>
  );
}
function PlayingScreen({ events, lockedCorrect, wrongCards, onReorder, onLockIn, timeDisplay, failedAttempts=0, isReadOnly=false, onBackToResults, backLabel="Back to Score" }) {
  const allCorrect = events.length > 0 && events.every(ev => lockedCorrect[ev.id]);
  const lockedCount = Object.keys(lockedCorrect).length;

  if (isReadOnly) {
    return (
      <div style={{ width:"100%", maxWidth:"440px", margin:"0 auto", padding:"1rem 0.75rem", height:"100dvh", display:"flex", flexDirection:"column", overflow:"hidden" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0, marginBottom:"0.75rem" }}>
          <button onClick={onBackToResults} style={{ background:"transparent", border:"none", color:C.dim, cursor:"pointer", fontFamily:"'DM Sans', sans-serif", fontSize:"0.85rem" }}>&#8592; {backLabel}</button>
          <div/>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:"clamp(0.25rem,1vh,0.55rem)", flex:1, minHeight:0 }}>
          {events.map(event => (
            <div key={event.id} style={{ background:C.locked, borderRadius:"12px", padding:"clamp(0.4rem,1.2vh,1rem) clamp(1rem,3vw,1.5rem)", display:"flex", alignItems:"center", justifyContent:"center", flex:1, minHeight:0, overflow:"hidden" }}>
              <div style={{ textAlign:"center" }}>
                <div style={{ fontSize:"clamp(0.92rem,2.6vw,1.08rem)", fontWeight:600, color:C.bg, fontFamily:"'DM Sans', sans-serif", lineHeight:1.18 }}>{event.title}</div>
                <div style={{ fontSize:"clamp(0.6rem,1.6vw,0.72rem)", color:"rgba(10,22,40,0.6)", marginTop:"0.15rem", fontFamily:"'JetBrains Mono', monospace" }}>{event.hint}</div>
                {event.year != null && <div style={{ fontSize:"clamp(0.6rem,1.6vw,0.7rem)", color:"rgba(10,22,40,0.4)", marginTop:"0.08rem", fontFamily:"'JetBrains Mono', monospace", fontWeight:700 }}>{event.year}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ width:"100%", maxWidth:"440px", margin:"0 auto", padding:"1rem 0.75rem", height:"100dvh", display:"flex", flexDirection:"column", overflow:"hidden" }}>
      {/* Header: stars left, timer right */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0, marginBottom:"0.5rem" }}>
        <LiveStars failedAttempts={failedAttempts}/>
        <div style={{ fontSize:"clamp(1.1rem,3.2vw,1.35rem)", fontFamily:"'JetBrains Mono', monospace", color:C.gold, fontWeight:700, letterSpacing:"0.04em" }}>{timeDisplay}</div>
      </div>
      <div style={{ height:"3px", background:C.dimmest, borderRadius:"2px", marginBottom:"0.6rem", flexShrink:0 }}>
        <div style={{ height:"100%", width:((lockedCount/7)*100)+"%", background:C.red, borderRadius:"2px", transition:"width 0.4s ease" }}/>
      </div>
      <DraggableList events={events} lockedCorrect={lockedCorrect} wrongCards={wrongCards} onReorder={onReorder}/>
      {!allCorrect && (
        <button onClick={onLockIn} style={{
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
        <div style={{ textAlign:"center", marginTop:"1rem", fontSize:"0.85rem", color:C.dim, fontFamily:"'JetBrains Mono', monospace", animation:"pulse 1s ease infinite", flexShrink:0 }}>Chaos sorted...</div>
      )}
    </div>
  );
}

function ShareIcons({ time, meta }) {
  const { display } = formatTime(time);
  const editionLabel = meta && meta.label;
  const subject = editionLabel
    ? `the ${editionLabel} of Trumple`
    : "Trumple";
  const WIN_MSGS = [
    `I solved ${subject} in ${display}. A tremendous success. The BEST.\nhttps://trumple.app`,
    `I solved ${subject} in ${display}. HUGE win. Absolutely incredible.\nhttps://trumple.app`,
    `I solved ${subject} in ${display}. Total victory. Record-breaking.\nhttps://trumple.app`,
    `I solved ${subject} in ${display}. Big league. We're winning.\nhttps://trumple.app`,
    `I solved ${subject} in ${display}. Very, very special. Historic.\nhttps://trumple.app`,
    `I solved ${subject} in ${display}. Many people are saying it's the fastest ever.\nhttps://trumple.app`,
  ];
  const msg = WIN_MSGS[Math.floor(Math.random() * WIN_MSGS.length)];

  async function generateAndShare() {
    // Build the score card image
    try {
      const canvas = document.createElement("canvas");
      const scale = 2;
      canvas.width  = 480 * scale;
      canvas.height = 200 * scale;
      const ctx = canvas.getContext("2d");
      ctx.scale(scale, scale);

      ctx.fillStyle = "#0b0f18";
      ctx.fillRect(0, 0, 480, 200);
      ctx.strokeStyle = "#2a2e3e";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(12, 12, 456, 176);

      ctx.fillStyle = "#888";
      ctx.font = "700 13px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "alphabetic";
      ctx.fillText("TRUMPLE", 240, 48);

      ctx.fillStyle = "#f0f0f5";
      ctx.font = "700 72px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(display, 240, 115);

      ctx.fillStyle = "#f5c518";
      ctx.font = "700 13px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "alphabetic";
      ctx.fillText("trumple.app", 240, 178);

      const blob = await new Promise(res => canvas.toBlob(res, "image/png"));
      const file = new File([blob], "trumple-score.png", { type: "image/png" });

      // Try sharing with image file (opens OS share sheet → user picks app)
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], text: msg });
        return;
      }
      // Fallback: share text only via share sheet
      if (navigator.share) {
        await navigator.share({ text: msg });
        return;
      }
    } catch (_) {}

    // Last resort: copy text to clipboard
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

function CompleteScreen({ time, failedAttempts, onViewChain, firstVisit, onMount, meta, puzzleDate }) {
  const stars = getStars(failedAttempts);
  const { display } = formatTime(time);
  const [celebWord] = useState(() => getCelebWord(stars));
  const [showConfetti, setShowConfetti] = useState(false);
  const [stats, setStats] = useState({ played: 0, perfects: 0, best: null, streak: 0 });
  const hasRun = useRef(false);

  useEffect(() => {
    if (!hasRun.current) {
      hasRun.current = true;
      if (firstVisit) {
        onMount(); saveStats(time, stars, puzzleDate);
        setShowConfetti(true); setTimeout(() => setShowConfetti(false), 4000);
      }
      setStats(getStats());
    }
  }, [firstVisit, onMount, time, stars, puzzleDate]);

  const bestDisplay = stats.best ? formatTime(stats.best).display : display;

  return (
    <>
      <Confetti active={showConfetti}/>
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"1.5rem 1.25rem", maxWidth:"440px", margin:"0 auto", minHeight:"100dvh", justifyContent:"center" }}>
        <StarDisplay stars={stars} size={32} celebrate={firstVisit}/>
        <div style={{ marginTop:"0.6rem", fontSize:"1.6rem", fontWeight:900, fontFamily:"'Space Grotesk', sans-serif", color:C.gold, letterSpacing:"-0.01em" }}>{celebWord}</div>
        <div style={{ marginTop:"1rem", fontSize:"clamp(3rem,12vw,4.5rem)", fontWeight:700, fontFamily:"'JetBrains Mono', monospace", color:C.text, letterSpacing:"-0.02em", lineHeight:1 }}>{display}</div>
        <div style={{ marginTop:"1rem", display:"grid", gridTemplateColumns:"repeat(3, minmax(0, 1fr))", gap:"0.5rem", width:"100%" }}>
          {[
            { label:"PLAYED",         val: stats.played   || 1 },
            { label:"PERFECT SCORES", val: stats.perfects || 0 },
            { label:"STREAK",         val: "🔥 " + (stats.streak || 1) },
          ].map(({ label, val }) => (
            <div key={label} style={{ minWidth:0, background:C.card, border:"1px solid "+C.border, borderRadius:"12px", padding:"0.75rem 0.35rem", textAlign:"center" }}>
              <div style={{ fontSize:"0.48rem", color:C.dimmer, fontFamily:"'JetBrains Mono', monospace", letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:"0.3rem", lineHeight:1.3 }}>{label}</div>
              <div style={{ fontSize:"clamp(0.8rem, 3.6vw, 1rem)", fontWeight:700, fontFamily:"'JetBrains Mono', monospace", color:C.text, whiteSpace:"nowrap" }}>{val}</div>
            </div>
          ))}
        </div>
        {stats.history && stats.history.length > 0 && (() => {
          const allTimes = stats.best ? [...stats.history, stats.best] : stats.history;
          const minTime = Math.min(...allTimes);
          const history = [...stats.history].reverse();
          return (
            <div style={{ width:"100%", marginTop:"1.25rem" }}>
              <div style={{ fontSize:"0.6rem", color:C.dimmer, fontFamily:"'JetBrains Mono', monospace", letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:"0.6rem" }}>YOUR LAST 5</div>
              {history.map((t, i) => {
                const pct = t > 0 ? (minTime / t) * 100 : 100;
                const isCurrent = i === 0 && history.length === stats.history.length;
                return (
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:"0.5rem", marginBottom:"0.35rem" }}>
                    <div style={{ width:"1rem", fontSize:"0.6rem", color:C.dimmer, fontFamily:"'JetBrains Mono', monospace", textAlign:"right", flexShrink:0 }}>{history.length - i}</div>
                    <div style={{ flex:1, background:C.card, borderRadius:"6px", height:"2rem", position:"relative", overflow:"hidden" }}>
                      <div style={{ position:"absolute", left:0, top:0, height:"100%", width:pct+"%", background: "rgba(255,255,255,0.08)", borderRadius:"6px", transition:"width 0.6s ease" }}/>
                      <div style={{ position:"absolute", right:"0.6rem", top:"50%", transform:"translateY(-50%)", fontSize:"0.75rem", fontWeight:700, fontFamily:"'JetBrains Mono', monospace", color: C.text }}>{formatTime(t).display}</div>
                    </div>
                  </div>
                );
              })}
              {stats.best && (
                <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", marginTop:"0.5rem" }}>
                  <div style={{ width:"1rem", fontSize:"0.6rem", color:C.gold, fontFamily:"'JetBrains Mono', monospace", textAlign:"right", flexShrink:0 }}>★</div>
                  <div style={{ flex:1, background:C.gold, borderRadius:"6px", height:"2rem", position:"relative", overflow:"hidden" }}>
                    <div style={{ position:"absolute", right:"0.6rem", top:"50%", transform:"translateY(-50%)", fontSize:"0.75rem", fontWeight:700, fontFamily:"'JetBrains Mono', monospace", color:"#1a1a2e" }}>BEST&nbsp;&nbsp;{formatTime(stats.best).display}</div>
                  </div>
                </div>
              )}
            </div>
          );
        })()}
        <button onClick={onViewChain} style={{ marginTop:"0.75rem", background:"transparent", border:"1px solid "+C.border, borderRadius:"10px", padding:"0.5rem 1.25rem", color:C.dim, fontFamily:"'DM Sans', sans-serif", fontSize:"0.8rem", cursor:"pointer", display:"flex", alignItems:"center", gap:"0.4rem" }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
          View the "BEAUTIFUL" Trump Timeline
        </button>
        <ShareIcons time={time} meta={meta}/>
      </div>
    </>
  );
}

const SCREENS = { LOADING:"loading", ERROR:"error", INTRO:"intro", REVEAL:"reveal", PLAYING:"playing", CHAIN_VIEW:"chain_view", COMPLETE:"complete", GAME_OVER:"game_over" };

export default function TrumpleApp() {
  const [screen, setScreen]             = useState(SCREENS.LOADING);
  const [puzzle, setPuzzle]             = useState(null);
  const [answerOrder, setAnswerOrder]   = useState([]);
  const [yearMap, setYearMap]           = useState({});
  const [isWeekly, setIsWeekly]         = useState(false);
  const [isSecondTerm, setIsSecondTerm] = useState(false);
  const [editionMeta, setEditionMeta]   = useState(null);
  const [events, setEvents]             = useState([]);
  const [revealEvents, setRevealEvents] = useState([]);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockedCorrect, setLockedCorrect] = useState({});
  const [wrongCards, setWrongCards]     = useState({});
  const confettiShown = useRef(false);
  const gameOverShown = useRef(false);
  const chainViewSource = useRef(null);
  const timer = useTimer();

  useEffect(() => {
    const urlDate = new URLSearchParams(window.location.search).get("date");
    const localDate = urlDate || new Date().toLocaleDateString("en-CA");
    fetch("/api/trump-puzzle?date=" + localDate)
      .then(r => { if (!r.ok) throw new Error("No puzzle"); return r.json(); })
      .then(data => { setPuzzle(data.puzzle); setAnswerOrder(data.answerOrder); setYearMap(data.yearMap); setIsWeekly(!!data.isWeekly); setIsSecondTerm(!!data.isSecondTerm); setEditionMeta(data.editionMeta || null); setScreen(SCREENS.INTRO); })
      .catch(() => setScreen(SCREENS.ERROR));
  }, []);

  const handleStart = () => {
    const evts = puzzle.events.map(e => ({ ...e, year: yearMap[e.id] }));
    const shuffled = shuffleArray(evts);
    setEvents(shuffled); setRevealEvents(shuffled);
    setFailedAttempts(0); setLockedCorrect({}); setWrongCards({});
    setScreen(SCREENS.REVEAL);
  };

  const handleRevealComplete = useCallback(() => {
    const evts = puzzle.events.map(e => ({ ...e, year: yearMap[e.id] }));
    setEvents(shuffleArray(evts)); setScreen(SCREENS.PLAYING); timer.start();
  }, [timer, puzzle, yearMap]);

  const handleReorder = useCallback((newEvents) => setEvents(newEvents), []);

  const handleLockIn = () => {
    const newLocked = { ...lockedCorrect }; const newWrong = {};
    let anyNewCorrect = false;

    events.forEach((ev, i) => {
      if (lockedCorrect[ev.id]) return;
      if (ev.id === answerOrder[i]) { newLocked[ev.id] = true; anyNewCorrect = true; }
      else newWrong[ev.id] = true;
    });

    const allCorrect = Object.keys(newLocked).length === 7;
    setLockedCorrect(newLocked); setWrongCards(newWrong);
    setTimeout(() => setWrongCards({}), 800);

    if (allCorrect) {
      timer.stop();
      setTimeout(() => setScreen(SCREENS.COMPLETE), 3200);
      return;
    }

    // Wrong, burn a star
    const newFailed = failedAttempts + 1;
    setFailedAttempts(newFailed);

    if (newFailed >= MAX_ATTEMPTS) {
      // Reveal correct order for game over screen
      timer.stop();
      // Sort events into correct answer order for display
      const sorted = [...answerOrder].map(id => events.find(ev => ev.id === id) || revealEvents.find(ev => ev.id === id));
      setEvents(sorted.filter(Boolean));
      setTimeout(() => setScreen(SCREENS.GAME_OVER), 1000);
    }
  };

  return (
    <div style={{ background:C.bg, minHeight:"100dvh", color:C.text, fontFamily:"'DM Sans', sans-serif", overflow:"hidden" }}>
      <style>{globalStyles}</style>
      {screen === SCREENS.LOADING    && <LoadingScreen/>}
      {screen === SCREENS.ERROR      && <ErrorScreen/>}
      {screen === SCREENS.INTRO      && puzzle && editionMeta && <IntroScreen puzzle={puzzle} onStart={handleStart} editionMeta={editionMeta}/>}
      {screen === SCREENS.REVEAL     && <RevealScreen events={revealEvents} onRevealComplete={handleRevealComplete}/>}
      {screen === SCREENS.PLAYING    && <PlayingScreen events={events} lockedCorrect={lockedCorrect} wrongCards={wrongCards} onReorder={handleReorder} onLockIn={handleLockIn} timeDisplay={formatTime(timer.time).display} failedAttempts={failedAttempts}/>}
      {screen === SCREENS.CHAIN_VIEW && <PlayingScreen events={events} lockedCorrect={lockedCorrect} wrongCards={{}} onReorder={()=>{}} onLockIn={()=>{}} timeDisplay="" isReadOnly={true} onBackToResults={() => setScreen(chainViewSource.current === "game_over" ? SCREENS.GAME_OVER : SCREENS.COMPLETE)} backLabel={chainViewSource.current === "game_over" ? "Game Over" : "Back to Score"}/>}
      {screen === SCREENS.COMPLETE   && <CompleteScreen time={timer.time} failedAttempts={failedAttempts} onViewChain={() => { chainViewSource.current = "complete"; setScreen(SCREENS.CHAIN_VIEW); }} firstVisit={!confettiShown.current} onMount={() => { confettiShown.current = true; }} meta={editionMeta} puzzleDate={puzzle.date}/>}
      {screen === SCREENS.GAME_OVER  && <GameOverScreen events={events} onViewChain={() => { chainViewSource.current = "game_over"; setScreen(SCREENS.CHAIN_VIEW); }} firstVisit={!gameOverShown.current} onMount={() => { gameOverShown.current = true; }} meta={editionMeta} puzzleDate={puzzle.date}/>}
    </div>
  );
}

const globalStyles = "@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@900&family=Space+Grotesk:wght@300;400;600;700;900&family=DM+Sans:wght@400;600;700&family=JetBrains+Mono:wght@400;600;700&display=swap');" +
  "* { box-sizing: border-box; margin: 0; padding: 0; -webkit-text-size-adjust: 100%; }" +
  "body { background: #0A1628; margin: 0; overflow: hidden; }" +
  "html { overflow: hidden; }" +
  "::-webkit-scrollbar { display: none; }" +
  "@keyframes shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-6px)} 40%{transform:translateX(6px)} 60%{transform:translateX(-4px)} 80%{transform:translateX(4px)} }" +
  "@keyframes celebrate { 0%{transform:scale(1)} 25%{transform:scale(1.03) rotate(-0.5deg)} 50%{transform:scale(1.05) rotate(0.5deg)} 75%{transform:scale(1.03) rotate(-0.3deg)} 100%{transform:scale(1)} }" +
  "@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }" +
  "@keyframes starPop { 0%{transform:scale(0);opacity:0} 50%{transform:scale(1.5);opacity:1} 75%{transform:scale(0.9)} 100%{transform:scale(1.15);opacity:1} }" +
  "@keyframes confettiFall { 0%{transform:translateY(-10px) translateX(0) rotate(0deg);opacity:1} 85%{opacity:1} 100%{transform:translateY(110vh) translateX(var(--cdrift)) rotate(var(--crot));opacity:0} }";
