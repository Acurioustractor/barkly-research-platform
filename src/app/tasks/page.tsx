'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { PageLayout, Container } from '@/components/core';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/core/Card';
import { Button } from '@/components/core/Button';
import { Input } from '@/components/core';
import { Badge } from '@/components/core/Badge';

type TaskStatus = 'todo' | 'in-progress' | 'done';

interface TaskItem {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  project?: string;
  dueDate?: string; // ISO date
}

const STATUS_COLUMNS: { key: TaskStatus; label: string }[] = [
  { key: 'todo', label: 'To Do' },
  { key: 'in-progress', label: 'In Progress' },
  { key: 'done', label: 'Done' },
];

const STORAGE_KEY = 'bb_tasks_v1';

export default function TasksPage() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [search, setSearch] = useState('');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [creating, setCreating] = useState<boolean>(false);
  const [newTask, setNewTask] = useState<Partial<TaskItem>>({ status: 'todo' });

  // Keyboard navigation state
  const [activeColumnIndex, setActiveColumnIndex] = useState<number>(0);
  const [activeTaskIndexByColumn, setActiveTaskIndexByColumn] = useState<Record<TaskStatus, number>>({
    'todo': 0,
    'in-progress': 0,
    'done': 0,
  });
  const [showActionsForTaskId, setShowActionsForTaskId] = useState<string | null>(null);
  const boardRef = useRef<HTMLDivElement | null>(null);

  // Load/save tasks from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setTasks(JSON.parse(raw));
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch {}
  }, [tasks]);

  const projects = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach(t => t.project && set.add(t.project));
    return Array.from(set).sort();
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    const query = search.trim().toLowerCase();
    return tasks.filter(t => {
      const matchesText = !query ||
        t.title.toLowerCase().includes(query) ||
        (t.description || '').toLowerCase().includes(query);
      const matchesProject = projectFilter === 'all' || (t.project || '') === projectFilter;
      return matchesText && matchesProject;
    });
  }, [tasks, search, projectFilter]);

  const tasksByStatus = useMemo(() => {
    const map: Record<TaskStatus, TaskItem[]> = { 'todo': [], 'in-progress': [], 'done': [] };
    filteredTasks.forEach(t => map[t.status].push(t));
    return map;
  }, [filteredTasks]);

  const overdueCount = useMemo(() => {
    const today = new Date();
    return filteredTasks.filter(t => t.status !== 'done' && t.dueDate && new Date(t.dueDate) < today).length;
  }, [filteredTasks]);

  const counts = {
    todo: tasksByStatus['todo'].length,
    inProgress: tasksByStatus['in-progress'].length,
    done: tasksByStatus['done'].length,
    overdue: overdueCount,
  };

  const handleCreateTask = () => {
    if (!newTask.title || newTask.title.trim() === '') return;
    const item: TaskItem = {
      id: crypto.randomUUID(),
      title: newTask.title.trim(),
      description: newTask.description?.trim() || '',
      status: (newTask.status as TaskStatus) || 'todo',
      project: newTask.project?.trim() || undefined,
      dueDate: newTask.dueDate || undefined,
    };
    setTasks(prev => [item, ...prev]);
    setCreating(false);
    setNewTask({ status: 'todo' });
  };

  const moveTask = (taskId: string, direction: 'left' | 'right') => {
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      const order: TaskStatus[] = ['todo', 'in-progress', 'done'];
      const idx = order.indexOf(t.status);
      const nextIdx = direction === 'left' ? Math.max(0, idx - 1) : Math.min(order.length - 1, idx + 1);
      return { ...t, status: order[nextIdx] };
    }));
  };

  const updateTask = (taskId: string, updates: Partial<TaskItem>) => {
    setTasks(prev => prev.map(t => (t.id === taskId ? { ...t, ...updates } : t)));
  };

  const deleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  const onBoardKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const currentColumn = STATUS_COLUMNS[activeColumnIndex]?.key || 'todo';
    const columnTasks = tasksByStatus[currentColumn];
    const currentIndex = activeTaskIndexByColumn[currentColumn] || 0;

    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const nextCol = Math.min(STATUS_COLUMNS.length - 1, activeColumnIndex + 1);
      setActiveColumnIndex(nextCol);
      const nextKey = STATUS_COLUMNS[nextCol].key;
      setActiveTaskIndexByColumn(prev => ({ ...prev, [nextKey]: Math.min(prev[nextKey] || 0, (tasksByStatus[nextKey].length - 1) || 0) }));
      setShowActionsForTaskId(null);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prevCol = Math.max(0, activeColumnIndex - 1);
      setActiveColumnIndex(prevCol);
      const prevKey = STATUS_COLUMNS[prevCol].key;
      setActiveTaskIndexByColumn(prev => ({ ...prev, [prevKey]: Math.min(prev[prevKey] || 0, (tasksByStatus[prevKey].length - 1) || 0) }));
      setShowActionsForTaskId(null);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = Math.min((columnTasks.length - 1) || 0, currentIndex + 1);
      setActiveTaskIndexByColumn(prev => ({ ...prev, [currentColumn]: nextIndex }));
      setShowActionsForTaskId(null);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const nextIndex = Math.max(0, currentIndex - 1);
      setActiveTaskIndexByColumn(prev => ({ ...prev, [currentColumn]: nextIndex }));
      setShowActionsForTaskId(null);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const task = columnTasks[currentIndex];
      if (task) setShowActionsForTaskId(task.id === showActionsForTaskId ? null : task.id);
    }
  };

  const isTaskActive = (status: TaskStatus, idx: number) => {
    const colIndex = STATUS_COLUMNS.findIndex(c => c.key === status);
    return colIndex === activeColumnIndex && (activeTaskIndexByColumn[status] || 0) === idx;
  };

  return (
    <PageLayout>
      {/* Header */}
      <section className="py-8 bg-gradient-to-r from-blue-50 to-purple-50">
        <Container>
          <div className="max-w-5xl">
            <h1 className="text-3xl font-bold mb-3">Task Management</h1>
            <p className="text-muted-foreground mb-4">
              Organize and track project tasks across all Palm Island initiatives
            </p>
            <div className="text-xs text-muted-foreground">
              Use arrow keys to navigate between columns and tasks. Press Enter to interact with a task. Press Tab to access filters and controls.
            </div>
          </div>
        </Container>
      </section>

      {/* Controls */}
      <section className="py-6 border-b">
        <Container>
          <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
            <Button variant="primary" onClick={() => setCreating(v => !v)}>
              {creating ? 'Close' : 'Create Task'}
            </Button>
            <div className="flex-1 flex gap-3 w-full">
              <Input
                placeholder="Search tasks..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <select
                aria-label="Project filter"
                className="w-48 p-2 border rounded-md"
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
              >
                <option value="all">All Projects</option>
                {projects.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          {creating && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Create Task</CardTitle>
                <CardDescription>Add a task to your board</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Title</label>
                  <Input value={newTask.title || ''} onChange={(e) => setNewTask(t => ({ ...t, title: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Project</label>
                  <Input value={newTask.project || ''} onChange={(e) => setNewTask(t => ({ ...t, project: e.target.value }))} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    className="w-full p-2 border rounded-md"
                    rows={3}
                    value={newTask.description || ''}
                    onChange={(e) => setNewTask(t => ({ ...t, description: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select
                    className="w-full p-2 border rounded-md"
                    value={(newTask.status as TaskStatus) || 'todo'}
                    onChange={(e) => setNewTask(t => ({ ...t, status: e.target.value as TaskStatus }))}
                  >
                    {STATUS_COLUMNS.map(s => (
                      <option key={s.key} value={s.key}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Due Date</label>
                  <input
                    type="date"
                    className="w-full p-2 border rounded-md"
                    value={newTask.dueDate || ''}
                    onChange={(e) => setNewTask(t => ({ ...t, dueDate: e.target.value }))}
                  />
                </div>
                <div className="md:col-span-2 flex gap-2">
                  <Button onClick={handleCreateTask} variant="primary">Add Task</Button>
                  <Button onClick={() => { setCreating(false); setNewTask({ status: 'todo' }); }} variant="outline">Cancel</Button>
                </div>
              </CardContent>
            </Card>
          )}
        </Container>
      </section>

      {/* Counters */}
      <section className="py-6">
        <Container>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{counts.todo}</div>
                <div className="text-sm text-muted-foreground">To Do</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">{counts.inProgress}</div>
                <div className="text-sm text-muted-foreground">In Progress</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{counts.done}</div>
                <div className="text-sm text-muted-foreground">Done</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-red-600">{counts.overdue}</div>
                <div className="text-sm text-muted-foreground">Overdue</div>
              </CardContent>
            </Card>
          </div>
        </Container>
      </section>

      {/* Board */}
      <section className="py-6">
        <Container>
          <div
            ref={boardRef}
            tabIndex={0}
            onKeyDown={onBoardKeyDown}
            aria-roledescription="kanban board"
            className="outline-none"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {STATUS_COLUMNS.map((col, colIndex) => {
                const items = tasksByStatus[col.key];
                const isActiveCol = colIndex === activeColumnIndex;
                return (
                  <Card key={col.key} className={isActiveCol ? 'ring-2 ring-primary' : ''}>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center justify-between">
                        <span>{col.label}</span>
                        <Badge variant="outline">{items.length}</Badge>
                      </CardTitle>
                      <CardDescription>
                        {items.length === 0 ? (
                          <span>No tasks in {col.label.toLowerCase()}</span>
                        ) : (
                          <span>&nbsp;</span>
                        )}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {items.map((t, idx) => {
                          const active = isTaskActive(col.key, idx);
                          const overdue = t.status !== 'done' && t.dueDate && new Date(t.dueDate) < new Date();
                          return (
                            <div key={t.id} className={`border rounded p-3 ${active ? 'bg-primary/10 border-primary' : 'bg-white'} transition-colors`}>
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <div className="font-medium text-sm">{t.title}</div>
                                  {t.project && (
                                    <div className="text-xs text-muted-foreground mt-1">{t.project}</div>
                                  )}
                                  {t.dueDate && (
                                    <div className={`text-xs mt-1 ${overdue ? 'text-red-600' : 'text-muted-foreground'}`}>
                                      Due {new Date(t.dueDate).toLocaleDateString()}
                                    </div>
                                  )}
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                  {overdue && <Badge variant="destructive">Overdue</Badge>}
                                  {t.status === 'done' && <Badge variant="success">Done</Badge>}
                                </div>
                              </div>

                              {/* Actions shown when pressing Enter on active task */}
                              {showActionsForTaskId === t.id && (
                                <div className="mt-3 pt-3 border-t flex flex-wrap gap-2">
                                  <Button size="sm" variant="outline" onClick={() => moveTask(t.id, 'left')}>Move Left</Button>
                                  <Button size="sm" variant="outline" onClick={() => moveTask(t.id, 'right')}>Move Right</Button>
                                  {t.status !== 'done' ? (
                                    <Button size="sm" variant="primary" onClick={() => updateTask(t.id, { status: 'done' })}>Mark Done</Button>
                                  ) : (
                                    <Button size="sm" variant="outline" onClick={() => updateTask(t.id, { status: 'todo' })}>Reopen</Button>
                                  )}
                                  <Button size="sm" variant="destructive" onClick={() => deleteTask(t.id)}>Delete</Button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </Container>
      </section>
    </PageLayout>
  );
}



