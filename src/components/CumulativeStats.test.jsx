import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import CumulativeStats, { calculateCumulativeStats } from './CumulativeStats';

describe('calculateCumulativeStats', () => {
  it('should return empty array for empty history', () => {
    const result = calculateCumulativeStats([]);
    expect(result).toEqual([]);
  });

  it('should return empty array for history without lineups', () => {
    const history = [
      { id: '1', date: '2024-01-01' },
      { id: '2', date: '2024-01-02' }
    ];
    const result = calculateCumulativeStats(history);
    expect(result).toEqual([]);
  });

  it('should calculate cumulative stats for a single game', () => {
    const history = [
      {
        id: '1',
        date: '2024-01-01',
        lineup: {
          battingOrder: [
            { name: 'Alice', number: '5', battingOrder: 1, infieldInnings: 3, outfieldInnings: 2, benchInnings: 1 },
            { name: 'Bob', number: '10', battingOrder: 2, infieldInnings: 2, outfieldInnings: 3, benchInnings: 1 }
          ],
          innings: [
            { 'Pitcher': { name: 'Alice' }, 'Catcher': { name: 'Bob' } }
          ]
        }
      }
    ];

    const result = calculateCumulativeStats(history);
    
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      name: 'Alice',
      number: '5',
      totalGames: 1,
      totalInfield: 3,
      totalOutfield: 2,
      totalBench: 1,
      battingPositions: { 1: 1 },
      fieldingPositions: { 'Pitcher': 1 },
      avgBattingPosition: '1.0'
    });
    expect(result[1]).toEqual({
      name: 'Bob',
      number: '10',
      totalGames: 1,
      totalInfield: 2,
      totalOutfield: 3,
      totalBench: 1,
      battingPositions: { 2: 1 },
      fieldingPositions: { 'Catcher': 1 },
      avgBattingPosition: '2.0'
    });
  });

  it('should aggregate stats across multiple games', () => {
    const history = [
      {
        id: '1',
        date: '2024-01-01',
        lineup: {
          battingOrder: [
            { name: 'Alice', number: '5', battingOrder: 1, infieldInnings: 3, outfieldInnings: 2, benchInnings: 1 },
            { name: 'Bob', number: '10', battingOrder: 2, infieldInnings: 2, outfieldInnings: 3, benchInnings: 1 }
          ],
          innings: [
            { 'Pitcher': { name: 'Alice' }, '1st Base': { name: 'Bob' } }
          ]
        }
      },
      {
        id: '2',
        date: '2024-01-02',
        lineup: {
          battingOrder: [
            { name: 'Alice', number: '5', battingOrder: 3, infieldInnings: 4, outfieldInnings: 1, benchInnings: 1 },
            { name: 'Bob', number: '10', battingOrder: 4, infieldInnings: 3, outfieldInnings: 2, benchInnings: 1 }
          ],
          innings: [
            { 'Catcher': { name: 'Alice' }, '2nd Base': { name: 'Bob' } }
          ]
        }
      }
    ];

    const result = calculateCumulativeStats(history);
    
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      name: 'Alice',
      number: '5',
      totalGames: 2,
      totalInfield: 7,
      totalOutfield: 3,
      totalBench: 2,
      battingPositions: { 1: 1, 3: 1 },
      fieldingPositions: { 'Pitcher': 1, 'Catcher': 1 },
      avgBattingPosition: '2.0'
    });
    expect(result[1]).toEqual({
      name: 'Bob',
      number: '10',
      totalGames: 2,
      totalInfield: 5,
      totalOutfield: 5,
      totalBench: 2,
      battingPositions: { 2: 1, 4: 1 },
      fieldingPositions: { '1st Base': 1, '2nd Base': 1 },
      avgBattingPosition: '3.0'
    });
  });

  it('should handle players with missing stats', () => {
    const history = [
      {
        id: '1',
        date: '2024-01-01',
        lineup: {
          battingOrder: [
            { name: 'Alice', number: '5', battingOrder: 1, infieldInnings: 3 },
            { name: 'Bob', battingOrder: 2, outfieldInnings: 2 }
          ],
          innings: []
        }
      }
    ];

    const result = calculateCumulativeStats(history);
    
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      name: 'Alice',
      number: '5',
      totalGames: 1,
      totalInfield: 3,
      totalOutfield: 0,
      totalBench: 0,
      battingPositions: { 1: 1 },
      fieldingPositions: {},
      avgBattingPosition: '1.0'
    });
    expect(result[1]).toEqual({
      name: 'Bob',
      number: '',
      totalGames: 1,
      totalInfield: 0,
      totalOutfield: 2,
      totalBench: 0,
      battingPositions: { 2: 1 },
      fieldingPositions: {},
      avgBattingPosition: '2.0'
    });
  });

  it('should sort players alphabetically by name', () => {
    const history = [
      {
        id: '1',
        date: '2024-01-01',
        lineup: {
          battingOrder: [
            { name: 'Zoe', battingOrder: 1, infieldInnings: 1 },
            { name: 'Alice', battingOrder: 2, infieldInnings: 1 },
            { name: 'Mike', battingOrder: 3, infieldInnings: 1 }
          ]
        }
      }
    ];

    const result = calculateCumulativeStats(history);
    
    expect(result.map(p => p.name)).toEqual(['Alice', 'Mike', 'Zoe']);
  });

  it('should track different players across games correctly', () => {
    const history = [
      {
        id: '1',
        date: '2024-01-01',
        lineup: {
          battingOrder: [
            { name: 'Alice', battingOrder: 1, infieldInnings: 3 },
            { name: 'Bob', battingOrder: 2, infieldInnings: 2 }
          ],
          innings: []
        }
      },
      {
        id: '2',
        date: '2024-01-02',
        lineup: {
          battingOrder: [
            { name: 'Alice', battingOrder: 3, infieldInnings: 2 },
            { name: 'Charlie', battingOrder: 1, infieldInnings: 3 }
          ],
          innings: []
        }
      }
    ];

    const result = calculateCumulativeStats(history);
    
    expect(result).toHaveLength(3);
    expect(result.find(p => p.name === 'Alice')).toEqual({
      name: 'Alice',
      number: '',
      totalGames: 2,
      totalInfield: 5,
      totalOutfield: 0,
      totalBench: 0,
      battingPositions: { 1: 1, 3: 1 },
      fieldingPositions: {},
      avgBattingPosition: '2.0'
    });
    expect(result.find(p => p.name === 'Bob')).toEqual({
      name: 'Bob',
      number: '',
      totalGames: 1,
      totalInfield: 2,
      totalOutfield: 0,
      totalBench: 0,
      battingPositions: { 2: 1 },
      fieldingPositions: {},
      avgBattingPosition: '2.0'
    });
    expect(result.find(p => p.name === 'Charlie')).toEqual({
      name: 'Charlie',
      number: '',
      totalGames: 1,
      totalInfield: 3,
      totalOutfield: 0,
      totalBench: 0,
      battingPositions: { 1: 1 },
      fieldingPositions: {},
      avgBattingPosition: '1.0'
    });
  });

  it('should calculate average batting position correctly', () => {
    const history = [
      {
        id: '1',
        date: '2024-01-01',
        lineup: {
          battingOrder: [
            { name: 'Alice', battingOrder: 1, infieldInnings: 3 }
          ],
          innings: []
        }
      },
      {
        id: '2',
        date: '2024-01-02',
        lineup: {
          battingOrder: [
            { name: 'Alice', battingOrder: 5, infieldInnings: 3 }
          ],
          innings: []
        }
      },
      {
        id: '3',
        date: '2024-01-03',
        lineup: {
          battingOrder: [
            { name: 'Alice', battingOrder: 3, infieldInnings: 3 }
          ],
          innings: []
        }
      }
    ];

    const result = calculateCumulativeStats(history);
    
    expect(result).toHaveLength(1);
    expect(result[0].avgBattingPosition).toBe('3.0'); // (1 + 5 + 3) / 3 = 3.0
    expect(result[0].battingPositions).toEqual({ 1: 1, 3: 1, 5: 1 });
  });

  it('should count repeated batting positions correctly', () => {
    const history = [
      {
        id: '1',
        date: '2024-01-01',
        lineup: {
          battingOrder: [
            { name: 'Alice', battingOrder: 2, infieldInnings: 3 }
          ],
          innings: []
        }
      },
      {
        id: '2',
        date: '2024-01-02',
        lineup: {
          battingOrder: [
            { name: 'Alice', battingOrder: 2, infieldInnings: 3 }
          ],
          innings: []
        }
      },
      {
        id: '3',
        date: '2024-01-03',
        lineup: {
          battingOrder: [
            { name: 'Alice', battingOrder: 4, infieldInnings: 3 }
          ],
          innings: []
        }
      }
    ];

    const result = calculateCumulativeStats(history);
    
    expect(result).toHaveLength(1);
    expect(result[0].avgBattingPosition).toBe('2.7'); // (2 + 2 + 4) / 3 = 2.666... ≈ 2.7
    expect(result[0].battingPositions).toEqual({ 2: 2, 4: 1 });
  });

  it('should handle players without batting order position', () => {
    const history = [
      {
        id: '1',
        date: '2024-01-01',
        lineup: {
          battingOrder: [
            { name: 'Alice', infieldInnings: 3 }
          ],
          innings: []
        }
      }
    ];

    const result = calculateCumulativeStats(history);
    
    expect(result).toHaveLength(1);
    expect(result[0].avgBattingPosition).toBe('-');
    expect(result[0].battingPositions).toEqual({});
  });

  it('should track fielding positions correctly', () => {
    const history = [
      {
        id: '1',
        date: '2024-01-01',
        lineup: {
          battingOrder: [
            { name: 'Alice', battingOrder: 1, infieldInnings: 3 },
            { name: 'Bob', battingOrder: 2, outfieldInnings: 2 }
          ],
          innings: [
            { 'Pitcher': { name: 'Alice' }, 'Left Field': { name: 'Bob' } },
            { 'Catcher': { name: 'Alice' }, 'Center Field': { name: 'Bob' } },
            { '1st Base': { name: 'Alice' }, 'Right Field': { name: 'Bob' } }
          ]
        }
      }
    ];

    const result = calculateCumulativeStats(history);
    
    expect(result).toHaveLength(2);
    expect(result[0].fieldingPositions).toEqual({
      'Pitcher': 1,
      'Catcher': 1,
      '1st Base': 1
    });
    expect(result[1].fieldingPositions).toEqual({
      'Left Field': 1,
      'Center Field': 1,
      'Right Field': 1
    });
  });

  it('should track bench innings correctly', () => {
    const history = [
      {
        id: '1',
        date: '2024-01-01',
        lineup: {
          battingOrder: [
            { name: 'Alice', battingOrder: 1, infieldInnings: 2, benchInnings: 1 },
            { name: 'Bob', battingOrder: 2, infieldInnings: 3 }
          ],
          innings: [
            { 'Pitcher': { name: 'Bob' }, 'Bench': [{ name: 'Alice' }] },
            { 'Catcher': { name: 'Alice' } },
            { '1st Base': { name: 'Alice' } }
          ]
        }
      }
    ];

    const result = calculateCumulativeStats(history);
    
    expect(result).toHaveLength(2);
    expect(result[0].fieldingPositions).toEqual({
      'Bench': 1,
      'Catcher': 1,
      '1st Base': 1
    });
    expect(result[1].fieldingPositions).toEqual({
      'Pitcher': 1
    });
  });
});

describe('CumulativeStats component', () => {
  it('should render null when history is empty', () => {
    const { container } = render(<CumulativeStats history={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('should render null when history is null', () => {
    const { container } = render(<CumulativeStats history={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('should render table with cumulative stats', () => {
    const history = [
      {
        id: '1',
        date: '2024-01-01',
        lineup: {
          battingOrder: [
            { name: 'Alice', number: '5', battingOrder: 1, infieldInnings: 3, outfieldInnings: 2, benchInnings: 1 },
            { name: 'Bob', number: '10', battingOrder: 2, infieldInnings: 2, outfieldInnings: 3, benchInnings: 1 }
          ],
          innings: []
        }
      }
    ];

    render(<CumulativeStats history={history} />);
    
    expect(screen.getByText('Cumulative Statistics')).toBeInTheDocument();
    expect(screen.getByText(/Total innings across all 1 game/)).toBeInTheDocument();
    expect(screen.getAllByText('Alice')).toHaveLength(2); // Appears in both tables
    expect(screen.getAllByText('Bob')).toHaveLength(2); // Appears in both tables
    expect(screen.getByText('#5')).toBeInTheDocument();
    expect(screen.getByText('#10')).toBeInTheDocument();
    expect(screen.getByText('Fielding Position Breakdown')).toBeInTheDocument();
  });

  it('should display correct game count in description', () => {
    const history = [
      {
        id: '1',
        date: '2024-01-01',
        lineup: {
          battingOrder: [
            { name: 'Alice', battingOrder: 1, infieldInnings: 3 }
          ],
          innings: []
        }
      },
      {
        id: '2',
        date: '2024-01-02',
        lineup: {
          battingOrder: [
            { name: 'Alice', battingOrder: 2, infieldInnings: 2 }
          ],
          innings: []
        }
      }
    ];

    render(<CumulativeStats history={history} />);
    
    expect(screen.getByText(/Total innings across all 2 games/)).toBeInTheDocument();
  });

  it('should display total active column correctly', () => {
    const history = [
      {
        id: '1',
        date: '2024-01-01',
        lineup: {
          battingOrder: [
            { name: 'Alice', number: '5', battingOrder: 1, infieldInnings: 3, outfieldInnings: 2, benchInnings: 1 }
          ],
          innings: []
        }
      }
    ];

    render(<CumulativeStats history={history} />);
    
    // Total Active = Infield (3) + Outfield (2) = 5
    const rows = screen.getAllByRole('row');
    // Now we have 2 tables: main stats table (header + 1 data) + fielding position breakdown table (header + 1 data) = 4 rows
    expect(rows).toHaveLength(4);
    
    // Check that the table has the correct column headers
    expect(screen.getByText('Total Active')).toBeInTheDocument();
    expect(screen.getByText('Avg Position')).toBeInTheDocument();
    expect(screen.queryByText('Unique Positions')).not.toBeInTheDocument();
  });
});
