import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Dashboard from '../dashboard';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import axios from 'axios';

// Mock axios
vi.mock('axios');

// Mock Inertia
vi.mock('@inertiajs/react', () => ({
  Head: () => null,
  Link: ({ children, href }) => <a href={href}>{children}</a>,
}));

// Create a new QueryClient for each test
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const renderWithClient = (ui: React.ReactElement) => {
  const testQueryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={testQueryClient}>
      {ui}
    </QueryClientProvider>
  );
};

describe('Dashboard', () => {
  it('renders the dashboard page with empty state', async () => {
    // Mock the API response for empty notes
    (axios.get as jest.Mock).mockResolvedValueOnce({
      data: {
        data: [],
        meta: { last_page: 1 }
      }
    });

    renderWithClient(<Dashboard />);

    // Check if the main sections are rendered
    expect(screen.getByText('New note')).toBeInTheDocument();
    expect(screen.getByText('My notes')).toBeInTheDocument();

    // Check if empty state message is shown
    await waitFor(() => {
      expect(screen.getByText('No notes yet')).toBeInTheDocument();
    });
  });

  it('renders notes when available', async () => {
    // Mock the API response with sample notes
    const mockNotes = {
      data: [
        {
          id: 1,
          title: 'Test Note 1',
          icon: 'file-text',
          created_at: '2024-03-10T12:00:00.000Z'
        },
        {
          id: 2,
          title: 'Test Note 2',
          icon: 'coffee',
          created_at: '2024-03-10T13:00:00.000Z'
        }
      ],
      meta: { last_page: 1 }
    };

    (axios.get as jest.Mock).mockResolvedValueOnce({ data: mockNotes });

    renderWithClient(<Dashboard />);

    // Check if notes are rendered
    await waitFor(() => {
      expect(screen.getByText('Test Note 1')).toBeInTheDocument();
      expect(screen.getByText('Test Note 2')).toBeInTheDocument();
    });
  });

  it('handles search functionality', async () => {
    // Mock initial empty search
    (axios.get as jest.Mock).mockResolvedValueOnce({
      data: {
        data: [],
        meta: { last_page: 1 }
      }
    });

    renderWithClient(<Dashboard />);

    // Get the search input
    const searchInput = screen.getByPlaceholderText('Search any note');

    // Mock search results
    const searchResults = {
      data: [
        {
          id: 1,
          title: 'Searched Note',
          icon: 'file-text',
          created_at: '2024-03-10T12:00:00.000Z'
        }
      ],
      meta: { last_page: 1 }
    };

    (axios.get as jest.Mock).mockResolvedValueOnce({ data: searchResults });

    // Perform search
    fireEvent.change(searchInput, { target: { value: 'Searched' } });

    // Check if search results are rendered
    await waitFor(() => {
      expect(screen.getByText('Searched Note')).toBeInTheDocument();
    });
  });
});