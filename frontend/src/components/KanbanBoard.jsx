import React, { useState } from 'react';
import KanbanColumn from './KanbanColumn';

export default function KanbanBoard({
  tasks,
  onEditTask,
  onDeleteTask,
  onMoveTask,
  onUpdateTaskStatus
}) {
  const [activeTab, setActiveTab] = useState('todo'); // 'todo', 'in-progress', 'done'
  const [draggedTaskId, setDraggedTaskId] = useState(null);

  // Group tasks by status
  const todoTasks = tasks.filter((task) => task.status === 'todo');
  const inProgressTasks = tasks.filter((task) => task.status === 'in-progress');
  const doneTasks = tasks.filter((task) => task.status === 'done');

  // Drag and Drop handlers
  const handleDragStart = (e, taskId) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.setData('text/plain', taskId);
    // Add dragging class to element after timeout to allow drag image creation
    setTimeout(() => {
      e.target.classList.add('dragging');
    }, 0);
  };

  const handleDragEnd = (e) => {
    e.target.classList.remove('dragging');
    setDraggedTaskId(null);
  };

  const handleDrop = (e, targetStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    if (taskId) {
      onUpdateTaskStatus(taskId, targetStatus);
    }
  };

  return (
    <div className="board-container">
      {/* Mobile Tab Switcher */}
      <div className="mobile-tabs">
        <button
          className={`mobile-tab-btn ${activeTab === 'todo' ? 'active' : ''}`}
          onClick={() => setActiveTab('todo')}
        >
          <span>To Do</span>
          <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>({todoTasks.length})</span>
          <div className="tab-indicator-bar" />
        </button>
        <button
          className={`mobile-tab-btn ${activeTab === 'in-progress' ? 'active' : ''}`}
          onClick={() => setActiveTab('in-progress')}
        >
          <span>In Progress</span>
          <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>({inProgressTasks.length})</span>
          <div className="tab-indicator-bar" />
        </button>
        <button
          className={`mobile-tab-btn ${activeTab === 'done' ? 'active' : ''}`}
          onClick={() => setActiveTab('done')}
        >
          <span>Done</span>
          <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>({doneTasks.length})</span>
          <div className="tab-indicator-bar" />
        </button>
      </div>

      {/* Responsive Columns Grid */}
      <div className="board-columns-grid">
        <KanbanColumn
          title="To Do"
          status="todo"
          tasks={todoTasks}
          isActive={activeTab === 'todo'}
          onEditTask={onEditTask}
          onDeleteTask={onDeleteTask}
          onMoveTask={onMoveTask}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDrop={handleDrop}
        />

        <KanbanColumn
          title="In Progress"
          status="in-progress"
          tasks={inProgressTasks}
          isActive={activeTab === 'in-progress'}
          onEditTask={onEditTask}
          onDeleteTask={onDeleteTask}
          onMoveTask={onMoveTask}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDrop={handleDrop}
        />

        <KanbanColumn
          title="Done"
          status="done"
          tasks={doneTasks}
          isActive={activeTab === 'done'}
          onEditTask={onEditTask}
          onDeleteTask={onDeleteTask}
          onMoveTask={onMoveTask}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDrop={handleDrop}
        />
      </div>
    </div>
  );
}
