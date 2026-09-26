// No player should have to guess an ordering within a calendar day.
export function isCorrectPosition(id, expectedId, dateMap, allowSameDay = false) {
  return id === expectedId || Boolean(
    allowSameDay && dateMap[id] && dateMap[id] === dateMap[expectedId]
  );
}

// One optional hint per round, chosen from the current order. Tied Sunday
// dates target the nearest acceptable slot, not an arbitrary within-day order.
export function directionHint(events, answerOrder, dateMap, allowSameDay = false) {
  for (let index = 0; index < events.length; index++) {
    const event = events[index];
    if (isCorrectPosition(event.id, answerOrder[index], dateMap, allowSameDay)) continue;
    const positions = answerOrder.flatMap((id, position) =>
      isCorrectPosition(event.id, id, dateMap, allowSameDay) ? [position] : []);
    if (!positions.length) continue;
    const target = positions.reduce((best, position) => Math.abs(position - index) < Math.abs(best - index) ? position : best);
    return { id: event.id, title: event.title, direction: target < index ? "earlier" : "later" };
  }
  return null;
}
