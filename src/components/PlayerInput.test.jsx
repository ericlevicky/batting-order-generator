import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import PlayerInput from './PlayerInput';

describe('PlayerInput', () => {
  it('shows the example team button when there are no players', () => {
    render(<PlayerInput players={[]} setPlayers={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Load Example Team' })).toBeInTheDocument();
  });

  it('hides the example team button when the team already has players', () => {
    render(
      <PlayerInput
        players={[{ id: 1, name: 'Alice', number: '7', active: true }]}
        setPlayers={vi.fn()}
      />
    );

    expect(screen.queryByRole('button', { name: 'Load Example Team' })).not.toBeInTheDocument();
  });
});
