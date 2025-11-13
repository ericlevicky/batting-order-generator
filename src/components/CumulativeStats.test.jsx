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
            { name: 'Alice', number: '5', infieldInnings: 3, outfieldInnings: 2, benchInnings: 1 },
            { name: 'Bob', number: '10', infieldInnings: 2, outfieldInnings: 3, benchInnings: 1 }
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
      totalBench: 1
    });
    expect(result[1]).toEqual({
      name: 'Bob',
      number: '10',
      totalGames: 1,
      totalInfield: 2,
      totalOutfield: 3,
      totalBench: 1
    });
  });

  it('should aggregate stats across multiple games', () => {
    const history = [
      {
        id: '1',
        date: '2024-01-01',
        lineup: {
          battingOrder: [
            { name: 'Alice', number: '5', infieldInnings: 3, outfieldInnings: 2, benchInnings: 1 },
            { name: 'Bob', number: '10', infieldInnings: 2, outfieldInnings: 3, benchInnings: 1 }
          ]
        }
      },
      {
        id: '2',
        date: '2024-01-02',
        lineup: {
          battingOrder: [
            { name: 'Alice', number: '5', infieldInnings: 4, outfieldInnings: 1, benchInnings: 1 },
            { name: 'Bob', number: '10', infieldInnings: 3, outfieldInnings: 2, benchInnings: 1 }
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
      totalBench: 2
    });
    expect(result[1]).toEqual({
      name: 'Bob',
      number: '10',
      totalGames: 2,
      totalInfield: 5,
      totalOutfield: 5,
      totalBench: 2
    });
  });

  it('should handle players with missing stats', () => {
    const history = [
      {
        id: '1',
        date: '2024-01-01',
        lineup: {
          battingOrder: [
            { name: 'Alice', number: '5', infieldInnings: 3 },
            { name: 'Bob', outfieldInnings: 2 }
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
      totalOutfield: 0,
      totalBench: 0
    });
    expect(result[1]).toEqual({
      name: 'Bob',
      number: '',
      totalGames: 1,
      totalInfield: 0,
      totalOutfield: 2,
      totalBench: 0
    });
  });

  it('should sort players alphabetically by name', () => {
    const history = [
      {
        id: '1',
        date: '2024-01-01',
        lineup: {
          battingOrder: [
            { name: 'Zoe', infieldInnings: 1 },
            { name: 'Alice', infieldInnings: 1 },
            { name: 'Mike', infieldInnings: 1 }
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
            { name: 'Alice', infieldInnings: 3 },
            { name: 'Bob', infieldInnings: 2 }
          ]
        }
      },
      {
        id: '2',
        date: '2024-01-02',
        lineup: {
          battingOrder: [
            { name: 'Alice', infieldInnings: 2 },
            { name: 'Charlie', infieldInnings: 3 }
          ]
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
      totalBench: 0
    });
    expect(result.find(p => p.name === 'Bob')).toEqual({
      name: 'Bob',
      number: '',
      totalGames: 1,
      totalInfield: 2,
      totalOutfield: 0,
      totalBench: 0
    });
    expect(result.find(p => p.name === 'Charlie')).toEqual({
      name: 'Charlie',
      number: '',
      totalGames: 1,
      totalInfield: 3,
      totalOutfield: 0,
      totalBench: 0
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
            { name: 'Alice', number: '5', infieldInnings: 3, outfieldInnings: 2, benchInnings: 1 },
            { name: 'Bob', number: '10', infieldInnings: 2, outfieldInnings: 3, benchInnings: 1 }
          ]
        }
      }
    ];

    render(<CumulativeStats history={history} />);
    
    expect(screen.getByText('Cumulative Statistics')).toBeInTheDocument();
    expect(screen.getByText(/Total innings across all 1 game/)).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('#5')).toBeInTheDocument();
    expect(screen.getByText('#10')).toBeInTheDocument();
  });

  it('should display correct game count in description', () => {
    const history = [
      {
        id: '1',
        date: '2024-01-01',
        lineup: {
          battingOrder: [
            { name: 'Alice', infieldInnings: 3 }
          ]
        }
      },
      {
        id: '2',
        date: '2024-01-02',
        lineup: {
          battingOrder: [
            { name: 'Alice', infieldInnings: 2 }
          ]
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
            { name: 'Alice', number: '5', infieldInnings: 3, outfieldInnings: 2, benchInnings: 1 }
          ]
        }
      }
    ];

    render(<CumulativeStats history={history} />);
    
    // Total Active = Infield (3) + Outfield (2) = 5
    const rows = screen.getAllByRole('row');
    // Header row + 1 data row
    expect(rows).toHaveLength(2);
    
    // Check that the table has the Total Active column header
    expect(screen.getByText('Total Active')).toBeInTheDocument();
  });
});
