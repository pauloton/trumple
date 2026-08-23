import { NextResponse } from "next/server.js";
import {
  CLASSIC_SECOND_TERM_EVENTS,
  SECOND_TERM_EVENTS as DATED_SECOND_TERM_EVENTS,
  isFirstSaturday,
  weeklyEventsForSunday,
} from "../../../lib/event-library.js";
import { createDailyRotationSelector } from "../../../lib/daily-rotation.js";

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
// ============================================================
// WEEKLY EVENTS — updated every Saturday for Sunday's edition
// Events must be in chronological order (earliest = id 1).
// Same rules as POOL: max 50 chars, no em dashes, punchy.
// To skip weekly edition on a given Sunday, set to null.
// ============================================================
// Disabled while the weekly editorial workflow is paused. Leaving this null
// makes Sundays fall back to the normal daily puzzle instead of replaying stale
// stories. Restore exactly 7 freshly verified events to re-enable the edition.
const WEEKLY_EVENTS = null;

// ============================================================
// SECOND TERM DRAFT EVENTS — currently paused
// This recovered pool needs a source-and-date audit before it can safely power
// a chronology game. Keep the draft here, but do not serve it until every item
// has a verified date and the array is sorted by that date.
// MAX 50 chars per title, no em dashes, sardonic voice.
// ============================================================
const SECOND_TERM_EVENTS = [
  { id: "st1",  title: "Musk's odd arm gesture at inauguration goes viral",         hint: "Some called it a Roman salute. Musk said it was enthusiasm." },
  { id: "st2",  title: "Bans trans girls from school sports on day one",             hint: "Day one. Executive order number four." },
  { id: "st3",  title: "Bans the word 'diversity' across all agencies",              hint: "Day one. Executive order number two." },
  { id: "st4",  title: "Pardons a drug kingpin to impress Libertarians",             hint: "Promised it at a Libertarian convention. Delivered on day one." },
  { id: "st5",  title: "Quits the Paris climate deal. For the second time.",         hint: "First time: 2017. Second time: 2025. Same pen." },
  { id: "st6",  title: "Pulls US out of the WHO. Also for the second time.",         hint: "Second time doing this. Same executive order, new date." },
  { id: "st7",  title: "Renames Gulf of Mexico the 'Gulf of America'",               hint: "Apple Maps updated it within days." },
  { id: "st8",  title: "Changes Denali back to Mount McKinley",                      hint: "Obama renamed it in 2015. He renamed it back in 2025." },
  { id: "st9",  title: "Threatens to withhold fire aid from California",             hint: "While the LA fires were still burning." },
  { id: "st10", title: "Sends active duty troops to the US southern border",         hint: "Sent active-duty troops. Called it an invasion." },
  { id: "st11", title: "Claims personal credit for keeping TikTok alive",            hint: "App was hours from shutting down. He gave an extension." },
  { id: "st12", title: "$MELANIA coin crashes days after launching",                 hint: "Launched the day before inauguration. Peak: $13. One week later: $2." },
  { id: "st13", title: "Fires the FBI director, puts a loyalist in charge",          hint: "Kash Patel. Who had a list of perceived enemies." },
  { id: "st14", title: "Designates Mexican drug cartels as terror groups",           hint: "Mexico sent 10,000 troops to the border within days." },
  { id: "st15", title: "Vows to 'take back' the Panama Canal from Panama",           hint: "Panama pointed out they own it. He was unmoved." },
  { id: "st16", title: "Names himself chairman of the Kennedy Center",               hint: "Fired the existing board first. Then moved in." },
  { id: "st17", title: "Sends a delegation to Greenland to 'look around'",           hint: "Both in one afternoon. No replacements named." },
  { id: "st18", title: "Threatens Denmark with tariffs over Greenland",              hint: "Denmark said no again. He threatened again." },
  { id: "st19", title: "Says he'll acquire Greenland 'one way or another'",          hint: "Did not clarify what the other way was." },
  { id: "st20", title: "Invokes 1798 wartime act to deport Venezuelans",             hint: "The Alien Enemies Act. Last used in World War II." },
  { id: "st21", title: "Describes mass deportations as going 'beautifully'",         hint: "Said this at the White House. Several times." },
  { id: "st22", title: "Bills taxpayers to stay at his own Mar-a-Lago",              hint: "Secret Service rents golf carts at full rate." },
  { id: "st23", title: "DOGE fires 200,000+ federal workers in weeks",               hint: "Probationary employees first. Then everyone else." },
  { id: "st24", title: "Calls King Charles to brag about his election win",          hint: "Framework only. Details to follow. Still following." },
  { id: "st25", title: "Calls Putin 'a genius' as Russia invades",                   hint: "Said on Fox News. Repeated later." },
  { id: "st26", title: "Announces military ceasefire via Truth Social post",         hint: "The Pentagon confirmed it after he posted." },
  { id: "st27", title: "Orders the Department of Education to close",                hint: "Signs the executive order. Congress would need to agree." },
  { id: "st28", title: "Fires the Librarian of Congress, Carla Hayden",              hint: "First Black woman in the role. No reason given." },
  { id: "st29", title: "Bans Associated Press from White House",                     hint: "AP refused to call it the 'Gulf of America'." },
  { id: "st30", title: "Proposes exporting US prisoners to El Salvador",             hint: "Bukele said yes immediately. ACLU said no." },
  { id: "st31", title: "Lets Elon sit in on classified Cabinet meetings",            hint: "Invited them all to Mar-a-Lago. They came." },
  { id: "st32", title: "Reopens national monuments to oil and gas drilling",         hint: "To speed up 'energy dominance'. Courts intervened." },
  { id: "st33", title: "Calls judges 'Trump haters' for ruling against him",         hint: "Every judge. Every ruling. Every time." },
  { id: "st34", title: "Sells Mar-a-Lago memberships to foreign diplomats",          hint: "Donors also got a photo. And presumably a Diet Coke." },
  { id: "st35", title: "Deports legal US resident by mistake, refuses fix",          hint: "Kilmar Abrego Garcia. Courts ordered his return. He said no." },
  { id: "st36", title: "Fires hundreds of NOAA weather forecasters",                 hint: "During hurricane season prep. Meteorologists were alarmed." },
  { id: "st37", title: "Threatens to quit NATO if allies refuse to pay up",          hint: "Then paused them. Then threatened again." },
  { id: "st38", title: "Holds Ukraine peace talks without inviting Ukraine",         hint: "Kyiv found out from the press. They were not pleased." },
  { id: "st39", title: "Sells US green cards to millionaires for $5M each",          hint: "Pay $5M, skip the line. Green card included." },
  { id: "st40", title: "Threatens to fire Fed Chair for not cutting rates",          hint: "Jerome Powell declined to cut rates. Trump declined to accept this." },
  { id: "st41", title: "Calls newly elected Canadian PM 'Governor Carney'",          hint: "He called Trudeau 'Governor Trudeau' for two years." },
  { id: "st42", title: "Claims credit for lowering egg prices to Congress",          hint: "Eggs hit record highs the same week he said this." },
  { id: "st43", title: "Egg prices hit record highs despite his promises",            hint: "Bird flu and tariffs contributed. He blamed Biden." },
  { id: "st44", title: "Posts AI image of himself as a buff military hero",          hint: "Multiple times. On Truth Social. Sincerely." },
  { id: "st45", title: "Mandates schools teach his version of history",              hint: "Executive order. Teachers were given updated guidelines." },
  { id: "st46", title: "Proposes the US government buy and run TikTok",              hint: "He offered Oracle a stake. Congress had questions." },
  { id: "st47", title: "Threatens to revoke Harvard's tax-exempt status",            hint: "After Harvard won its first lawsuit against him." },
  { id: "st48", title: "Harvard sues, refuses to comply with freeze",                hint: "President Garber: 'We will not surrender'" },
  { id: "st49", title: "Targets Columbia after Harvard refuses to comply",           hint: "Columbia agreed to most demands. Harvard did not." },
  { id: "st50", title: "Claims he has 'total authority' over every state",           hint: "Schedule F. Signed, rescinded by Obama, resigned by Trump." },
  { id: "st51", title: "Proposes reopening Alcatraz as a federal prison",            hint: "The island prison closed in 1963." },
  { id: "st52", title: "Proposes movie tariffs, Hollywood has questions",            hint: "100% tariff on foreign-made films. Studios began doing math." },
  { id: "st53", title: "Threatens to withhold hurricane aid from states",            hint: "Governors said they hadn't complained. He disagreed." },
  { id: "st54", title: "Gives himself an A-plus for his first 100 days",             hint: "Unprompted. In an interview. Very sincerely." },
  { id: "st55", title: "Pitches $175B missile shield. Canada not included.",         hint: "Estimated cost: $175 billion. Canada was not included." },
  { id: "st56", title: "Admits 59 white S. Africans as refugees", hint: "May 2025. While capping refugee admissions near-zero globally, fast-tracked 59 white Afrikaners." },
  { id: "st57", title: "Signs 'One Big Beautiful Bill' on July 4", hint: "Jul 4, 2025. Cut Medicaid and food stamps on Independence Day, then threw a party on the White House lawn." },
  { id: "st58", title: "Proposes IQ test for AOC and Crockett", hint: "Jul 2025. After Rep. Crockett insulted him, offered to settle it scientifically with a live IQ contest." },
  { id: "st59", title: "Invents tale of uncle teaching Unabomber", hint: "Jul 2025. During an AI speech, detoured into a fabricated story about his uncle and Ted Kaczynski at MIT." },
  { id: "st60", title: "Tours Federal Reserve with Powell in tow", hint: "Jul 24, 2025. After years of demanding Powell be fired, toured his $2.5B renovation project alongside him." },
  { id: "st61", title: "Calls jobs data 'RIGGED,' fires stats chief", hint: "Aug 1, 2025. A weak jobs report prompted a Truth Social tantrum and the firing of the Bureau of Labor Statistics head." },
  { id: "st62", title: "Tells UN climate science is 'greatest con job'", hint: "Sep 23, 2025. Addressed the UN General Assembly to announce that climate scientists are stupid and it's all a scam." },
  { id: "st63", title: "Demolishes White House East Wing for ballroom", hint: "Oct 23, 2025. An excavator tore into the historic East Wing to make room for Trump's personal party venue." },
  { id: "st64", title: "Sets refugee cap favoring white Afrikaners", hint: "Nov 2025. Capped annual refugee admissions at 7,500, with white South Africans given explicit priority." },
  { id: "st65", title: "Launches bombing campaign on Iran", hint: "Apr 2, 2026. Initiated Operation Epic Fury: the first direct US military assault on Iran in history." },
];

// ============================================================
// EDITIONS — each one is fully self-describing so clients
// (web + native) render from data alone, no hardcoded theme
// tables. SPECIAL_EDITIONS is keyed by UTC day-of-week
// (0=Sun, 3=Wed). Any other weekday falls back to DAILY_EDITION.
//
// Schema:
//   key, label (null = no badge), taglines[3],
//   badgeStyle ("gold"|"dark"|null),
//   buttonColor (hex), bgImageUrl (absolute path under /public),
//   bgOverlayOpacity (0..1), layoutVariant ("default"|"taglines-below"),
//   events OR pool draw (build: "static"|"auto").
// ============================================================
const SECOND_TERM_EDITION = {
  key: "second-term",
  label: null,
  taglines: ["The Second Term.", "Somehow, More Chaos.", "Put It Back In Order."],
  badgeStyle: null,
  buttonColor: "#B22234",
  bgImageUrl: "/bg/red.jpg",
  bgOverlayOpacity: 0.45,
  layoutVariant: "default",
};

const WEEKLY_EDITION = {
  key: "weekly",
  label: "THIS WEEK",
  taglines: ["Seven Days.", "Seven Fresh Disasters.", "Put Them Back In Order."],
  badgeStyle: "gold",
  buttonColor: "#B22234",
  bgImageUrl: "/weekly-war.png",
  bgOverlayOpacity: 0.45,
  layoutVariant: "default",
};

const LEGACY_EDITION = {
  key: "legacy",
  label: "LEGACY EDITION",
  taglines: ["2016 To Today.", "One Very Long Emergency.", "Put It Back In Order."],
  badgeStyle: "dark",
  buttonColor: "#0A1628",
  bgImageUrl: "/bg/red.jpg",
  bgOverlayOpacity: 0.18,
  layoutVariant: "taglines-below",
};

function buildEditionMeta(e) {
  return {
    key:              e.key,
    label:            e.label,
    taglines:         e.taglines,
    badgeStyle:       e.badgeStyle,
    buttonColor:      e.buttonColor,
    bgImageUrl:       e.bgImageUrl,
    bgOverlayOpacity: e.bgOverlayOpacity,
    layoutVariant:    e.layoutVariant,
  };
}

const POOL = {

  // Era A: 2015–2016, The Rise
  A: [
    { id: "a1",  title: "Calls Mexican immigrants 'rapists'", hint: "June 16, 2015 launch speech", year: 2015 },
    { id: "a2",  title: "'I like people who weren't captured'", hint: "Iowa. The John McCain dig.", year: 2015 },
    { id: "a3",  title: "Claims NJ Muslims cheered 9/11 on rooftops", hint: "No evidence. He never backed down.", year: 2015 },
    { id: "a4",  title: "Access Hollywood: brags about groping women", hint: "Billy Bush. A hot mic. A bus.", year: 2016 },
    { id: "a5",  title: "Won't say he'll accept the election result", hint: "Clinton called it 'horrifying'", year: 2016 },
    { id: "a6",  title: "Loses popular vote by 3M, becomes president anyway", hint: "The night everyone got it wrong", year: 2016 },
    { id: "a7",  title: "Pays $25M to settle Trump University fraud", hint: "Students said they were defrauded", year: 2016 },
    { id: "a8",  title: "Spicer: inauguration crowd 'the largest ever'", hint: "Alternative facts. Day one.", year: 2017 },
    { id: "a9",  title: "Mocks a disabled reporter's movements at rally", hint: "Reporters and the public were appalled", year: 2015 },
    { id: "a10", title: "'I could shoot someone on 5th Ave' and win", hint: "Iowa rally. He wasn't joking.", year: 2016 },
    { id: "a11", title: "Retweets white supremacist crime statistics", hint: "The account had a swastika in its profile.", year: 2015 },
    { id: "a12", title: "Claims Cruz's dad was photographed with Oswald", hint: "Before the Indiana primary. No proof.", year: 2016 },
    { id: "a13", title: "Coins 'Little Marco', Rubio never recovers", hint: "Rubio tried 'Little Donald'. It didn't land.", year: 2016 },
    { id: "a14", title: "Brags about hand size at a presidential debate", hint: "A sitting senator brought it up. He took the bait.", year: 2016 },
    { id: "a15", title: "Called Alicia Machado 'Miss Piggy' after she won", hint: "She was Miss Universe. He ran the pageant.", year: 1996 },
    { id: "a16", title: "Will pay legal fees if you punch a protester", hint: "Said it. At the rally. Out loud.", year: 2016 },
    { id: "a17", title: "Claims he knows more about ISIS than the generals", hint: "All of them. More than all of them.", year: 2016 },
    { id: "a18", title: "Promises Mexico will pay for the wall. Mexico: no.", hint: "Mexico was never asked. Mexico said no.", year: 2015 },
    { id: "a19", title: "Says climate change was invented by China", hint: "In a tweet. Still up. Still wrong.", year: 2012 },
    { id: "a20", title: "Promises to bring back waterboarding, and worse", hint: "Said this at a South Carolina rally.", year: 2016 },
    { id: "a21", title: "Feuds with Gold Star Khan family for a full week", hint: "Khizr Khan spoke at the DNC. Trump could not let it go.", year: 2016 },
    { id: "a22", title: "Says he'd date Ivanka 'if she weren't my daughter'", hint: "Said this on The View. Twice.", year: 2006 },
    { id: "a23", title: "NYT reveals he lost $916M and paid no taxes", hint: "His accountants found perfectly legal loopholes.", year: 2016 },
    { id: "a24", title: "Calls Hillary Clinton 'a nasty woman' in debate", hint: "Hot mic. She was mid-sentence.", year: 2016 },
    { id: "a25", title: "Leads 'Lock Her Up' chants at his own rallies", hint: "She was never charged with anything.", year: 2016 },
    { id: "a26", title: "Visits CIA, talks about himself for 20 minutes", hint: "In front of the memorial wall for fallen agents.", year: 2017 },
    { id: "a27", title: "Delivers 'American carnage' inaugural address", hint: "Reagan's team called it the darkest speech they'd heard.", year: 2017 },
    { id: "a28", title: "Puts fake Time covers in all his golf clubs", hint: "Time asked him to remove them. He didn't.", year: 2017 },
    { id: "a29", title: "Says he turned down Time's Person of the Year", hint: "Also claimed this about drones, banks, and trade.", year: 2015 },
    { id: "a30", title: "Refuses to release tax returns, blaming an audit", hint: "The IRS confirmed audits don't prevent disclosure.", year: 2016 },
    { id: "a31", title: "Tells Boy Scouts about Manhattan yacht parties", hint: "40,000 scouts. A very unusual Jamboree speech.", year: 2017 },
    { id: "a32", title: "Signs Muslim ban, airports descend into chaos", hint: "Lawyers flooded airports. Courts blocked it twice.", year: 2017 },
    { id: "a33", title: "Proposes a deportation force to remove 11M people", hint: "Estimated cost: $600 billion. Nobody blinked.", year: 2015 },
    { id: "a34", title: "Calls for nationwide stop-and-frisk policing", hint: "The Supreme Court had already ruled it unconstitutional.", year: 2016 },
    { id: "a35", title: "Claims nobody respects women more than he does", hint: "Said this at a debate. The crowd was quiet.", year: 2015 },
    { id: "a36", title: "Claims 3M illegal votes cost him the popular vote", hint: "He won the Electoral College. That wasn't enough.", year: 2016 },
  ],

  // Era B: 2017–2018, First Term Chaos
  B: [
    { id: "b1",  title: "Calls Haiti and Africa 'shithole countries'", hint: "Said in an Oval Office meeting. Widely reported.", year: 2018 },
    { id: "b2",  title: "Flynn fired after 24 days for lying about lying", hint: "Shortest NSA tenure in history", year: 2017 },
    { id: "b3",  title: "Fires Comey over 'the Russia thing'", hint: "His own words. On tape.", year: 2017 },
    { id: "b4",  title: "Tells Russians he fired 'nut job' Comey", hint: "In the Oval. The next day.", year: 2017 },
    { id: "b5",  title: "Scaramucci lasts 10 days, a White House record", hint: "An all-time record, even by Trump standards", year: 2017 },
    { id: "b6",  title: "'Fine people on both sides' at Charlottesville", hint: "A remark that follows him still", year: 2017 },
    { id: "b7",  title: "Tweets 'covfefe' at midnight, never explains it", hint: "He never explained it. Neither did Spicer.", year: 2017 },
    { id: "b8",  title: "Throws paper towels to Puerto Rico survivors", hint: "Hurricane Maria. A crowd catch. Backlash.", year: 2017 },
    { id: "b9",  title: "Tweets his nuclear button is bigger than Kim's", hint: "New Year's Day, 2018", year: 2018 },
    { id: "b10", title: "Calls himself 'a very stable genius' in a tweet", hint: "Responding to Wolff's 'Fire and Fury'", year: 2018 },
    { id: "b11", title: "Meets Kim Jong Un, declares problem solved", hint: "Historic handshake. No deal ever followed.", year: 2018 },
    { id: "b12", title: "Calls Omarosa a 'dog' after she's fired", hint: "She had a recording. Several, actually.", year: 2018 },
    { id: "b13", title: "Pardons 'America's toughest sheriff' before trial", hint: "Before he was even sentenced. Skipped the line.", year: 2017 },
    { id: "b14", title: "Defends Roy Moore against multiple accusers", hint: "Moore was accused by nine women. He backed him anyway.", year: 2017 },
    { id: "b15", title: "Self-rates Puerto Rico response a perfect 10", hint: "3,000 people died. He gave himself a perfect score.", year: 2018 },
    { id: "b16", title: "Claims he invented the word 'fake'", hint: "He said this. To the press. Sincerely.", year: 2017 },
    { id: "b17", title: "Proposes military parade down Pennsylvania Avenue", hint: "Pentagon estimated cost: $92 million. It was cancelled.", year: 2018 },
    { id: "b18", title: "Praises Frederick Douglass as if he's still alive", hint: "Douglass died in 1895. He's 'being recognized more and more.'", year: 2017 },
    { id: "b19", title: "Says he'd run into Parkland school unarmed", hint: "Said he'd have done it 'even without a weapon'.", year: 2018 },
    { id: "b20", title: "Claims he can declassify documents by thinking", hint: "His legal team argued this in federal court.", year: 2022 },
    { id: "b21", title: "Announces transgender troop ban by tweet at 9am", hint: "The military had no idea this was coming.", year: 2017 },
    { id: "b22", title: "Claims Finland rakes forests and has no wildfires", hint: "Finnish president said no one had told him this.", year: 2018 },
    { id: "b23", title: "Calls Stormy Daniels 'Horseface' in a tweet", hint: "His lawyers had just settled her lawsuit.", year: 2018 },
    { id: "b24", title: "Eats two scoops of ice cream while guests get one", hint: "Time magazine reported it. He was not amused.", year: 2017 },
    { id: "b25", title: "Gives billionaires a Christmas tax cut", hint: "Added $1.9 trillion to the deficit. Merry Christmas.", year: 2017 },
    { id: "b26", title: "Fires Secretary of State Tillerson by tweet", hint: "Tillerson heard about it from a staffer.", year: 2018 },
    { id: "b27", title: "Fires AG Sessions to kneecap the Mueller probe", hint: "Sessions had recused himself from the Mueller probe.", year: 2018 },
    { id: "b28", title: "Brags he has 'the best words' in a speech", hint: "Bannon: 'I was the only guy who could make it work.'", year: 2017 },
    { id: "b29", title: "Calls his generals 'a bunch of dopes and babies'", hint: "His resignation letter was unusually pointed.", year: 2018 },
    { id: "b30", title: "Calls the media 'enemy of the American people'", hint: "Said it at a rally. Repeated it for years.", year: 2017 },
    { id: "b31", title: "Calls Oprah 'very insecure' in a 3am tweet", hint: "After watching her on 60 Minutes. He could not sleep.", year: 2018 },
    { id: "b32", title: "Diet Coke button on the Oval Office desk revealed", hint: "One press and a butler appears with a Diet Coke.", year: 2017 },
    { id: "b33", title: "Calls Tim Cook 'Tim Apple' at a Cabinet meeting", hint: "He later claimed he said 'Tim' and the rest was abbreviated.", year: 2019 },
    { id: "b34", title: "Threatens to send US military into Mexico", hint: "Called to discuss this with the Mexican president.", year: 2017 },
    { id: "b35", title: "Rated his first year a 'A-plus' in cabinet meeting", hint: "Each cabinet member was also asked to rate him.", year: 2017 },
    { id: "b36", title: "2,000+ migrant children taken from their parents", hint: "Children in cages. Global outrage.", year: 2018 },
  ],

  // Era C: 2019–2020, Impeachment I & COVID
  C: [
    { id: "c1",  title: "Asks Ukraine for Biden dirt on a recorded call", hint: "July 25, 2019. 'The perfect phone call.'", year: 2019 },
    { id: "c2",  title: "Impeached for abuse of power, acquitted", hint: "Charges: abuse of power, obstruction", year: 2019 },
    { id: "c3",  title: "Doctored hurricane map with a Sharpie", hint: "Dorian wasn't heading to Alabama. He said it was.", year: 2019 },
    { id: "c4",  title: "Suggests buying Greenland from Denmark", hint: "Denmark called it 'absurd'. He cancelled the state visit.", year: 2019 },
    { id: "c5",  title: "'Totally under control': COVID will disappear", hint: "February 2020. It did not disappear.", year: 2020 },
    { id: "c6",  title: "Suggests injecting bleach as a COVID cure", hint: "Bleach manufacturers issued safety warnings", year: 2020 },
    { id: "c7",  title: "Tear-gases protesters for a Bible photo-op", hint: "Lafayette Square. A moment of disbelief.", year: 2020 },
    { id: "c8",  title: "Won't commit to a peaceful transfer of power", hint: "Asked directly. Did not answer.", year: 2020 },
    { id: "c9",  title: "Asks why we can't nuke hurricanes to stop them", hint: "Asked this in a national security briefing.", year: 2019 },
    { id: "c10", title: "Claims wind turbines cause cancer and kill eagles", hint: "Neither claim has any scientific basis.", year: 2019 },
    { id: "c11", title: "E. Jean Carroll publicly accuses him of rape", hint: "He said he'd never met her. A photo showed otherwise.", year: 2019 },
    { id: "c12", title: "Bob Woodward tapes: 'I like playing it down'", hint: "He knew COVID was deadly in February. He told Woodward.", year: 2020 },
    { id: "c13", title: "Takes hydroxychloroquine publicly to own the libs", hint: "His own FDA had declined to recommend it.", year: 2020 },
    { id: "c14", title: "White House Barrett event infects attendees", hint: "Rose Garden. No masks. 12 people test positive.", year: 2020 },
    { id: "c15", title: "Tells crowd: 'Proud Boys, stand back and stand by'", hint: "At the first presidential debate. He did not condemn them.", year: 2020 },
    { id: "c16", title: "Asks if UV light inside the body could kill COVID", hint: "In front of the CDC director, who stared at the floor.", year: 2020 },
    { id: "c17", title: "Tests positive for COVID, says he feels 'perfect'", hint: "He was hospitalized at Walter Reed that night.", year: 2020 },
    { id: "c18", title: "Suggests delaying the 2020 election via tweet", hint: "He cannot do this. The Constitution disagreed.", year: 2020 },
    { id: "c19", title: "Retweets demon sperm doctor's COVID cure video", hint: "The account was suspended. The video had 14M views.", year: 2020 },
    { id: "c20", title: "Pardons Michael Flynn on Thanksgiving eve", hint: "Flynn had already pleaded guilty twice.", year: 2020 },
    { id: "c21", title: "Calls John McCain 'a dummy' after his death", hint: "Said it multiple times. At multiple rallies.", year: 2019 },
    { id: "c22", title: "Retweets 'white power' video, blames a staffer", hint: "The tweet was up for three hours.", year: 2020 },
    { id: "c23", title: "Calls Kamala Harris 'a monster' in USA Today", hint: "The op-ed ran the morning after the VP debate.", year: 2020 },
    { id: "c24", title: "Declares victory at 2am before votes are tallied", hint: "Millions of mail-in votes hadn't been counted.", year: 2020 },
    { id: "c25", title: "Fires security chief who confirmed Biden won", hint: "Chris Krebs said it was the most secure election ever.", year: 2020 },
    { id: "c26", title: "Holds maskless rallies as COVID kills 1,000/day", hint: "Herman Cain attended a Tulsa rally. He died of COVID.", year: 2020 },
    { id: "c27", title: "Loses 60 straight lawsuits over the 2020 election", hint: "60 cases. Judges appointed by Republicans, Democrats, and him.", year: 2020 },
    { id: "c28", title: "Calls Georgia to 'find' him exactly 11,780 votes", hint: "The call was recorded. He asked nicely. Then less nicely.", year: 2021 },
    { id: "c29", title: "Tells Pence to simply not certify the election", hint: "Pence's lawyer told him he couldn't. He did it anyway.", year: 2021 },
    { id: "c30", title: "Kicks off 'Stop the Steal' the moment polls close", hint: "Before a single state had been called.", year: 2020 },
    { id: "c31", title: "Floats a 'martial law' option to stay in power", hint: "Discussed in a December Oval Office meeting.", year: 2020 },
    { id: "c32", title: "Never concedes the 2020 election. Still hasn't.", hint: "He still hasn't. Formally or otherwise.", year: 2020 },
    { id: "c33", title: "Insists COVID stimulus checks bear his signature", hint: "Delayed payments by days. Checks legally can't say 'Trump'.", year: 2020 },
    { id: "c34", title: "Leaves hospital, calls COVID 'a gift from God'", hint: "He said this at the White House. On camera.", year: 2020 },
    { id: "c35", title: "Team books 'Four Seasons Landscaping' by mistake", hint: "The press conference was next to Fantasy Island adult shop.", year: 2020 },
    { id: "c36", title: "Calls COVID the 'Kung Flu' at rallies", hint: "Said it multiple times. Did not walk it back.", year: 2020 },
  ],

  // Era D: 2021–2023, Jan 6 & Aftermath
  D: [
    { id: "d1",  title: "Supporters storm the Capitol. He watches it on TV.", hint: "First breach of the Capitol since 1814", year: 2021 },
    { id: "d2",  title: "Impeached a second time for inciting Jan 6", hint: "First in history. Acquitted again.", year: 2021 },
    { id: "d3",  title: "Calls Putin 'a genius' as Russia invades", hint: "Days before the full invasion of Ukraine", year: 2022 },
    { id: "d4",  title: "Takes the Fifth 440 times in NY deposition", hint: "New York Attorney General fraud case, 2022", year: 2022 },
    { id: "d5",  title: "FBI raids Mar-a-Lago, finds 300+ classified docs", hint: "Including Top Secret/SCI documents", year: 2022 },
    { id: "d6",  title: "Hosts Kanye and white nationalist Nick Fuentes", hint: "Dinner at Mar-a-Lago. Republicans were not pleased.", year: 2022 },
    { id: "d7",  title: "Posts call to 'terminate' the Constitution", hint: "Even senior Republicans distanced themselves", year: 2022 },
    { id: "d8",  title: "Claims he personally invented the term 'fake news'", hint: "Trump had been banned after Jan 6", year: 2022 },
    { id: "d9",  title: "'I am your retribution' at CPAC", hint: "March 2023. The grievance tour continues.", year: 2023 },
    { id: "d10", title: "Releases $99 superhero trading card collection", hint: "Sold out in 12 hours. No irony detected.", year: 2022 },
    { id: "d11", title: "Calls DeSantis 'Ron DeSanctimonious'", hint: "Said it at a rally before DeSantis even announced.", year: 2022 },
    { id: "d12", title: "Calls Mitch McConnell a 'dumb son of a bitch'", hint: "At a closed-door donor event. It was recorded.", year: 2022 },
    { id: "d13", title: "Calls Pence a coward for certifying the election", hint: "While the mob was chanting 'Hang Mike Pence'.", year: 2021 },
    { id: "d14", title: "Promises to be a dictator 'only on day one'", hint: "Said this on Fox News. Then said he was joking.", year: 2023 },
    { id: "d15", title: "Tells DOJ to 'just say the election was corrupt'", hint: "Still does. Every interview. Every rally.", year: 2021 },
    { id: "d16", title: "Claims he'd end Ukraine war in under 24 hours", hint: "Never explained how. Still hasn't.", year: 2023 },
    { id: "d17", title: "Calls political opponents 'the enemy within'", hint: "Said this repeatedly in the closing weeks of the campaign.", year: 2024 },
    { id: "d18", title: "Vows to use DOJ to prosecute political enemies", hint: "Said this explicitly at a rally. Crowd cheered.", year: 2023 },
    { id: "d19", title: "Endorses 22 election deniers in the 2022 midterms", hint: "Liz Cheney had voted to impeach him. He did not forget.", year: 2022 },
    { id: "d20", title: "Calls Jan 6 rioters 'hostages' and 'patriots'", hint: "Four criminal referrals. Unprecedented for a committee.", year: 2022 },
    { id: "d21", title: "Calls Fani Willis 'racist' for indicting him", hint: "The jury recommended charges for 39 people.", year: 2023 },
    { id: "d22", title: "Watched Jan 6 riot on TV for 3 hours, did nothing", hint: "Aides begged him to call it off. He watched Fox News.", year: 2021 },
    { id: "d23", title: "General Flynn urges him to declare martial law", hint: "Flynn suggested seizing voting machines in the meeting.", year: 2020 },
    { id: "d24", title: "Shares posts calling for military trials of Obama", hint: "His team said he didn't know what QAnon was.", year: 2020 },
    { id: "d25", title: "Valued Mar-a-Lago at $1.5B. Judge said $18M.", hint: "The gap between his math and reality: $1.48 billion.", year: 2023 },
    { id: "d26", title: "Found liable for business fraud by New York judge", hint: "Judge ruled he inflated assets for years.", year: 2023 },
    { id: "d27", title: "Demands Pulitzer board strip 'Russia hoax' prizes", hint: "The case was quietly dropped months later.", year: 2022 },
    { id: "d28", title: "Claims to be history's most persecuted person", hint: "His campaign confirmed the election was not stolen.", year: 2022 },
    { id: "d29", title: "Says wind turbines are killing all the whales", hint: "No peer-reviewed study supports this. He keeps saying it.", year: 2023 },
    { id: "d30", title: "Says FBI planted classified docs, offers no proof", hint: "His own security tape showed him moving the boxes.", year: 2022 },
    { id: "d31", title: "Turns each indictment into a fundraising email", hint: "Raised over $7M after the first one was announced.", year: 2023 },
    { id: "d32", title: "Warns of 'death and destruction' if indicted", hint: "Posted this on Truth Social. Was then indicted.", year: 2023 },
    { id: "d33", title: "CNN town hall devolves into a campaign rally", hint: "The audience laughed with him. Journalists were mortified.", year: 2023 },
    { id: "d34", title: "Mugshot goes viral, he puts it on $34 shirts", hint: "First US president to have a mugshot. He leaned in.", year: 2023 },
    { id: "d35", title: "Calls his own judge 'a radical left monster'", hint: "He said this outside multiple courtrooms.", year: 2023 },
    { id: "d36", title: "Posts image of himself with baseball bat near DA", hint: "Posted on Truth Social the day before his Manhattan arraignment.", year: 2023 },
  ],

  // Era E: 2023–2024, Indictments & Return
  E: [
    { id: "e1",  title: "Indicted over hush money to Stormy Daniels", hint: "Manhattan DA. 34 counts.", year: 2023 },
    { id: "e2",  title: "Second indictment: classified docs at Mar-a-Lago", hint: "The boxes in the bathroom. The pool photo.", year: 2023 },
    { id: "e3",  title: "Third indictment: conspired to overturn 2020", hint: "Jack Smith. Four federal counts.", year: 2023 },
    { id: "e4",  title: "Fourth indictment: RICO charges in Georgia", hint: "18 co-defendants. Mugshot released.", year: 2023 },
    { id: "e5",  title: "Confuses Nikki Haley with Nancy Pelosi", hint: "At a New Hampshire rally. Twice.", year: 2024 },
    { id: "e6",  title: "Falls asleep during his own criminal trial", hint: "New York. Court reporters noticed.", year: 2024 },
    { id: "e7",  title: "Sells $399 gold sneakers at Sneaker Con", hint: "Philadelphia. They sold out immediately.", year: 2024 },
    { id: "e8",  title: "Sells $60 Trump Bible, calls it his favorite book", hint: "Includes the Constitution and Declaration of Independence", year: 2024 },
    { id: "e9",  title: "Bullet grazes ear, immediately sells rally merch", hint: "He pumps his fist. The photo goes around the world.", year: 2024 },
    { id: "e10", title: "Convicted on all 34 felony counts", hint: "Hush money. Manhattan. Unanimous verdict.", year: 2024 },
    { id: "e11", title: "Wins 2024 as a convicted felon. First in history.", hint: "Only second president to serve non-consecutive terms", year: 2024 },
    { id: "e12", title: "Claims Haitians are eating cats and dogs in Ohio", hint: "Said it at the presidential debate. Twice. On live TV.", year: 2024 },
    { id: "e13", title: "Picks JD Vance, who once compared him to Hitler", hint: "Vance called him 'cultural heroin'. Then became his VP.", year: 2024 },
    { id: "e14", title: "Brands Tim Walz 'Tampon Tim', the name sticks", hint: "Over a Minnesota school policy. He went with it.", year: 2024 },
    { id: "e15", title: "Says he has 'concepts of a plan' for healthcare", hint: "Said this at the presidential debate. In September 2024.", year: 2024 },
    { id: "e16", title: "Dances onstage for 45 minutes at an Arizona rally", hint: "To 'YMCA'. Every time. For the rest of the campaign.", year: 2024 },
    { id: "e17", title: "Seats TikTok CEO at the inauguration front row", hint: "TikTok thanked him. He expected gratitude.", year: 2024 },
    { id: "e18", title: "Calls himself 'the father of IVF'", hint: "Said this at a campaign event. No one agreed.", year: 2024 },
    { id: "e19", title: "Says immigrants 'poison the blood' of the country", hint: "Historians noted the phrase's origins. He didn't care.", year: 2023 },
    { id: "e20", title: "Misses son's graduation for his hush money trial", hint: "91 charges. More delegates than any Republican before him.", year: 2024 },
    { id: "e21", title: "Raises $53M the day his Georgia mugshot drops", hint: "He released the merch before the ink was dry.", year: 2023 },
    { id: "e22", title: "Claims offshore windmills are killing the whales", hint: "NOAA said there was no evidence. He kept saying it.", year: 2024 },
    { id: "e23", title: "E. Jean Carroll defamation: ordered to pay $83M", hint: "Total Carroll damages: $91 million. Still appealing.", year: 2024 },
    { id: "e24", title: "Launches $TRUMP meme coin, makes billions in days", hint: "Launched four days before his own inauguration.", year: 2025 },
    { id: "e25", title: "Still promising to replace Obamacare 'very soon'", hint: "He's been saying this since 2016. No plan has appeared.", year: 2024 },
    { id: "e26", title: "Promises to end inflation 'immediately' on day one", hint: "America was already producing record amounts of oil.", year: 2024 },
    { id: "e27", title: "Changes his abortion stance three times in a week", hint: "Pro-choice, pro-15 weeks, 'let the states decide'. In 7 days.", year: 2024 },
    { id: "e28", title: "Debates Biden, who is so bad Trump looks prepared", hint: "Biden's team called it a bad night. It ended his campaign.", year: 2024 },
    { id: "e29", title: "Claims sole credit for the COVID vaccine", hint: "10,000 scientists worked on it. He signed some papers.", year: 2024 },
    { id: "e30", title: "Keeps bringing up Hannibal Lecter at rallies", hint: "No explanation was ever given for this recurring bit.", year: 2024 },
    { id: "e31", title: "Tells Iowa crowd he'd rather be eaten by sharks", hint: "A 10-minute riff on sharks vs. boat electrocution.", year: 2024 },
    { id: "e32", title: "Claims immunity even for ordering murders", hint: "His lawyer raised this before the Supreme Court.", year: 2024 },
    { id: "e33", title: "Vows to purge 'deep state' officials on day one", hint: "A list of 50,000 federal workers was prepared.", year: 2024 },
    { id: "e34", title: "Lawyer tells SCOTUS: presidents can commit crimes", hint: "Justice Sotomayor asked if ordering a SEAL team hit was OK.", year: 2024 },
    { id: "e35", title: "Pre-emptively declares 2024 election rigged", hint: "Before any votes were cast. Just in case.", year: 2024 },
    { id: "e36", title: "Claims the guilty verdict will disappear on appeal", hint: "Polled immediately after the verdict. Still winning.", year: 2024 },
  ],

  // Era F: 2025, Second Term (2 always drawn per week)
  F: [
    { id: "f1",  title: "Convicted felon sentenced to absolutely nothing", hint: "No jail, no fine. History's most anticlimactic sentencing.", year: 2025 },
    { id: "f2",  title: "Pardons 1,500 Jan 6 rioters on day one", hint: "Including those convicted of violent offences", year: 2025 },
    { id: "f3",  title: "Tries to end birthright citizenship, courts say no", hint: "14th Amendment. Still applies.", year: 2025 },
    { id: "f4",  title: "Posts AI image of himself dressed as the pope", hint: "Uploaded to Truth Social. Vatican did not comment.", year: 2025 },
    { id: "f5",  title: "Fires six government watchdogs at 11pm on a Friday", hint: "The inspectors general. Gone by morning.", year: 2025 },
    { id: "f6",  title: "Elon's DOGE gets access to the US Treasury", hint: "Controlling the flow of $6 trillion in federal funds", year: 2025 },
    { id: "f7",  title: "Proposes turning Gaza into a 'Riviera of the ME'", hint: "At a press conference with Netanyahu. Not a joke.", year: 2025 },
    { id: "f8",  title: "Demands Canada become America's 51st state", hint: "In calls with Trudeau. Not joking.", year: 2025 },
    { id: "f9",  title: "Slaps 25% tariffs on both of America's neighbors", hint: "Ottawa and Mexico City were blindsided", year: 2025 },
    { id: "f10", title: "Berates Zelensky live in the Oval Office", hint: "'You're gambling with World War Three'", year: 2025 },
    { id: "f11", title: "SignalGate: Hegseth texts a journalist war plans", hint: "The journalist published every word of it", year: 2025 },
    { id: "f12", title: "'Liberation Day': tariffs on 180 countries at once", hint: "The chart used to calculate them made no sense.", year: 2025 },
    { id: "f13", title: "Pauses most tariffs after markets lose trillions", hint: "'It takes courage and strength to be flexible'", year: 2025 },
    { id: "f14", title: "Pays El Salvador to jail deported migrants", hint: "President Bukele was happy to oblige", year: 2025 },
    { id: "f15", title: "Fires every single top military commander at once", hint: "The entire Joint Chiefs. One afternoon.", year: 2025 },
    { id: "f16", title: "Freezes $2.2B in federal grants to Harvard", hint: "The largest funding freeze of any US university", year: 2025 },
    { id: "f17", title: "Harvard sues, refuses to comply with freeze", hint: "President Garber: 'We will not surrender'", year: 2025 },
    { id: "f18", title: "Proposes reopening Alcatraz as a federal prison", hint: "The island prison closed in 1963.", year: 2025 },
    { id: "f19", title: "Lands in Saudi Arabia, gets sword-danced at", hint: "Hundreds of billions in investment pledges followed.", year: 2025 },
    { id: "f20", title: "'Big Beautiful Bill' signed, adds $3T to the debt", hint: "Critics say it adds trillions to the national debt", year: 2025 },
    { id: "f21", title: "Musk declares war on Trump's Big Beautiful Bill", hint: "The DOGE bromance ends loudly on social media", year: 2025 },
    { id: "f22", title: "Renames Gulf of Mexico the 'Gulf of America'", hint: "Apple Maps updated it within days", year: 2025 },
    { id: "f23", title: "$MELANIA coin crashes days after launching", hint: "Launched the day before inauguration. Peak: $13. One week later: $2.", year: 2025 },
    { id: "f24", title: "Musk's odd arm gesture at inauguration goes viral", hint: "Some called it a Roman salute. Musk said it was enthusiasm.", year: 2025 },
    { id: "f25", title: "Names himself chairman of the Kennedy Center", hint: "Fired the existing board first. Then moved in.", year: 2025 },
    { id: "f26", title: "Sells US green cards to millionaires for $5M each", hint: "Pay $5M, skip the line. Green card included.", year: 2025 },
    { id: "f27", title: "Sends a delegation to Greenland to 'look around'", hint: "Both in one afternoon. No replacements named.", year: 2025 },
    { id: "f28", title: "Bans trans girls from school sports on day one", hint: "Day one. Executive order number four.", year: 2025 },
    { id: "f29", title: "Threatens to withhold fire aid from California", hint: "While the LA fires were still burning.", year: 2025 },
    { id: "f30", title: "Fires the FBI director, puts a loyalist in charge", hint: "Kash Patel. Who had a list of perceived enemies.", year: 2025 },
    { id: "f31", title: "Vows to 'take back' the Panama Canal from Panama", hint: "Panama pointed out they own it. He was unmoved.", year: 2025 },
    { id: "f32", title: "Threatens Denmark with tariffs over Greenland", hint: "Denmark said no again. He threatened again.", year: 2025 },
    { id: "f33", title: "Sends active duty troops to the US southern border", hint: "Sent active-duty troops. Called it an invasion.", year: 2025 },
    { id: "f34", title: "Designates Mexican drug cartels as terror groups", hint: "Mexico sent 10,000 troops to the border within days.", year: 2025 },
    { id: "f35", title: "Says he'll acquire Greenland 'one way or another'", hint: "Did not clarify what the other way was.", year: 2025 },
    { id: "f36", title: "Changes Denali back to Mount McKinley", hint: "Obama renamed it in 2015. He renamed it back in 2025.", year: 2025 },
    { id: "f37", title: "Claims personal credit for keeping TikTok alive", hint: "App was hours from shutting down. He gave an extension.", year: 2025 },
    { id: "f38", title: "Announces military ceasefire via Truth Social post", hint: "The Pentagon confirmed it after he posted.", year: 2025 },
    { id: "f39", title: "Deports legal US resident by mistake, refuses fix", hint: "Kilmar Abrego Garcia. Courts ordered his return. He said no.", year: 2025 },
    { id: "f40", title: "Quits the Paris climate deal. For the second time.", hint: "First time: 2017. Second time: 2025. Same pen.", year: 2025 },
    { id: "f41", title: "Pulls US out of the WHO. Also for the second time.", hint: "Second time doing this. Same executive order, new date.", year: 2025 },
    { id: "f42", title: "Orders the Department of Education to close", hint: "Signs the executive order. Congress would need to agree.", year: 2025 },
    { id: "f43", title: "Fires the Librarian of Congress, Carla Hayden", hint: "First Black woman in the role. No reason given.", year: 2025 },
    { id: "f44", title: "Bans Associated Press from White House", hint: "AP refused to call it the 'Gulf of America'.", year: 2025 },
    { id: "f45", title: "Bills taxpayers to stay at his own Mar-a-Lago", hint: "Secret Service rents golf carts at full rate.", year: 2025 },
    { id: "f46", title: "Threatens to quit NATO if allies refuse to pay up", hint: "Then paused them. Then threatened again.", year: 2025 },
    { id: "f47", title: "Threatens to fire Fed Chair for not cutting rates", hint: "Jerome Powell declined to cut rates. Trump declined to accept this.", year: 2025 },
    { id: "f48", title: "Calls newly elected Canadian PM 'Governor Carney'", hint: "He called Trudeau 'Governor Trudeau' for two years.", year: 2025 },
    { id: "f49", title: "Gives himself an A-plus for his first 100 days", hint: "Unprompted. In an interview. Very sincerely.", year: 2025 },
    { id: "f50", title: "Bans the word 'diversity' across all agencies", hint: "Day one. Executive order number two.", year: 2025 },
    { id: "f51", title: "Proposes exporting US prisoners to El Salvador", hint: "Bukele said yes immediately. ACLU said no.", year: 2025 },
    { id: "f52", title: "Invokes 1798 wartime act to deport Venezuelans", hint: "The Alien Enemies Act. Last used in World War II.", year: 2025 },
    { id: "f53", title: "Calls King Charles to brag about his election win", hint: "Framework only. Details to follow. Still following.", year: 2025 },
    { id: "f54", title: "Reopens national monuments to oil and gas drilling", hint: "To speed up 'energy dominance'. Courts intervened.", year: 2025 },
    { id: "f55", title: "Calls judges 'Trump haters' for ruling against him", hint: "Every judge. Every ruling. Every time.", year: 2025 },
    { id: "f56", title: "Sells Mar-a-Lago memberships to foreign diplomats", hint: "Donors also got a photo. And presumably a Diet Coke.", year: 2025 },
    { id: "f57", title: "Describes mass deportations as going 'beautifully'", hint: "Said this at the White House. Several times.", year: 2025 },
    { id: "f58", title: "Fires hundreds of NOAA weather forecasters", hint: "During hurricane season prep. Meteorologists were alarmed.", year: 2025 },
    { id: "f59", title: "Pardons a drug kingpin to impress Libertarians", hint: "Promised it at a Libertarian convention. Delivered on day one.", year: 2025 },
    { id: "f60", title: "DOGE fires 200,000+ federal workers in weeks", hint: "Probationary employees first. Then everyone else.", year: 2025 },
    { id: "f61", title: "Claims he has 'total authority' over every state", hint: "Schedule F. Signed, rescinded by Obama, resigned by Trump.", year: 2025 },
    { id: "f62", title: "Threatens to revoke Harvard's tax-exempt status", hint: "After Harvard won its first lawsuit against him.", year: 2025 },
    { id: "f63", title: "Holds Ukraine peace talks without inviting Ukraine", hint: "Kyiv found out from the press. They were not pleased.", year: 2025 },
    { id: "f64", title: "Proposes the US government buy and run TikTok", hint: "He offered Oracle a stake. Congress had questions.", year: 2025 },
    { id: "f65", title: "Claims credit for lowering egg prices to Congress", hint: "Eggs hit record highs the same week he said this.", year: 2025 },
    { id: "f66", title: "Egg prices hit record highs despite his promises", hint: "Bird flu and tariffs contributed. He blamed Biden.", year: 2025 },
    { id: "f67", title: "Proposes movie tariffs, Hollywood has questions", hint: "100% tariff on foreign-made films. Studios began doing math.", year: 2025 },
    { id: "f68", title: "Targets Columbia after Harvard refuses to comply", hint: "Columbia agreed to most demands. Harvard did not.", year: 2025 },
    { id: "f69", title: "Posts AI image of himself as a buff military hero", hint: "Multiple times. On Truth Social. Sincerely.", year: 2025 },
    { id: "f70", title: "Mandates schools teach his version of history", hint: "Executive order. Teachers were given updated guidelines.", year: 2025 },
    { id: "f71", title: "Lets Elon sit in on classified Cabinet meetings", hint: "Invited them all to Mar-a-Lago. They came.", year: 2025 },
    { id: "f72", title: "Pitches $175B missile shield. Canada not included.", hint: "Estimated cost: $175 billion. Canada was not included.", year: 2025 },
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
const SEASON = 2026;
const EXPANDED_ROTATION_START = "2026-08-19";
const selectSecondTermRotation = createDailyRotationSelector(DATED_SECOND_TERM_EVENTS, {
  // The expanded library did not power the live game before this date. Starting
  // its history here prevents imaginary backfilled plays from making new cards
  // look familiar on launch day.
  startDate: EXPANDED_ROTATION_START,
  season: SEASON,
});

function pickForDay(pool, eraOffset, dayNum) {
  const shuffled = seededShuffle(pool, SEASON * 1000 + eraOffset);
  return shuffled[dayNum % shuffled.length];
}

// Daily puzzles lean toward recent stories while retaining enough of the
// second-term back catalogue to keep the sequence surprising.
function pickSecondTermEvents(dateText) {
  return selectSecondTermRotation(dateText)
    .sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id))
    .map((event, index) => ({ ...event, id: index + 1 }));
}

function pickClassicSecondTermEvents(dayNum) {
  const recent = CLASSIC_SECOND_TERM_EVENTS.slice(-28);
  const selected = [];
  const dates = new Set();
  const addUniqueDates = (candidates, limit) => {
    for (const event of candidates) {
      if (selected.length >= limit) break;
      if (dates.has(event.date)) continue;
      dates.add(event.date);
      selected.push(event);
    }
  };
  addUniqueDates(seededShuffle(recent, SEASON * 777 + dayNum), 4);
  addUniqueDates(seededShuffle(CLASSIC_SECOND_TERM_EVENTS, SEASON * 997 + dayNum), 7);
  return selected
    .sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id))
    .map((event, index) => ({ ...event, id: index + 1 }));
}

function buildClassicLegacyPuzzle(dayNum) {
  const historicalPools = [POOL.A, POOL.B, POOL.C, POOL.D, POOL.E]
    .map((pool) => pool.filter((event) => event.year >= 2016));
  const historical = historicalPools.map((pool, index) => pickForDay(pool, index + 1, dayNum));
  const current = seededShuffle(CLASSIC_SECOND_TERM_EVENTS, SEASON * 1291 + dayNum)
    .slice(0, 2)
    .map((event) => ({ ...event, year: Number(event.date.slice(0, 4)) }));
  return [...historical, ...current]
    .sort((a, b) => {
      const aDate = a.date || `${a.year}-06-30`;
      const bDate = b.date || `${b.year}-06-30`;
      return aDate.localeCompare(bDate) || String(a.id).localeCompare(String(b.id));
    })
    .map((event, index) => ({ ...event, id: index + 1 }));
}

// ============================================================
// ROUTE HANDLER
// ============================================================
const EPOCH_DAY = new Date("2025-01-20T12:00:00Z"); // Inauguration day = day 0

const CORS_HEADERS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const requestedDate = searchParams.get("date");
  const dateParam = requestedDate === null
    ? new Date().toISOString().split("T")[0]
    : requestedDate;

  // Fail cleanly for malformed or impossible dates instead of allowing NaN
  // to flow into the seeded selectors and produce a server error.
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
    return NextResponse.json({ error: "Invalid date. Use YYYY-MM-DD." }, { status: 400, headers: CORS_HEADERS });
  }

  const d = new Date(dateParam + "T12:00:00Z");
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== dateParam) {
    return NextResponse.json({ error: "Invalid date. Use YYYY-MM-DD." }, { status: 400, headers: CORS_HEADERS });
  }

  const dayNum = Math.round((d - EPOCH_DAY) / (24 * 3600 * 1000));

  if (dayNum < 0) {
    return NextResponse.json({ error: "No puzzle before launch" }, { status: 404, headers: CORS_HEADERS });
  }

  // Strip em dashes automatically at serve time
  const clean = (str) => str.replace(/ \u2014 /g, ", ").replace(/\u2014/g, "-");

  let edition = SECOND_TERM_EDITION;
  let events;
  let puzzlePrefix = "d";

  // Sundays use the previous seven completed calendar days. Requiring one
  // event per day keeps the answer fair: no invisible ordering within a date.
  if (d.getUTCDay() === 0) {
    const weeklyEvents = weeklyEventsForSunday(
      d,
      DATED_SECOND_TERM_EVENTS,
      { backfillDays: dateParam >= EXPANDED_ROTATION_START ? 3 : 0 }
    );
    if (weeklyEvents.length === 7) {
      edition = WEEKLY_EDITION;
      events = weeklyEvents.map((event, index) => ({ ...event, id: index + 1 }));
      puzzlePrefix = "w";
    }
  }

  // The first Saturday of each month is the long-range 2016-present game.
  if (!events && isFirstSaturday(d)) {
    edition = LEGACY_EDITION;
    events = buildClassicLegacyPuzzle(dayNum);
    puzzlePrefix = "l";
  }

  if (!events) {
    events = dateParam < EXPANDED_ROTATION_START
      ? pickClassicSecondTermEvents(dayNum)
      : pickSecondTermEvents(dateParam);
  }

  const answerOrder = events.map(e => e.id);
  const shuffled    = seededShuffle(
    events.map(e => ({ id: e.id, title: clean(e.title), hint: clean(e.hint) })),
    dayNum * 999983 + 7
  );
  const yearMap = Object.fromEntries(events.map(e => [
    e.id,
    e.year || (e.date ? Number(e.date.slice(0, 4)) : null),
  ]));
  const dateMap = Object.fromEntries(events.map(e => [
    e.id,
    e.date || null,
  ]));

  return NextResponse.json({
    puzzle:       { id: puzzlePrefix + dayNum, dayNum, date: dateParam, events: shuffled },
    answerOrder,
    yearMap,
    dateMap,
    isWeekly:     edition.key === "weekly",
    isSecondTerm: edition.key === "second-term",
    isLegacy:     edition.key === "legacy",
    edition:      edition.key,
    editionMeta:  buildEditionMeta(edition),
  }, { headers: CORS_HEADERS });
}
