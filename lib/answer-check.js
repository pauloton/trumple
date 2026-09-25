// No player should have to guess an ordering within a calendar day.
export function isCorrectPosition(id, expectedId, dateMap, allowSameDay = false) {
  return id === expectedId || Boolean(
    allowSameDay && dateMap[id] && dateMap[id] === dateMap[expectedId]
  );
}
