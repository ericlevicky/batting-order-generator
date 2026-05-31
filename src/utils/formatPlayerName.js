/**
 * Format a player's display name, prefixing with their jersey number
 * if the number was manually entered (not auto-assigned).
 * @param {Object} player - Player object with name, number, and isAutoNumbered properties
 * @returns {string} Formatted name, e.g. "(#11) Joe Levicky" or "Joe Levicky"
 */
export function formatPlayerName(player) {
  if (!player) return '';
  if (!player.isAutoNumbered && player.number) {
    return `(#${player.number}) ${player.name}`;
  }
  return player.name;
}
