import { NextResponse } from "next/server";

// ============================================================
// EVENT POOL, spanning 2015–2025
// Grouped into 6 eras. Each week draws 1 from each of the
// first 5 eras, and 2 from Era F (2025) = 7 total.
//
// TO ADD AN EVENT: append to the right era. Done.
//
// ⚠️  TITLE RULES, enforced forever:
//   • MAX 50 characters per title (fits 2 lines on mobile)
//   • NO em dashes (they are stripped automatically at serve time)
//   • Be punchy. Cut every word that is not essential.
//   • Mix: policy events, gaffes, scandals and personal moments.
//   • Test: count the chars before you commit.
// ============================================================
const POOL = {

  // Era A: 2015–2016, The Rise
  A: [
    { id: "a1",  title: "Calls Mexican immigrants 'rapists'", hint: "June 16, 2015 launch speech", year: 2015 },
    { id: "a2",  title: "'I like people who weren't captured'", hint: "Iowa. The John McCain dig.", year: 2015 },
    { id: "a3",  title: "Calls for a total ban on Muslims entering the US", hint: "December 2015", year: 2015 },
    { id: "a4",  title: "Access Hollywood: brags about groping women", hint: "Billy Bush. A hot mic. A bus.", year: 2016 },
    { id: "a5",  title: "Won't say he'll accept the election result", hint: "Clinton called it 'horrifying'", year: 2016 },
    { id: "a6",  title: "Wins 2016, shocking the world", hint: "The night everyone got it wrong", year: 2016 },
    { id: "a7",  title: "Settles Trump University fraud for $25M", hint: "Students said they were defrauded", year: 2016 },
    { id: "a8",  title: "Spicer: inauguration crowd 'the largest ever'", hint: "Alternative facts. Day one.", year: 2017 },
    { id: "a9",  title: "Mocks a disabled reporter at a rally", hint: "Reporters and the public were appalled", year: 2015 },
    { id: "a10", title: "'I could shoot someone on 5th Ave' and win", hint: "Iowa rally. He wasn't joking.", year: 2016 },
  ],

  // Era B: 2017–2018, First Term Chaos
  B: [
    { id: "b1",  title: "Travel ban signed, chaos at airports", hint: "Courts block it. He tries twice more.", year: 2017 },
    { id: "b2",  title: "Flynn resigns after 24 days for lying", hint: "Shortest NSA tenure in history", year: 2017 },
    { id: "b3",  title: "Fires Comey over 'the Russia thing'", hint: "His own words. On tape.", year: 2017 },
    { id: "b4",  title: "Tells Russians he fired 'nut job' Comey", hint: "In the Oval. The next day.", year: 2017 },
    { id: "b5",  title: "Scaramucci fired after just 10 days", hint: "An all-time record, even by Trump standards", year: 2017 },
    { id: "b6",  title: "'Fine people on both sides' at Charlottesville", hint: "A remark that follows him still", year: 2017 },
    { id: "b7",  title: "'Covfefe': the midnight tweet no one decoded", hint: "He never explained it. Neither did Spicer.", year: 2017 },
    { id: "b8",  title: "Throws paper towels to Puerto Rico survivors", hint: "Hurricane Maria. A crowd catch. Backlash.", year: 2017 },
    { id: "b9",  title: "Tweets his nuclear button is bigger than Kim's", hint: "New Year's Day, 2018", year: 2018 },
    { id: "b10", title: "$34B in tariffs slapped on China", hint: "China retaliates dollar for dollar", year: 2018 },
    { id: "b11", title: "First US president to meet Kim Jong Un", hint: "Historic handshake. No deal ever followed.", year: 2018 },
    { id: "b12", title: "2,000+ migrant children separated at border", hint: "Children in cages. Global outrage.", year: 2018 },
  ],

  // Era C: 2019–2020, Impeachment I & COVID
  C: [
    { id: "c1",  title: "Calls Ukraine, asks for Biden dirt", hint: "July 25, 2019. 'The perfect phone call.'", year: 2019 },
    { id: "c2",  title: "Impeached for abuse of power, acquitted", hint: "Charges: abuse of power, obstruction", year: 2019 },
    { id: "c3",  title: "Doctored hurricane map with a Sharpie", hint: "Dorian wasn't heading to Alabama. He said it was.", year: 2019 },
    { id: "c4",  title: "Orders assassination of Iran's Soleimani", hint: "World braced for World War Three", year: 2020 },
    { id: "c5",  title: "'Totally under control': COVID will disappear", hint: "February 2020. It did not disappear.", year: 2020 },
    { id: "c6",  title: "Suggests injecting bleach as a COVID cure", hint: "Bleach manufacturers issued safety warnings", year: 2020 },
    { id: "c7",  title: "Tear-gases protesters for a Bible photo-op", hint: "Lafayette Square. A moment of disbelief.", year: 2020 },
    { id: "c8",  title: "Won't commit to a peaceful transfer of power", hint: "Asked directly. Did not answer.", year: 2020 },
    { id: "c9",  title: "Fires Defense Secretary Esper by tweet", hint: "Esper refused to use troops on protesters", year: 2020 },
    { id: "c10", title: "Signs USMCA, replacing 'worst deal ever'", hint: "His signature legislative win of the first term", year: 2020 },
  ],

  // Era D: 2021–2022, Jan 6 & Aftermath
  D: [
    { id: "d1",  title: "Jan 6: Supporters storm the US Capitol", hint: "First breach of the Capitol since 1814", year: 2021 },
    { id: "d2",  title: "Impeached a second time for inciting Jan 6", hint: "First in history. Acquitted again.", year: 2021 },
    { id: "d3",  title: "Calls Putin 'a genius' as Russia invades", hint: "Days before the full invasion of Ukraine", year: 2022 },
    { id: "d4",  title: "Takes the Fifth 440 times in NY deposition", hint: "New York Attorney General fraud case, 2022", year: 2022 },
    { id: "d5",  title: "FBI raids Mar-a-Lago, finds 300+ classified docs", hint: "Including Top Secret/SCI documents", year: 2022 },
    { id: "d6",  title: "Launches 2024 run three days after midterms", hint: "Two federal indictments still to come", year: 2022 },
    { id: "d7",  title: "Calls to 'terminate' parts of the Constitution", hint: "Even senior Republicans distanced themselves", year: 2022 },
    { id: "d8",  title: "Musk reinstates Trump's banned Twitter account", hint: "Trump had helped build the platform he lost", year: 2022 },
    { id: "d9",  title: "'I am your retribution' at CPAC", hint: "March 2023. The grievance tour continues.", year: 2023 },
  ],

  // Era E: 2023–2024, Indictments & Return
  E: [
    { id: "e1",  title: "Indicted over hush money to Stormy Daniels", hint: "Manhattan DA. 34 counts.", year: 2023 },
    { id: "e2",  title: "Second indictment: classified docs at Mar-a-Lago", hint: "The boxes in the bathroom. The pool photo.", year: 2023 },
    { id: "e3",  title: "Third indictment: conspired to overturn 2020", hint: "Jack Smith. Four federal counts.", year: 2023 },
    { id: "e4",  title: "Fourth indictment: RICO charges in Georgia", hint: "18 co-defendants. Mugshot released.", year: 2023 },
    { id: "e5",  title: "Confuses Nikki Haley with Nancy Pelosi", hint: "At a New Hampshire rally. Twice.", year: 2024 },
    { id: "e6",  title: "Falls asleep during his own criminal trial", hint: "New York. Court reporters noticed.", year: 2024 },
    { id: "e7",  title: "Wins Iowa with 51%, record for non-incumbent", hint: "The primary was effectively over that night", year: 2024 },
    { id: "e8",  title: "Supreme Court grants presidents broad immunity", hint: "A landmark ruling that reshapes the presidency", year: 2024 },
    { id: "e9",  title: "Survives assassination attempt, ear grazed", hint: "He pumps his fist. The photo goes around the world.", year: 2024 },
    { id: "e10", title: "Convicted on all 34 felony counts", hint: "Hush money. Manhattan. Unanimous verdict.", year: 2024 },
    { id: "e11", title: "Wins 2024, defeats Kamala Harris", hint: "Only second president to serve non-consecutive terms", year: 2024 },
  ],

  // Era F: 2025, Second Term (2 always drawn per week)
  F: [
    { id: "f1",  title: "Sentenced to unconditional discharge", hint: "No jail, no fine. History's most anticlimactic sentencing.", year: 2025 },
    { id: "f2",  title: "Pardons 1,500 Jan 6 rioters on day one", hint: "Including those convicted of violent offences", year: 2025 },
    { id: "f3",  title: "Courts block birthright citizenship order fast", hint: "14th Amendment. Still applies.", year: 2025 },
    { id: "f4",  title: "Posts AI image of himself dressed as the pope", hint: "Uploaded to Truth Social. Vatican did not comment.", year: 2025 },
    { id: "f5",  title: "Fires six inspectors general overnight", hint: "The government's internal watchdogs, gone", year: 2025 },
    { id: "f6",  title: "DOGE gains access to US Treasury payments", hint: "Controlling the flow of $6 trillion in federal funds", year: 2025 },
    { id: "f7",  title: "USAID dissolved, thousands placed on leave", hint: "Decades of foreign aid dismantled in days", year: 2025 },
    { id: "f8",  title: "Demands Canada become America's 51st state", hint: "In calls with Trudeau. Not joking.", year: 2025 },
    { id: "f9",  title: "Canada and Mexico hit with 25% tariffs", hint: "Ottawa and Mexico City were blindsided", year: 2025 },
    { id: "f10", title: "Berates Zelensky live in the Oval Office", hint: "'You're gambling with World War Three'", year: 2025 },
    { id: "f11", title: "SignalGate: Hegseth texts a journalist war plans", hint: "The journalist published every word of it", year: 2025 },
    { id: "f12", title: "'Liberation Day': tariffs on almost every country", hint: "April 2. Nobody felt liberated.", year: 2025 },
    { id: "f13", title: "Pauses most tariffs after markets lose trillions", hint: "'It takes courage and strength to be flexible'", year: 2025 },
    { id: "f14", title: "Pays El Salvador to jail deported migrants", hint: "President Bukele was happy to oblige", year: 2025 },
    { id: "f15", title: "Fires the entire Joint Chiefs of Staff", hint: "Unprecedented mass firing of military leadership", year: 2025 },
    { id: "f16", title: "Freezes $2.2B in federal grants to Harvard", hint: "The largest funding freeze of any US university", year: 2025 },
    { id: "f17", title: "Harvard sues, refuses to comply with freeze", hint: "President Garber: 'We will not surrender'", year: 2025 },
    { id: "f18", title: "US and China agree to a 90-day tariff truce", hint: "Markets surge. Economists exhale.", year: 2025 },
    { id: "f19", title: "First foreign trip: Saudi, Qatar and UAE", hint: "Hundreds of billions in investment deals announced", year: 2025 },
    { id: "f20", title: "'Big Beautiful Bill' passes: tax cuts, debt rises", hint: "Critics say it adds trillions to the national debt", year: 2025 },
    { id: "f21", title: "Musk calls 'Big Beautiful Bill' a betrayal", hint: "The DOGE bromance ends loudly on social media", year: 2025 },
    { id: "f22", title: "Renames Gulf of Mexico the 'Gulf of America'", hint: "Apple Maps updated it within days", year: 2025 },
  ],

};

// ============================================================
// DRAW ALGORITHM
// For each era, pre-shuffle the pool with a fixed season seed
// so the rotation order isn't obvious. Then for week W, pick
// item at index W % poolSize, guarantees full cycle, no repeats
// until every item has been seen.
// ============================================================
function seededRandom(seed) {
  let s = (seed ^ 0xdeadbeef) >>> 0;
  return () => {
    s ^= s << 13; s ^= s >>> 17; s ^= s << 5;
    return (s >>> 0) / 0x100000000;
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

// Season seed, change once per year to refresh the rotation order
const SEASON = 2025;

function pickForWeek(pool, eraOffset, weekNum) {
  const shuffled = seededShuffle(pool, SEASON * 1000 + eraOffset);
  return shuffled[weekNum % shuffled.length];
}

function buildWeeklyPuzzle(weekNum) {
  const a = pickForWeek(POOL.A, 1, weekNum);
  const b = pickForWeek(POOL.B, 2, weekNum);
  const c = pickForWeek(POOL.C, 3, weekNum);
  const d = pickForWeek(POOL.D, 4, weekNum);
  const e = pickForWeek(POOL.E, 5, weekNum);

  // For F (22 items, 2 needed): offset second pick by half the pool size
  const f1 = pickForWeek(POOL.F, 6, weekNum);
  const f2 = pickForWeek(POOL.F, 6, weekNum + Math.floor(POOL.F.length / 2));

  // Sort oldest to newest = correct answer order
  const events = [a, b, c, d, e, f1, f2].sort((x, y) =>
    x.year !== y.year ? x.year - y.year : (x.id < y.id ? -1 : 1)
  );

  // Warn loudly in dev if any title sneaks past 50 chars
  if (process.env.NODE_ENV !== "production") {
    events.forEach(ev => {
      if (ev.title.length > 50) console.warn(`[TRUMPLE] Title too long (${ev.title.length} chars): "${ev.title}"`);
    });
  }

  // Renumber ids 1-7 for the game engine
  return events.map((ev, i) => ({ ...ev, id: i + 1 }));
}

// ============================================================
// ROUTE HANDLER
// ============================================================
const EPOCH_MONDAY = new Date("2025-01-20T12:00:00Z"); // Inauguration week = week 0

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const dateParam = searchParams.get("date") || new Date().toISOString().split("T")[0];

  function getMondayOf(dateStr) {
    const d = new Date(dateStr + "T12:00:00Z");
    const day = d.getUTCDay();
    d.setUTCDate(d.getUTCDate() - (day === 0 ? 6 : day - 1));
    return d;
  }

  const weekMonday = getMondayOf(dateParam);
  const weekNum    = Math.round((weekMonday - EPOCH_MONDAY) / (7 * 24 * 3600 * 1000));

  if (weekNum < 0) {
    return NextResponse.json({ error: "No puzzle before launch" }, { status: 404 });
  }

  // Strip em dashes automatically at serve time
  // No future event can sneak one through, no matter who edits the pool.
  const clean = (str) => str.replace(/ \u2014 /g, ", ").replace(/\u2014/g, "-");

  const events      = buildWeeklyPuzzle(weekNum);
  const answerOrder = events.map(e => e.id);
  const shuffled    = seededShuffle(
    events.map(e => ({ id: e.id, title: clean(e.title), hint: clean(e.hint) })),
    weekNum * 999983 + 7
  );
  const yearMap     = Object.fromEntries(events.map(e => [e.id, e.year]));

  return NextResponse.json({
    puzzle: { id: "w" + weekNum, weekNum, date: dateParam, events: shuffled },
    answerOrder,
    yearMap,
  });
}
