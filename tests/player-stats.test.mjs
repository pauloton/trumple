import assert from "node:assert/strict";
import test from "node:test";

import { calculateCurrentStreak, dailyResultForDate, recordDailyResult, editionTimeStats, editionLabel } from "../lib/player-stats.js";

test("times are separated by edition and actual card count", () => {
  const results=[
    {date:"2026-09-01",won:true,edition:"second-term",eventCount:5,timeMs:20000},
    {date:"2026-09-02",won:true,edition:"second-term",eventCount:7,timeMs:5000},
    {date:"2026-09-03",won:true,edition:"second-term",timeMs:1000},
    {date:"2026-09-04",won:true,timeMs:500},
    {date:"2026-09-05",won:true,edition:"legacy",eventCount:5,timeMs:10000},
    {date:"2026-09-06",won:true,edition:"weekly",eventCount:7,timeMs:30000},
    {date:"2026-09-07",won:false,edition:"second-term",eventCount:5,timeMs:100},
  ];
  const daily=editionTimeStats(results,"second-term",5);
  assert.equal(daily.best,20000);
  assert.equal(daily.history.length,1);
  assert.equal(daily.earlier.length,3);
  assert.equal(editionTimeStats(results,"legacy",5).best,10000);
  assert.equal(editionTimeStats(results,"weekly",7).best,30000);
  assert.equal(editionTimeStats(results,"second-term",undefined).best,null);
  assert.equal(results[2].eventCount,undefined,"No invented migration metadata");
});

test("last five wins are edition-specific, newest first, with all-time best retained", () => {
  const results=Array.from({length:9},(_,i)=>({date:`2026-09-${String(i+1).padStart(2,"0")}`,won:true,edition:i===8 ? "weekly" : "second-term",eventCount:i===8 ? 7 : 5,timeMs:(i+1)*1000,hintUsed:i===7}));
  const stats=editionTimeStats(results,"second-term",5);
  assert.equal(stats.best,1000);
  assert.deepEqual(stats.history.map(result=>result.date),["2026-09-08","2026-09-07","2026-09-06","2026-09-05","2026-09-04"]);
  assert.equal(stats.history[0].hintUsed,true);
});

test("edition counts survive saving and global streak still spans editions", () => {
  let results=[];
  for(const [date,edition,eventCount] of [["2026-09-05","legacy",5],["2026-09-06","weekly",7],["2026-09-07","second-term",5]]) results=recordDailyResult(results,date,true,{edition,eventCount,timeMs:20000,stars:3});
  assert.equal(calculateCurrentStreak(results,"2026-09-07"),3);
  assert.equal(dailyResultForDate(results,"2026-09-06").eventCount,7);
  assert.equal(editionLabel("weekly",7),"Sunday · 7 events");
  assert.equal(editionLabel("second-term",undefined),"Daily · format unrecorded");
});

test("edition bests do not disappear after 400 days", () => {
  let results=[];
  for(let i=0;i<405;i++) results=recordDailyResult(results,new Date(Date.UTC(2025,0,1+i)).toISOString().slice(0,10),true,{edition:"second-term",eventCount:5,timeMs:1000+i});
  assert.equal(results.length,405);
  assert.equal(editionTimeStats(results,"second-term",5).best,1000);
});

test("streak counts consecutive winning puzzle dates", () => {
  const results = [
    { date: "2026-08-16", won: true },
    { date: "2026-08-17", won: true },
    { date: "2026-08-18", won: true },
  ];
  assert.equal(calculateCurrentStreak(results), 3);
});

test("a missed date starts the next streak over", () => {
  const results = [
    { date: "2026-08-15", won: true },
    { date: "2026-08-17", won: true },
  ];
  assert.equal(calculateCurrentStreak(results), 1);
});

test("a loss resets the current streak", () => {
  const results = [
    { date: "2026-08-17", won: true },
    { date: "2026-08-18", won: false },
  ];
  assert.equal(calculateCurrentStreak(results), 0);
});

test("replaying one date cannot inflate a streak", () => {
  let results = recordDailyResult([], "2026-08-17", true);
  results = recordDailyResult(results, "2026-08-17", true);
  results = recordDailyResult(results, "2026-08-18", true);

  assert.equal(results.length, 2);
  assert.equal(calculateCurrentStreak(results), 2);
});

test("a later win on the same date preserves that date as won", () => {
  let results = recordDailyResult([], "2026-08-17", false);
  results = recordDailyResult(results, "2026-08-17", true);

  assert.deepEqual(results, [{ date: "2026-08-17", won: true }]);
  assert.equal(calculateCurrentStreak(results), 1);
});

test("invalid calendar dates are ignored", () => {
  const results = recordDailyResult([], "2026-02-30", true);
  assert.deepEqual(results, []);
  assert.equal(calculateCurrentStreak(results), 0);
});

test("a streak expires after a missed day", () => {
  const results = [
    { date: "2026-08-15", won: true },
    { date: "2026-08-16", won: true },
  ];
  assert.equal(calculateCurrentStreak(results, "2026-08-18"), 0);
  assert.equal(calculateCurrentStreak(results, "2026-08-17"), 2);
});

test("daily results remember the score needed to restore the result screen", () => {
  const results = recordDailyResult([], "2026-08-18", true, {
    timeMs: 15080,
    stars: 2,
    edition: "second-term",
  });

  assert.deepEqual(dailyResultForDate(results, "2026-08-18"), {
    date: "2026-08-18",
    won: true,
    timeMs: 15080,
    stars: 2,
    edition: "second-term",
  });
});
