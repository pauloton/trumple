import { NextResponse } from "next/server";

// ============================================================
// WEEK → PUZZLE MAP
// Key = the Monday of that week (YYYY-MM-DD).
// One puzzle per week — same puzzle all 7 days.
// ============================================================
// ➕ TO ADD A NEW WEEK: add one line like "2026-04-27": "tw011",
//    then add the puzzle data below.
//
// ⚠️  RECENCY RULE — every puzzle must include:
//    • At least 1 event from the LAST 60 DAYS
//    • At least 1 event from the LAST 6 MONTHS
//    • At least 1 event from the LAST 12 MONTHS
//    Mix them with 4 older/thematic events to keep it fresh.
// ============================================================
const SCHEDULE = {
  "2026-02-16": "tw001",
  "2026-02-23": "tw002",
  "2026-03-02": "tw003",
  "2026-03-09": "tw004",
  "2026-03-16": "tw005",
  "2026-03-23": "tw006",
  "2026-03-30": "tw007",
  "2026-04-06": "tw008",
  "2026-04-13": "tw009",
  "2026-04-20": "tw010",
};

// ============================================================
// PUZZLE LIBRARY — 10 weekly sets
// ⚠️  ALL events must be from the LAST 364 DAYS.
// When adding a new puzzle, drop any event older than 364 days
// and replace it with something recent.
// Events stored oldest → newest (correct answer order).
// ============================================================
const PUZZLES = {

  tw001: {
    theme: "Day One Chaos",
    events: [
      { id: 1, title: "Trump is sentenced to 'unconditional discharge' in the New York hush money case — no jail, no fine", hint: "The most anticlimactic sentencing in legal history", year: 2025 },
      { id: 2, title: "Trump signs an executive order attempting to end birthright citizenship — courts block it within hours", hint: "14th Amendment. Still applies.", year: 2025 },
      { id: 3, title: "Trump pardons approximately 1,500 January 6 defendants on his first day back in office", hint: "Including those convicted of violent offences", year: 2025 },
      { id: 4, title: "Trump fires six inspectors general in an overnight purge — no warning, no reason given", hint: "They were the government's own watchdogs", year: 2025 },
      { id: 5, title: "Trump imposes sweeping 25% tariffs on Canada and Mexico", hint: "America's two largest trading partners — blindsided", year: 2025 },
      { id: 6, title: "Trump and Vance publicly berate Zelensky in the Oval Office on live television", hint: "'You're gambling with World War Three'", year: 2025 },
      { id: 7, title: "Trump announces sweeping tariffs on nearly every country on 'Liberation Day'", hint: "Global markets immediately crater", year: 2025 },
    ],
  },

  tw002: {
    theme: "DOGE Days",
    events: [
      { id: 1, title: "Elon Musk's DOGE team is granted access to sensitive US Treasury payment systems", hint: "Controlling the flow of $6 trillion in federal payments", year: 2025 },
      { id: 2, title: "USAID is effectively dissolved — thousands of employees placed on administrative leave overnight", hint: "Decades of foreign aid infrastructure dismantled in days", year: 2025 },
      { id: 3, title: "Musk takes the stage at CPAC wielding a chainsaw as a symbol of government cuts", hint: "The crowd loved it", year: 2025 },
      { id: 4, title: "Federal judges order DOGE to halt access to government payment and data systems", hint: "The courts pump the brakes", year: 2025 },
      { id: 5, title: "Courts order the reinstatement of thousands of fired probationary federal employees", hint: "DOGE fired them. Judges said no.", year: 2025 },
      { id: 6, title: "Trump fires General CQ Brown, Chairman of the Joint Chiefs of Staff", hint: "And the other Joint Chiefs with him", year: 2025 },
      { id: 7, title: "Musk publicly falls out with Trump over the 'Big Beautiful Bill', calling it a 'betrayal'", hint: "The bromance ends on social media", year: 2025 },
    ],
  },

  tw003: {
    theme: "Tariff Terror",
    events: [
      { id: 1, title: "Trump announces 25% tariffs on Canada and Mexico, effective immediately", hint: "Justin Trudeau flew to Mar-a-Lago to beg for a pause", year: 2025 },
      { id: 2, title: "Trump briefly pauses Canada and Mexico tariffs after emergency calls with both leaders", hint: "A 30-day reprieve — for now", year: 2025 },
      { id: 3, title: "Trump announces sweeping tariffs on nearly every country on 'Liberation Day'", hint: "April 2nd. The markets did not celebrate.", year: 2025 },
      { id: 4, title: "Dow Jones drops over 4,000 points in two days following Liberation Day tariff announcement", hint: "Trillions wiped from global markets", year: 2025 },
      { id: 5, title: "Trump announces a 90-day pause on most tariffs after stock markets collapse", hint: "'It takes courage and strength to be flexible'", year: 2025 },
      { id: 6, title: "China retaliates with tariffs of up to 125% on American goods", hint: "Beijing refused to blink", year: 2025 },
      { id: 7, title: "US and China announce a 90-day truce and agree to dramatically reduce tariffs on both sides", hint: "Markets surge on the news", year: 2025 },
    ],
  },

  tw004: {
    theme: "Ukraine Unravels",
    events: [
      { id: 1, title: "Trump suspends US military intelligence sharing with Ukraine", hint: "Zelesnky learned about it from the news", year: 2025 },
      { id: 2, title: "Trump and Vance ambush Zelensky in the Oval Office — cameras rolling", hint: "Zelensky came looking for support. He didn't get it.", year: 2025 },
      { id: 3, title: "Trump freezes all military aid to Ukraine in the wake of the Oval Office confrontation", hint: "Hundreds of millions of dollars put on hold", year: 2025 },
      { id: 4, title: "SignalGate: Defense Secretary Hegseth accidentally adds The Atlantic's editor to a classified group chat about Yemen strikes", hint: "The journalist published everything", year: 2025 },
      { id: 5, title: "Hegseth doubles down and refuses to resign despite bipartisan calls to step down over the Signal leak", hint: "Trump backs him publicly", year: 2025 },
      { id: 6, title: "US and Ukraine sign a minerals deal, giving America preferential access to Ukrainian natural resources", hint: "Trump called it 'the deal of the century'", year: 2025 },
      { id: 7, title: "Trump announces a ceasefire framework for Ukraine after back-channel talks with Moscow", hint: "Zelesnky was not in the room", year: 2025 },
    ],
  },

  tw005: {
    theme: "Courts vs. Trump",
    events: [
      { id: 1, title: "A federal judge blocks Trump's birthright citizenship executive order within 14 hours of signing", hint: "Three more courts do the same within days", year: 2025 },
      { id: 2, title: "Courts block DOGE's access to Treasury payment systems, citing privacy and security concerns", hint: "Temporary restraining order granted", year: 2025 },
      { id: 3, title: "Federal courts order reinstatement of thousands of federal workers fired without cause", hint: "The mass firings were ruled unlawful", year: 2025 },
      { id: 4, title: "Courts block Trump's use of the Alien Enemies Act to deport Venezuelan migrants without hearings", hint: "A 1798 wartime law invoked in peacetime", year: 2025 },
      { id: 5, title: "Supreme Court allows Trump to fire independent agency heads — a major expansion of presidential power", hint: "A decades-old precedent overturned", year: 2025 },
      { id: 6, title: "Harvard wins a court order blocking the Trump administration's $2.2 billion funding freeze", hint: "The administration had demanded Harvard change its policies", year: 2025 },
      { id: 7, title: "Supreme Court rules on birthright citizenship, sending the case back to lower courts", hint: "The constitutional question unresolved", year: 2025 },
    ],
  },

  tw006: {
    theme: "Liberation Day",
    events: [
      { id: 1, title: "Trump teases a major tariff announcement, calling April 2nd 'Liberation Day for America'", hint: "The build-up was ominous", year: 2025 },
      { id: 2, title: "Trump unveils a chart of tariffs on nearly every country — some rates over 40%", hint: "The formula used confused economists worldwide", year: 2025 },
      { id: 3, title: "Asian markets open and immediately crash — Japan's Nikkei drops over 7% in a single day", hint: "The worst single-day drop in years", year: 2025 },
      { id: 4, title: "US markets open and the Dow drops thousands of points over two days", hint: "Trillions in wealth wiped out globally", year: 2025 },
      { id: 5, title: "Bond markets spike — US Treasury yields surge as investors panic-sell American debt", hint: "The bond market is the signal Trump actually watches", year: 2025 },
      { id: 6, title: "Trump announces a 90-day pause on most tariffs, sending markets surging back up", hint: "'He blinked' — Financial Times front page", year: 2025 },
      { id: 7, title: "China is excluded from the 90-day pause — tariffs on Chinese goods raised to 145%", hint: "The trade war with China intensifies", year: 2025 },
    ],
  },

  tw007: {
    theme: "Campus Crackdown",
    events: [
      { id: 1, title: "Trump signs executive order threatening to cut funding to universities that allow 'illegal protests'", hint: "Aimed at pro-Palestinian demonstrations", year: 2025 },
      { id: 2, title: "Columbia University capitulates to Trump administration demands to avoid losing federal funding", hint: "Other universities watched nervously", year: 2025 },
      { id: 3, title: "Trump administration freezes $2.2 billion in federal grants and contracts to Harvard University", hint: "The largest funding freeze of any American university", year: 2025 },
      { id: 4, title: "Harvard becomes the first university to formally refuse to comply with the administration's demands", hint: "President Alan Garber: 'We will not surrender'", year: 2025 },
      { id: 5, title: "Trump threatens to revoke Harvard's tax-exempt status", hint: "A weapon no president has used against a university before", year: 2025 },
      { id: 6, title: "Harvard sues the Trump administration over the funding freeze", hint: "First Ivy League school to take the fight to court", year: 2025 },
      { id: 7, title: "A federal judge issues a temporary order blocking the Harvard funding freeze", hint: "Round one to Harvard", year: 2025 },
    ],
  },

  tw008: {
    theme: "America First Abroad",
    events: [
      { id: 1, title: "Trump withdraws the United States from the World Health Organization — for the second time", hint: "He did it in his first term too. Biden rejoined. Trump left again.", year: 2025 },
      { id: 2, title: "Trump says the US 'will get' Greenland and refuses to rule out military force to take it", hint: "Denmark called it 'absurd'. Trump didn't care.", year: 2025 },
      { id: 3, title: "Trump renames the Gulf of Mexico 'Gulf of America' by executive order", hint: "Apple Maps updated it within days", year: 2025 },
      { id: 4, title: "Trump proposes the US take over Gaza and resettle its 2 million Palestinian residents elsewhere", hint: "Jordan and Egypt both said no", year: 2025 },
      { id: 5, title: "Trump visits Saudi Arabia, Qatar and the UAE — his first foreign trip of the second term", hint: "Hundreds of billions in investment deals announced", year: 2025 },
      { id: 6, title: "Trump agrees to a Houthi ceasefire deal brokered by Oman — without telling Israel", hint: "The deal excluded any Israeli hostages or concessions", year: 2025 },
      { id: 7, title: "Trump and Putin hold a phone call to discuss a potential Ukraine ceasefire framework", hint: "It was not coordinated with NATO allies", year: 2025 },
    ],
  },

  tw009: {
    theme: "The Deportation Machine",
    events: [
      { id: 1, title: "Trump declares a national emergency at the southern border on his first day back in office", hint: "Day one. Executive order number one.", year: 2025 },
      { id: 2, title: "Trump invokes the Alien Enemies Act — a 1798 wartime law — to deport Venezuelan migrants", hint: "Courts immediately challenge it", year: 2025 },
      { id: 3, title: "The US deports migrants to El Salvador, paying the country to house them in a notorious mega-prison", hint: "President Bukele was happy to oblige", year: 2025 },
      { id: 4, title: "Kilmar Abrego Garcia, a Maryland man with no criminal record, is mistakenly deported to an El Salvador prison", hint: "Courts order his return. The administration refuses.", year: 2025 },
      { id: 5, title: "Supreme Court orders the Trump administration to 'facilitate' the return of the wrongly deported man", hint: "The administration argues it cannot compel El Salvador", year: 2025 },
      { id: 6, title: "ICE conducts raids in multiple major cities simultaneously, arresting hundreds in a single operation", hint: "The largest coordinated immigration enforcement action in decades", year: 2025 },
      { id: 7, title: "Trump signs an executive order ending 'catch and release' and mandating detention for all illegal border crossers", hint: "The courts immediately challenge it", year: 2025 },
    ],
  },

  tw010: {
    theme: "Power Grab",
    events: [
      { id: 1, title: "Trump signs over 100 executive orders in his first week back in office — a presidential record", hint: "Many were immediately challenged in court", year: 2025 },
      { id: 2, title: "Trump fires the heads of the FTC, FCC and other independent regulatory agencies", hint: "Agencies designed to be independent from the president", year: 2025 },
      { id: 3, title: "Trump pardons Ross Ulbricht, founder of the dark web drugs marketplace Silk Road", hint: "A promise made at a Libertarian convention during the campaign", year: 2025 },
      { id: 4, title: "Trump signs executive orders dismantling all DEI programmes across the federal government", hint: "Diversity, Equity and Inclusion — gone by lunch", year: 2025 },
      { id: 5, title: "Trump moves to dismantle the Department of Education by executive order", hint: "He promised to close it on the campaign trail", year: 2025 },
      { id: 6, title: "Trump administration demands control over who the Associated Press can send to the White House", hint: "AP sues. Press freedom organisations condemn it.", year: 2025 },
      { id: 7, title: "Trump signs the 'One Big Beautiful Bill' — sweeping tax cuts paired with major spending reductions", hint: "Critics say it adds trillions to the debt", year: 2025 },
    ],
  },

};

function seededRandom(seed) {
  let s = seed;
  return function () {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function seededShuffle(arr, seed) {
  const rng = seededRandom(seed);
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ============================================================
// ROUTE HANDLER
// ============================================================
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const dateParam = searchParams.get("date"); // e.g. "2026-02-20"

  // Find the Monday of the week for the given date
  function getMondayOf(dateStr) {
    const d = new Date(dateStr + "T12:00:00Z");
    const day = d.getUTCDay(); // 0=Sun
    const diff = day === 0 ? 6 : day - 1;
    d.setUTCDate(d.getUTCDate() - diff);
    return d.toISOString().split("T")[0];
  }

  const weekKey = getMondayOf(dateParam || new Date().toISOString().split("T")[0]);
  const puzzleId = SCHEDULE[weekKey];

  if (!puzzleId || !PUZZLES[puzzleId]) {
    return NextResponse.json({ error: "No puzzle this week" }, { status: 404 });
  }

  const puzzle = PUZZLES[puzzleId];

  // Correct answer order (IDs oldest → newest)
  const answerOrder = puzzle.events.map((e) => e.id);

  // Seeded shuffle so everyone sees the same scramble
  const weekSeed = parseInt(weekKey.replace(/-/g, ""), 10);
  const shuffledEvents = seededShuffle(
    puzzle.events.map((e) => ({ id: e.id, title: e.title, hint: e.hint })),
    weekSeed
  );

  const yearMap = {};
  puzzle.events.forEach((e) => { yearMap[e.id] = e.year; });

  return NextResponse.json({
    puzzle: {
      id: puzzleId,
      theme: puzzle.theme,
      weekKey,
      date: dateParam || new Date().toISOString().split("T")[0],
      events: shuffledEvents,
    },
    answerOrder,
    yearMap,
  });
}
