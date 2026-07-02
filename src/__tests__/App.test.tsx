import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from '../App';

vi.mock('../api/taskApi', () => ({
  getTasks: vi.fn(),
  createTask: vi.fn(),
  updateTask: vi.fn(),
  deleteTask: vi.fn(),
}));

import * as taskApi from '../api/taskApi';
import { mockTasks } from './testUtils';

const mockApi = vi.mocked(taskApi);

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders header and loads tasks', async () => {
    mockApi.getTasks.mockResolvedValue(mockTasks);
    render(<App />);
    expect(screen.getByText('Mes Tâches')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('Tâche 1')).toBeInTheDocument();
    });
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getAllByText('1')).toHaveLength(2);
  });

  it('shows loading then tasks', async () => {
    mockApi.getTasks.mockResolvedValue(mockTasks);
    render(<App />);
    expect(screen.getByTestId('loading')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByTestId('task-list')).toBeInTheDocument();
    });
  });

  it('shows error state when API fails', async () => {
    mockApi.getTasks.mockRejectedValue(new Error('Network Error'));
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText('Erreur : Network Error')).toBeInTheDocument();
    });
  });

  it('adds a task via form', async () => {
    const newTask = { id: 3, title: 'New Task', description: 'New Desc', completed: false, createdAt: '2026-01-17T10:00:00Z', updatedAt: '2026-01-17T10:00:00Z' };
    mockApi.getTasks.mockResolvedValue([]);
    mockApi.createTask.mockResolvedValue(newTask);
    render(<App />);
    await waitFor(() => expect(screen.getByTestId('empty')).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText('Titre'), { target: { value: 'New Task' } });
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'New Desc' } });
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter' }));
    await waitFor(() => {
      expect(screen.getByText('New Task')).toBeInTheDocument();
    });
  });

  it('toggles task completion', async () => {
    mockApi.getTasks.mockResolvedValue(mockTasks);
    mockApi.updateTask.mockResolvedValue({ ...mockTasks[0], completed: true });
    render(<App />);
    await waitFor(() => expect(screen.getByText('Tâche 1')).toBeInTheDocument());
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);
    await waitFor(() => {
      expect(mockApi.updateTask).toHaveBeenCalledWith(1, { completed: true });
    });
  });

  it('deletes a task', async () => {
    mockApi.getTasks.mockResolvedValue(mockTasks);
    mockApi.deleteTask.mockResolvedValue(undefined);
    render(<App />);
    await waitFor(() => expect(screen.getByText('Tâche 1')).toBeInTheDocument());
    const deleteButtons = screen.getAllByLabelText('Supprimer');
    fireEvent.click(deleteButtons[0]);
    fireEvent.click(deleteButtons[0]);
    await waitFor(() => {
      expect(mockApi.deleteTask).toHaveBeenCalledWith(1);
    });
  });
});