import { page } from '@vitest/browser/context';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import LobbyView from './LobbyView.svelte';

describe('LobbyView', () => {
  it('renders code, players, and settings', async () => {
    render(LobbyView, {
      code: 'ABC123',
      name: 'Alice',
      isHost: true,
      setup: { playerCount: 2, landsPerPlayer: 3, personalPiecesPerPlayer: 3, communityPiecesPerPlayer: 3 },
      players: [
        { id: '1', name: 'Alice', host: true },
        { id: '2', name: 'Bob' }
      ],
      onStart: () => {}
    });

    await expect.element(page.getByRole('heading', { name: 'Lobby' })).toBeInTheDocument();
    await expect.element(page.getByText('ABC123')).toBeInTheDocument();
    await expect.element(page.getByText('Alice')).toBeInTheDocument();
    await expect.element(page.getByText('Bob')).toBeInTheDocument();
  });

  it('calls onStart when Start game is clicked (host only)', async () => {
    const onStart = vi.fn();
    render(LobbyView, {
      code: 'ABC123',
      name: 'Alice',
      isHost: true,
      setup: { playerCount: 2, landsPerPlayer: 3, personalPiecesPerPlayer: 3, communityPiecesPerPlayer: 3 },
      players: [ { id: '1', name: 'Alice', host: true } ],
      onStart
    });

    const btn = page.getByRole('button', { name: 'Start game' });
    await btn.click();
    expect(onStart).toHaveBeenCalled();
  });
});
