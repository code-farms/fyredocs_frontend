import { describe, expect, it } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HelmetProvider } from 'react-helmet-async';
import FlashcardsPage, { type FlashcardsState } from '../FlashcardsPage';

const renderWith = (state?: FlashcardsState) =>
  render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[{ pathname: '/ai/flashcards', state }]}>
        <Routes>
          <Route path="/ai/flashcards" element={<FlashcardsPage />} />
        </Routes>
      </MemoryRouter>
    </HelmetProvider>
  );

describe('FlashcardsPage', () => {
  it('explains when there is no deck (e.g. after a reload)', () => {
    renderWith();
    expect(screen.getByText('No flashcards to review')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open the reader' })).toHaveAttribute('href', '/reader');
  });

  it('flips cards and re-reviews the "again" pile until all are known', async () => {
    const user = userEvent.setup();
    renderWith({ title: 'Lease', cards: [{ front: 'Rent?', back: 'Monthly' }, { front: 'Term?', back: '11 months' }] });
    expect(screen.getByText('Rent?')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Show answer' }));
    expect(screen.getByText('Monthly')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Know it' }));
    await user.click(screen.getByRole('button', { name: 'Show answer' }));
    await user.click(screen.getByRole('button', { name: 'Again' }));
    expect(screen.getByText('1 card to go over again.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Next round' }));
    expect(screen.getByText('Term?')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Show answer' }));
    await user.click(screen.getByRole('button', { name: 'Know it' }));
    expect(screen.getByText('All 2 cards known.')).toBeInTheDocument();
  });
});
