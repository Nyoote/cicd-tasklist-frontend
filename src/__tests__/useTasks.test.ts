import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useTasks } from '../hooks/useTasks';

vi.mock('../api/taskApi', () => ({
  getTasks: vi.fn(),
  createTask: vi.fn(),
  updateTask: vi.fn(),
  deleteTask: vi.fn(),
}));

import * as taskApi from '../api/taskApi';
import { mockTasks } from './testUtils';

const mockApi = vi.mocked(taskApi);

describe('useTasks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads tasks on mount', async () => {
    mockApi.getTasks.mockResolvedValue(mockTasks);
    const { result } = renderHook(() => useTasks());
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.tasks).toEqual(mockTasks);
  });

  it('sets error on load failure', async () => {
    mockApi.getTasks.mockRejectedValue(new Error('API Error'));
    const { result } = renderHook(() => useTasks());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('API Error');
  });

  it('adds a task to the top of the list', async () => {
    mockApi.getTasks.mockResolvedValue([]);
    const newTask = { id: 3, title: 'New', description: null, completed: false, createdAt: '2026-01-17T10:00:00Z', updatedAt: '2026-01-17T10:00:00Z' };
    mockApi.createTask.mockResolvedValue(newTask);
    const { result } = renderHook(() => useTasks());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.addTask({ title: 'New' });
    });
    expect(result.current.tasks[0]).toEqual(newTask);
  });

  it('edits a task in place', async () => {
    mockApi.getTasks.mockResolvedValue(mockTasks);
    const updated = { ...mockTasks[0], title: 'Updated' };
    mockApi.updateTask.mockResolvedValue(updated);
    const { result } = renderHook(() => useTasks());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.editTask(1, { title: 'Updated' });
    });
    expect(result.current.tasks[0].title).toBe('Updated');
  });

  it('removes a task from the list', async () => {
    mockApi.getTasks.mockResolvedValue(mockTasks);
    mockApi.deleteTask.mockResolvedValue(undefined);
    const { result } = renderHook(() => useTasks());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.removeTask(1);
    });
    expect(result.current.tasks).toHaveLength(1);
    expect(result.current.tasks[0].id).toBe(2);
  });

  it('toggles task completion', async () => {
    mockApi.getTasks.mockResolvedValue(mockTasks);
    const toggled = { ...mockTasks[0], completed: true };
    mockApi.updateTask.mockResolvedValue(toggled);
    const { result } = renderHook(() => useTasks());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.toggleComplete(1);
    });
    expect(result.current.tasks[0].completed).toBe(true);
  });

  it('does nothing on toggleComplete for unknown id', async () => {
    mockApi.getTasks.mockResolvedValue(mockTasks);
    const { result } = renderHook(() => useTasks());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.toggleComplete(999);
    });
    expect(mockApi.updateTask).not.toHaveBeenCalled();
  });
});