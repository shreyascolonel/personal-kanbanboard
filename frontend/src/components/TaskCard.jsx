import React from 'react';

export default function TaskCard({ task, onEdit, onDelete, onMoveTask, onDragStart, onDragEnd }) {
  // Format due date in a human-friendly format
  const formatDueDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch (e) {
      return dateStr;
    }
  };

  const handleQuickMove = (e, targetStatus) => {
    e.stopPropagation(); // Prevent opening the edit modal
    onMoveTask(task.id, targetStatus);
  };

  const handleDelete = (e) => {
    e.stopPropagation(); // Prevent opening the edit modal
    if (window.confirm('Are you sure you want to delete this task?')) {
      onDelete(task.id);
    }
  };

  return (
    <div
      className="task-card"
      draggable
      onDragStart={(e) => onDragStart(e, task.id)}
      onDragEnd={onDragEnd}
      onClick={() => onEdit(task)}
    >
      <div className="card-header-row">
        <div className="card-title">{task.title}</div>
        <button
          className="btn btn-text btn-icon"
          style={{ width: '1.75rem', height: '1.75rem', minWidth: '1.75rem', color: 'var(--text-tertiary)' }}
          onClick={handleDelete}
          title="Delete task"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </div>

      {task.description && (
        <div className="card-description">{task.description}</div>
      )}

      {/* Subtasks Progress Bar */}
      {task.subtasks && task.subtasks.length > 0 && (() => {
        const subtasks = task.subtasks || [];
        const completed = subtasks.filter(s => s.isCompleted).length;
        const total = subtasks.length;
        const pct = Math.round((completed / total) * 100);
        return (
          <div className="card-progress-container">
            <div className="card-progress-text">
              <span>Subtasks</span>
              <span>{completed}/{total} ({pct}%)</span>
            </div>
            <div className="card-progress-bar-bg">
              <div className="card-progress-bar-fill" style={{ width: `${pct}%` }}></div>
            </div>
          </div>
        );
      })()}

      <div className="card-meta-row">
        <span className={`badge badge-${task.priority}`}>
          {task.priority}
        </span>

        {task.dueDate && (() => {
          const todayStr = new Date().toISOString().split('T')[0];
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          const tomorrowStr = tomorrow.toISOString().split('T')[0];
          const isUrgent = task.status !== 'done' && task.dueDate <= tomorrowStr;
          const warningClass = isUrgent ? 'deadline-warning' : '';

          return (
            <span className={`card-due-date ${warningClass}`} title={isUrgent ? 'Approaching Deadline or Overdue!' : ''}>
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              {formatDueDate(task.dueDate)}
            </span>
          );
        })()}
      </div>

      {/* Meta Badge counters for Comments and Attachments */}
      {((task.comments && task.comments.length > 0) || (task.attachments && task.attachments.length > 0)) && (
        <div className="card-badges-row">
          {task.comments && task.comments.length > 0 && (
            <span className="card-badge" title={`${task.comments.length} comment(s)`}>
              💬 {task.comments.length}
            </span>
          )}
          {task.attachments && task.attachments.length > 0 && (
            <span className="card-badge" title={`${task.attachments.length} attachment(s)`}>
              📎 {task.attachments.length}
            </span>
          )}
        </div>
      )}

      {/* Quick Move / Touch Buttons for Mobile & Tablet friendliness */}
      <div className="card-touch-controls">
        {task.status !== 'todo' && (
          <button
            className="btn-quick-move"
            onClick={(e) => handleQuickMove(e, task.status === 'done' ? 'in-progress' : 'todo')}
            aria-label="Move back"
          >
            ← Back
          </button>
        )}
        {task.status !== 'done' && (
          <button
            className="btn-quick-move"
            onClick={(e) => handleQuickMove(e, task.status === 'todo' ? 'in-progress' : 'done')}
            style={{ marginLeft: 'auto', backgroundColor: 'var(--accent-glow)', color: 'var(--accent-color)' }}
            aria-label="Move forward"
          >
            Next →
          </button>
        )}
      </div>
    </div>
  );
}
