import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { Plus, CheckCircle, Circle, Clock, AlertTriangle, X } from 'lucide-react';

const priorityColors = { low: 'text-gray-400', medium: 'text-blue-500', high: 'text-orange-500', urgent: 'text-red-500' };

export default function Tasks() {
    const [filter, setFilter] = useState('all');
    const [showForm, setShowForm] = useState(false);
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ['tasks', filter],
        queryFn: async () => {
            const params: any = { per_page: 50 };
            if (filter === 'today') params.due_date = new Date().toISOString().split('T')[0];
            if (filter === 'overdue') params.overdue = true;
            if (filter !== 'all' && filter !== 'today' && filter !== 'overdue') params.status = filter;
            const r = await api.get('/tasks', { params });
            return r.data.data;
        },
    });

    const completeMutation = useMutation({
        mutationFn: async (taskId: number) => { await api.post(`/tasks/${taskId}/complete`); },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['tasks'] }); toast.success('Task completed!'); },
    });

    const createMutation = useMutation({
        mutationFn: async (taskData: any) => { await api.post('/tasks', taskData); },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['tasks'] }); toast.success('Task created.'); setShowForm(false); },
        onError: (e: any) => toast.error(e.response?.data?.message || 'Failed.'),
    });

    return (
        <div className="space-y-6">
            <div className="page-header">
                <h1 className="page-title">Tasks</h1>
                <button onClick={() => setShowForm(true)} className="btn-primary flex items-center space-x-1"><Plus className="w-4 h-4" /><span>New Task</span></button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2">
                {['all', 'pending', 'in_progress', 'today', 'overdue', 'completed'].map(f => (
                    <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${filter === f ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                        {f === 'all' ? 'All' : f === 'in_progress' ? 'In Progress' : f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                ))}
            </div>

            {/* Task List */}
            <div className="space-y-2">
                {isLoading ? [...Array(5)].map((_, i) => <div key={i} className="card h-16 animate-pulse bg-gray-50"></div>) :
                data?.length === 0 ? (
                    <div className="card text-center py-12">
                        <CheckCircle className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                        <p className="text-gray-500">No tasks found.</p>
                    </div>
                ) : data?.map((task: any) => (
                    <div key={task.id} className={`card flex items-start space-x-3 py-3 ${task.status === 'completed' ? 'opacity-60' : ''}`}>
                        <button
                            onClick={() => task.status !== 'completed' && completeMutation.mutate(task.id)}
                            className={`mt-0.5 flex-shrink-0 ${task.status === 'completed' ? 'text-green-500' : 'text-gray-300 hover:text-green-500'}`}
                        >
                            {task.status === 'completed' ? <CheckCircle className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                        </button>
                        <div className="flex-1 min-w-0">
                            <p className={`font-medium text-sm ${task.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900'}`}>{task.title}</p>
                            {task.description && <p className="text-xs text-gray-500 mt-0.5 truncate">{task.description}</p>}
                            <div className="flex items-center space-x-3 mt-1">
                                {task.due_date && (
                                    <span className={`text-xs flex items-center space-x-1 ${new Date(task.due_date) < new Date() && task.status !== 'completed' ? 'text-red-600' : 'text-gray-500'}`}>
                                        <Clock className="w-3 h-3" /><span>{task.due_date}</span>
                                    </span>
                                )}
                                <span className={`text-xs ${priorityColors[task.priority as keyof typeof priorityColors]}`}>{task.priority}</span>
                            </div>
                        </div>
                        {task.subtasks?.length > 0 && (
                            <span className="text-xs text-gray-400">{task.subtasks.filter((s: any) => s.status === 'completed').length}/{task.subtasks.length}</span>
                        )}
                    </div>
                ))}
            </div>

            {/* Create Task Modal */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-xl w-full max-w-md p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold">New Task</h2>
                            <button onClick={() => setShowForm(false)} className="p-1 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                        </div>
                        <TaskForm onSubmit={(d) => createMutation.mutate(d)} saving={createMutation.isPending} />
                    </div>
                </div>
            )}
        </div>
    );
}

function TaskForm({ onSubmit, saving }: { onSubmit: (d: any) => void; saving: boolean }) {
    const [form, setForm] = useState({ title: '', description: '', priority: 'medium', due_date: '', due_time: '' });
    const update = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

    return (
        <div className="space-y-4">
            <div><label className="label">Title *</label><input className="input" value={form.title} onChange={e => update('title', e.target.value)} placeholder="What needs to be done?" autoFocus /></div>
            <div><label className="label">Description</label><textarea className="input" rows={2} value={form.description} onChange={e => update('description', e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-4">
                <div><label className="label">Priority</label>
                    <select className="input" value={form.priority} onChange={e => update('priority', e.target.value)}>
                        <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option>
                    </select>
                </div>
                <div><label className="label">Due Date</label><input type="date" className="input" value={form.due_date} onChange={e => update('due_date', e.target.value)} /></div>
            </div>
            <div className="flex justify-end space-x-3 pt-2">
                <button onClick={() => onSubmit(form)} disabled={saving || !form.title} className="btn-primary">{saving ? 'Creating...' : 'Create Task'}</button>
            </div>
        </div>
    );
}
