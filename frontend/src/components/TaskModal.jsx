import React, { useState, useEffect } from 'react';

export default function TaskModal({ isOpen, onClose, onSave, task, currentUser }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('todo');
  const [priority, setPriority] = useState('low');
  const [dueDate, setDueDate] = useState('');
  
  const [error, setError] = useState('');

  // Extended states for Subtasks, Comments, and Attachments
  const [subtasks, setSubtasks] = useState([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [comments, setComments] = useState([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setStatus(task.status || 'todo');
      setPriority(task.priority || 'low');
      setDueDate(task.dueDate || '');
      setSubtasks(task.subtasks || []);
      setComments(task.comments || []);
      setAttachments(task.attachments || []);
    } else {
      setTitle('');
      setDescription('');
      setStatus('todo');
      setPriority('low');
      setDueDate('');
      setSubtasks([]);
      setComments([]);
      setAttachments([]);
    }
    setError('');
    setNewSubtaskTitle('');
    setNewCommentText('');
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
      subtasks,
      comments,
      attachments: task ? task.attachments : [],
      createdAt: task ? task.createdAt : new Date().toISOString()
    });
    onClose();
  };

  // Subtask Handlers
  const handleAddSubtask = (e) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;

    const newSub = {
      id: 'sub-' + Date.now() + '-' + Math.round(Math.random() * 1000),
      title: newSubtaskTitle.trim(),
      isCompleted: false
    };

    const updated = [...subtasks, newSub];
    setSubtasks(updated);
    setNewSubtaskTitle('');

    // Instant persistence for smooth UX
    if (task) {
      onSave({
        ...task,
        subtasks: updated
      });
    }
  };

  const handleToggleSubtask = (subId) => {
    const updated = subtasks.map(s => 
      s.id === subId ? { ...s, isCompleted: !s.isCompleted } : s
    );
    setSubtasks(updated);
    if (task) {
      onSave({
        ...task,
        subtasks: updated
      });
    }
  };

  const handleDeleteSubtask = (subId) => {
    const updated = subtasks.filter(s => s.id !== subId);
    setSubtasks(updated);
    if (task) {
      onSave({
        ...task,
        subtasks: updated
      });
    }
  };

  // Comment Handlers
  const handleAddComment = (e) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    const newComment = {
      id: 'comment-' + Date.now() + '-' + Math.round(Math.random() * 1000),
      userId: currentUser?.id || 'unknown',
      userEmail: currentUser?.email || 'User',
      text: newCommentText.trim(),
      createdAt: new Date().toISOString()
    };

    const updated = [...comments, newComment];
    setComments(updated);
    setNewCommentText('');

    if (task) {
      onSave({
        ...task,
        comments: updated
      });
    }
  };

  // File Upload Handlers
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !task) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem('kanban_token');
      const response = await fetch(`/api/tasks/${task.id}/attachments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Upload failed');
      }

      const updatedTask = await response.json();
      setAttachments(updatedTask.attachments || []);
      onSave(updatedTask);
    } catch (err) {
      alert('Upload error: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAttachment = async (attachId) => {
    if (!window.confirm('Delete this file attachment permanently?')) return;

    try {
      const token = localStorage.getItem('kanban_token');
      const response = await fetch(`/api/tasks/${task.id}/attachments/${attachId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Delete failed');
      }

      const updatedTask = await response.json();
      setAttachments(updatedTask.attachments || []);
      onSave(updatedTask);
    } catch (err) {
      alert('Delete error: ' + err.message);
    }
  };

  // Helpers
  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatCommentDate = (dateStr) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, { 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
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

          {/* Extended Sections - Only visible when EDITING an existing task */}
          {task ? (
            <>
              {/* SUBTASKS SECTION */}
              <div className="subtasks-section">
                <label className="form-group" style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Subtasks Checklist</label>
                <div className="subtask-list">
                  {subtasks.length === 0 ? (
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>No subtasks created yet.</span>
                  ) : (
                    subtasks.map(sub => (
                      <div key={sub.id} className={`subtask-item ${sub.isCompleted ? 'completed' : ''}`}>
                        <input 
                          type="checkbox" 
                          className="subtask-checkbox"
                          checked={sub.isCompleted} 
                          onChange={() => handleToggleSubtask(sub.id)}
                        />
                        <span className="subtask-title-text">{sub.title}</span>
                        <button 
                          type="button" 
                          className="btn-delete-subtask"
                          onClick={() => handleDeleteSubtask(sub.id)}
                          title="Delete subtask"
                        >
                          ✕
                        </button>
                      </div>
                    ))
                  )}
                </div>
                <div className="subtask-add-form">
                  <input
                    type="text"
                    className="form-input"
                    style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
                    placeholder="Add a new checklist subtask..."
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  />
                  <button type="button" className="btn btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }} onClick={handleAddSubtask}>
                    Add
                  </button>
                </div>
              </div>

              {/* ATTACHMENTS SECTION */}
              <div className="attachments-section">
                <label style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>File Attachments</label>
                <div className="attachments-list">
                  {attachments.length === 0 ? (
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>No attachments uploaded.</span>
                  ) : (
                    attachments.map(att => (
                      <div key={att.id} className="attachment-item">
                        <div className="attachment-icon-badge">📎</div>
                        <div className="attachment-info">
                          <a 
                            href={`/uploads/${att.filename}`} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="attachment-name"
                            title="Download file"
                          >
                            {att.originalName}
                          </a>
                          <span className="attachment-size">{formatBytes(att.size)} • {formatCommentDate(att.uploadedAt)}</span>
                        </div>
                        <button 
                          type="button" 
                          className="btn-delete-attachment"
                          onClick={() => handleDeleteAttachment(att.id)}
                          title="Delete attachment"
                        >
                          ✕
                        </button>
                      </div>
                    ))
                  )}
                </div>
                <div className="attachment-upload-form">
                  <label className="file-upload-input-label">
                    {uploading ? 'Uploading attachment...' : '📎 Choose file to upload (Max 10MB)'}
                    <input 
                      type="file" 
                      style={{ display: 'none' }} 
                      disabled={uploading} 
                      onChange={handleFileUpload} 
                    />
                  </label>
                </div>
              </div>

              {/* COMMENTS SECTION */}
              <div className="comments-section">
                <label style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Comments Feed</label>
                <div className="comments-feed">
                  {comments.length === 0 ? (
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>No comments posted yet.</span>
                  ) : (
                    [...comments].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)).map(c => (
                      <div key={c.id} className="comment-bubble">
                        <div className="comment-meta">
                          <span className="comment-author">{c.userEmail}</span>
                          <span className="comment-date">{formatCommentDate(c.createdAt)}</span>
                        </div>
                        <div className="comment-text">{c.text}</div>
                      </div>
                    ))
                  )}
                </div>
                <div className="comment-input-form">
                  <textarea
                    className="form-input"
                    style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem', resize: 'vertical' }}
                    placeholder="Write a comment..."
                    rows="2"
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                  />
                  <button 
                    type="button" 
                    className="btn btn-primary" 
                    style={{ alignSelf: 'flex-end', padding: '0.4rem 1rem', fontSize: '0.85rem' }} 
                    onClick={handleAddComment}
                  >
                    Post Comment
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div style={{ padding: '1rem 0', borderTop: '1px solid var(--border-color)', color: 'var(--text-tertiary)', fontStyle: 'italic', fontSize: '0.8rem', textAlign: 'center' }}>
              Create this task first to add subtasks, upload files, or post comments!
            </div>
          )}

          <div className="modal-actions" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '0.5rem' }}>
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
