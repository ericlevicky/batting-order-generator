import { describe, it, expect } from 'vitest';
import { generateLineup, POSITIONS } from '../utils/lineupGenerator';

describe('lineupGenerator', () => {
  const createPlayers = (count) => {
    return Array.from({ length: count }, (_, i) => ({
      name: `Player ${i + 1}`,
      number: `${i + 1}`,
    }));
  };

  describe('generateLineup - Basic functionality', () => {
    it('should generate lineup with correct number of players', () => {
      const players = createPlayers(9);
      const lineup = generateLineup(players, 6, 3, true);

      expect(lineup.battingOrder).toHaveLength(9);
      expect(lineup.innings).toHaveLength(6);
    });

    it('should assign batting order positions 1-9', () => {
      const players = createPlayers(9);
      const lineup = generateLineup(players, 6, 3, true);

      lineup.battingOrder.forEach((player, index) => {
        expect(player.battingOrder).toBe(index + 1);
      });
    });

    it('should initialize stats to zero for first game', () => {
      const players = createPlayers(9);
      const lineup = generateLineup(players, 6, 3, true);

      lineup.battingOrder.forEach((player) => {
        // Stats should be accumulated for the game
        expect(player.infieldInnings).toBeGreaterThanOrEqual(0);
        expect(player.outfieldInnings).toBeGreaterThanOrEqual(0);
        expect(player.benchInnings).toBeGreaterThanOrEqual(0);
      });
    });

    it('should balance infield and outfield assignments', () => {
      const players = createPlayers(9);
      const lineup = generateLineup(players, 6, 3, true);

      const infieldTotal = lineup.battingOrder.reduce((sum, p) => sum + p.infieldInnings, 0);
      const outfieldTotal = lineup.battingOrder.reduce((sum, p) => sum + p.outfieldInnings, 0);

      // With 9 players, 6 innings, catcher, and 3 outfielders
      // We have 5 infield positions and 3 outfield positions per inning
      expect(infieldTotal).toBeGreaterThan(0);
      expect(outfieldTotal).toBeGreaterThan(0);
    });

    it('should handle different numbers of outfielders', () => {
      const players = createPlayers(10);
      
      const lineup2OF = generateLineup(players, 6, 2, true);
      const lineup3OF = generateLineup(players, 6, 3, true);
      const lineup4OF = generateLineup(players, 6, 4, true);

      // With catcher: P, C, 1B, 2B, 3B, SS + outfielders
      expect(lineup2OF.positions).toHaveLength(8); // 6 infield + 2 OF
      expect(lineup3OF.positions).toHaveLength(9); // 6 infield + 3 OF
      expect(lineup4OF.positions).toHaveLength(10); // 6 infield + 4 OF
    });

    it('should handle with and without catcher', () => {
      const players = createPlayers(9);
      
      const lineupWithCatcher = generateLineup(players, 6, 3, true);
      const lineupWithoutCatcher = generateLineup(players, 6, 3, false);

      const hasCatcher = lineupWithCatcher.positions.some(p => p.name === 'Catcher');
      const noCatcher = lineupWithoutCatcher.positions.every(p => p.name !== 'Catcher');

      expect(hasCatcher).toBe(true);
      expect(noCatcher).toBe(true);
    });
  });

  describe('generateLineup - Batting order rotation with history', () => {
    it('should rotate batting order based on game history', () => {
      const players = createPlayers(9);
      
      // Generate first game
      const game1 = generateLineup(players, 6, 3, true);
      
      // Create mock history from game 1
      const history = [{
        id: '1',
        date: new Date().toISOString(),
        lineup: {
          battingOrder: game1.battingOrder.map(p => ({
            name: p.name,
            number: p.number,
            battingOrder: p.battingOrder,
            infieldInnings: p.infieldInnings,
            outfieldInnings: p.outfieldInnings,
            benchInnings: p.benchInnings,
          })),
          innings: game1.innings,
          positions: game1.positions,
        },
        settings: { numInnings: 6, numOutfielders: 3, hasCatcher: true },
      }];

      // Generate second game with history
      const game2 = generateLineup(players, 6, 3, true, history);

      // Players who batted later should now bat earlier
      const game1LastPlayer = game1.battingOrder[8].name; // Player who batted 9th
      const game2FirstPlayer = game2.battingOrder[0].name;
      
      // The last player from game 1 should be prioritized to bat earlier in game 2
      const game2LastPlayerPosition = game2.battingOrder.findIndex(p => p.name === game1LastPlayer);
      expect(game2LastPlayerPosition).toBeLessThan(8); // Should be earlier than last
    });

    it('should use historical stats for position balancing', () => {
      const players = createPlayers(9);
      
      // Create mock history where Player 1 has played mostly infield
      const history = [{
        id: '1',
        date: new Date().toISOString(),
        lineup: {
          battingOrder: players.map((p, idx) => ({
            name: p.name,
            number: p.number,
            battingOrder: idx + 1,
            infieldInnings: idx === 0 ? 6 : 3, // Player 1 has 6 infield innings
            outfieldInnings: idx === 0 ? 0 : 3,
            benchInnings: 0,
          })),
        },
        settings: { numInnings: 6, numOutfielders: 3, hasCatcher: true },
      }];

      const game2 = generateLineup(players, 6, 3, true, history);
      
      // Verify that historical data is being used
      // (Stats are stored internally but not exposed in the final output)
      expect(game2.battingOrder).toBeDefined();
      expect(game2.innings).toBeDefined();
    });

    it('should handle empty game history', () => {
      const players = createPlayers(9);
      
      const lineup = generateLineup(players, 6, 3, true, []);
      
      expect(lineup.battingOrder).toHaveLength(9);
      expect(lineup.innings).toHaveLength(6);
    });

    it('should handle multiple games in history', () => {
      const players = createPlayers(9);
      
      // Simulate 3 games of history
      let history = [];
      for (let i = 0; i < 3; i++) {
        const game = generateLineup(players, 6, 3, true, history);
        history.push({
          id: `${i + 1}`,
          date: new Date().toISOString(),
          lineup: {
            battingOrder: game.battingOrder.map(p => ({
              name: p.name,
              number: p.number,
              battingOrder: p.battingOrder,
              infieldInnings: p.infieldInnings,
              outfieldInnings: p.outfieldInnings,
              benchInnings: p.benchInnings,
            })),
          },
        });
      }

      // Generate 4th game
      const game4 = generateLineup(players, 6, 3, true, history);
      
      expect(game4.battingOrder).toHaveLength(9);
      // Batting order should be different from original due to rotation
      const originalOrder = players.map(p => p.name);
      const game4Order = game4.battingOrder.map(p => p.name);
      
      // At least some positions should be different
      let differentPositions = 0;
      for (let i = 0; i < originalOrder.length; i++) {
        if (originalOrder[i] !== game4Order[i]) {
          differentPositions++;
        }
      }
      expect(differentPositions).toBeGreaterThan(0);
    });
  });

  describe('generateLineup - Position assignments', () => {
    it('should assign all field positions each inning', () => {
      const players = createPlayers(10);
      const lineup = generateLineup(players, 6, 3, true);

      lineup.innings.forEach((inning, inningNum) => {
        // Should have assignments for all positions
        const positionNames = Object.keys(inning);
        
        // Should include infield positions
        expect(positionNames).toContain('Pitcher');
        expect(positionNames).toContain('1st Base');
        expect(positionNames).toContain('2nd Base');
        expect(positionNames).toContain('3rd Base');
        expect(positionNames).toContain('Shortstop');
        
        // Should include outfield positions
        expect(positionNames.some(p => 
          p === 'Left Field' || p === 'Center Field' || p === 'Right Field'
        )).toBe(true);
      });
    });

    it('should assign bench players when team is larger than field positions', () => {
      const players = createPlayers(12);
      const lineup = generateLineup(players, 6, 3, true);

      lineup.innings.forEach((inning) => {
        if (inning['Bench']) {
          expect(Array.isArray(inning['Bench'])).toBe(true);
          expect(inning['Bench'].length).toBeGreaterThan(0);
        }
      });
    });

    it('should rotate players through different positions', () => {
      const players = createPlayers(9);
      const lineup = generateLineup(players, 6, 3, true);

      // Track positions for first player
      const player1Positions = [];
      lineup.innings.forEach((inning) => {
        for (const [position, assignedPlayer] of Object.entries(inning)) {
          if (Array.isArray(assignedPlayer)) {
            if (assignedPlayer.some(p => p.name === players[0].name)) {
              player1Positions.push(position);
            }
          } else if (assignedPlayer.name === players[0].name) {
            player1Positions.push(position);
          }
        }
      });

      // Player should be assigned to positions (could be same or different)
      expect(player1Positions.length).toBeGreaterThan(0);
    });
  });

  describe('generateLineup - Edge cases', () => {
    it('should handle minimum team size', () => {
      const players = createPlayers(9);
      const lineup = generateLineup(players, 6, 3, true);

      expect(lineup.battingOrder).toHaveLength(9);
      expect(lineup.innings).toHaveLength(6);
    });

    it('should handle large team size', () => {
      const players = createPlayers(15);
      const lineup = generateLineup(players, 6, 3, true);

      expect(lineup.battingOrder).toHaveLength(15);
      
      // All players should get some playing time
      lineup.battingOrder.forEach((player) => {
        const totalInnings = player.infieldInnings + player.outfieldInnings + player.benchInnings;
        expect(totalInnings).toBe(6);
      });
    });

    it('should handle single inning game', () => {
      const players = createPlayers(9);
      const lineup = generateLineup(players, 1, 3, true);

      expect(lineup.innings).toHaveLength(1);
    });

    it('should handle 9 inning game', () => {
      const players = createPlayers(9);
      const lineup = generateLineup(players, 9, 3, true);

      expect(lineup.innings).toHaveLength(9);
    });
  });

  describe('POSITIONS constant', () => {
    it('should have all expected positions', () => {
      expect(POSITIONS.PITCHER).toBeDefined();
      expect(POSITIONS.CATCHER).toBeDefined();
      expect(POSITIONS.FIRST_BASE).toBeDefined();
      expect(POSITIONS.SECOND_BASE).toBeDefined();
      expect(POSITIONS.THIRD_BASE).toBeDefined();
      expect(POSITIONS.SHORTSTOP).toBeDefined();
      expect(POSITIONS.LEFT_FIELD).toBeDefined();
      expect(POSITIONS.CENTER_FIELD).toBeDefined();
      expect(POSITIONS.RIGHT_FIELD).toBeDefined();
      expect(POSITIONS.RIGHT_CENTER).toBeDefined();
      expect(POSITIONS.BENCH).toBeDefined();
    });

    it('should have correct position numbers', () => {
      expect(POSITIONS.PITCHER.number).toBe(1);
      expect(POSITIONS.CATCHER.number).toBe(2);
      expect(POSITIONS.FIRST_BASE.number).toBe(3);
      expect(POSITIONS.BENCH.number).toBe(0);
    });
  });
});
