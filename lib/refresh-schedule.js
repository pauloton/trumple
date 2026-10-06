const pacificHour = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/Los_Angeles", hour: "2-digit", hourCycle: "h23",
});

export function shouldRunRefresh({ eventName, schedule, now = new Date() }) {
  if (eventName === "workflow_dispatch") return true;
  if (eventName !== "schedule" || Number.isNaN(now.getTime())) return false;

  // Use the scheduled midnight's offset, not the runner's actual start hour.
  // At DST transitions the offset at midnight differs from the afternoon's.
  // GitHub may start either trigger hours late; only the season's trigger runs.
  const utcDay = now.toISOString().slice(0, 10);
  const summerMidnight = new Date(`${utcDay}T07:00:00Z`);
  const midnightSchedule = pacificHour.format(summerMidnight) === "00"
    ? "0 7 * * *" : "0 8 * * *";
  return schedule === midnightSchedule;
}
