import { generateLineup } from './src/utils/lineupGenerator.js';

// Test 1: Generate with insufficient active players
console.log("Test 1: Insufficient active players");
const players = Array.from({ length: 9 }, (_, i) => ({
  id: i,
  name: `Player ${i + 1}`,
  number: String(i + 1),
  active: i < 7  // Only 7 active, 2 inactive
}));

const activeCount = players.filter(p => p.active !== false).length;
console.log(`Active players: ${activeCount}, Total: ${players.length}`);
console.log(`App.jsx validation (total): ${players.length} < 9 = ${players.length < 9}`);

try {
  // With 3 outfielders and catcher, need 6 infield + 3 outfield = 9 positions
  // But only 7 active players
  const lineup = generateLineup(players, 6, 3, true);
  console.log("Lineup generated successfully");
  console.log(`Batting order size: ${lineup.battingOrder.length}`);
  
  // Check if any inning has null assignments
  let nullCount = 0;
  lineup.innings.forEach((inning, idx) => {
    Object.entries(inning).forEach(([pos, assignment]) => {
      if (assignment === null) {
        console.log(`Inning ${idx + 1}, Position ${pos}: NULL`);
        nullCount++;
      } else if (Array.isArray(assignment) && assignment.some(p => p === null)) {
        console.log(`Inning ${idx + 1}, Position ${pos}: Contains null in array`);
        nullCount++;
      }
    });
  });
  
  console.log(`Total null/missing assignments: ${nullCount}`);
  
} catch (e) {
  console.log(`Error: ${e.message}`);
}

// Test 2: Verify position count
console.log("\nTest 2: Position calculations");
console.log("With catcher=true, 3 outfielders:");
console.log("  Infield: P, C, 1B, 2B, 3B, SS = 6");
console.log("  Outfield: LF, CF, RF = 3");
console.log("  Total: 9 positions needed");
console.log("  But only 7 active players available");
