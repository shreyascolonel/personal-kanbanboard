import React, { useState, useEffect } from 'react';

export default function TaskModal({ isOpen, onClose, onSave, task }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('todo');
  const [priority, setPriority] = useState('low');
  const [dueDate, setDueDate] = useState('');
  
  const [error, setError] = useState('');

  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setStatus(task.status || 'todo');
      setPriority(task.priority || 'low');
      setDueDate(task.dueDate || '');
    } else {
      setTitle('');
      setDescription('');
      setStatus('todo');
      setPriority('low');
      setDueDate('');
    }
    setError('');
  }, [task, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    
    onSave({
      id: task ? task.id : undefined,
      title: title.trim(),
      description: description.trim(),
      status,
      priority,
      dueDate,
      createdAt: task ? task.createdAt : new Date().toISOString()
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{task ? 'Edit Task' : 'Add New Task'}</h2>
          <button className="btn btn-text btn-icon" onClick={onClose} aria-label="Close modal">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {error && <div style={{ color: 'var(--priority-high-text)', fontSize: '0.85rem', fontWeight: '500' }}>{error}</div>}
          
          <div className="form-group">
            <label htmlFor="task-title">Title *</label>
            <input
              id="task-title"
              type="text"
              className="form-input"
              placeholder="e.g. Buy groceries"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="task-desc">Description</label>
            <textarea
              id="task-desc"
              className="form-input"
              placeholder="Add details about this task..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows="3"
              style={{ resize: 'vertical' }}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="task-status">Status</label>
              <select
                id="task-status"
                className="form-input select-input"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="task-priority">Priority</label>
              <select
                id="task-priority"
                className="form-input select-input"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="task-due-date">Due Date</label>
            <input
              id="task-due-date"
              type="date"
              className="form-input"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {task ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
