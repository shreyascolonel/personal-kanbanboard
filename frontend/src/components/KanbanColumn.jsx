import React, { useState } from 'react';
import TaskCard from './TaskCard';

export default function KanbanColumn({
  title,
  status,
  tasks,
  isActive,
  onEditTask,
  onDeleteTask,
  onMoveTask,
  onDragStart,
  onDragEnd,
  onDrop
}) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    setIsDragOver(false);
    onDrop(e, status);
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'todo': return '📌';
      case 'in-progress': return '⚡';
      case 'done': return '✅';
      default: return '📋';
    }
  };

  const getEmptyStateMessage = () => {
    switch (status) {
      case 'todo': return 'No pending tasks! Time to relax or create a new one.';
      case 'in-progress': return 'No tasks in progress. Pick something from To Do!';
      case 'done': return 'Keep going! Completed tasks will appear here.';
      default: return 'No tasks found.';
    }
  };

  return (
    <div
      className={`column column-${status} ${isActive ? 'active' : ''} ${isDragOver ? 'drag-over' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="column-header">
        <h3 className="column-header-title">
          <span className="column-header-indicator"></span>
          <span>{getStatusIcon()}</span>
          <span>{title}</span>
        </h3>
        <span className="column-count">{tasks.length}</span>
      </div>

      <div className="column-cards-container">
        {tasks.length > 0 ? (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={onEditTask}
              onDelete={onDeleteTask}
              onMoveTask={onMoveTask}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
            />
          ))
        ) : (
          <div className="column-empty-state">
            <span className="column-empty-icon">🏖️</span>
            <span className="column-empty-text">{getEmptyStateMessage()}</span>
          </div>
        )}
      </div>
    </div>
  );
}
