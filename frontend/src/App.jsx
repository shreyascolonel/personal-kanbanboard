import React, { useState, useEffect } from 'react';
import KanbanBoard from './components/KanbanBoard';
import TaskModal from './components/TaskModal';
import Login from './components/Login';
import AdminPanel from './components/AdminPanel';

export default function App() {
  // Authentication & Session States
  const [token, setToken] = useState(() => localStorage.getItem('kanban_token') || null);
  const [user, setUser] = useState(null);
  const [currentView, setCurrentView] = useState('login'); // 'login', 'board', 'admin'
  const [loginError, setLoginError] = useState(null);

  // Kanban Dashboard States
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');

  // Task Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  // Theme State
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

  // Theme Sync Effect
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Session Validation on Mount
  useEffect(() => {
    validateSession();
  }, [token]);

  const validateSession = async () => {
    if (!token) {
      setUser(null);
      setCurrentView('login');
      setAuthChecking(false);
      return;
    }

    setAuthChecking(true);
    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Session invalid or expired');
      }

      const data = await response.json();
      setUser(data.user);
      setCurrentView('board');
      
      // Load user tasks immediately on valid session
      fetchTasks(token);
    } catch (err) {
      console.warn('Session restoration failed:', err.message);
      handleLogout();
    } finally {
      setAuthChecking(false);
    }
  };

  const fetchTasks = async (sessionToken = token) => {
    if (!sessionToken) return;
    setLoading(true);
    try {
      const response = await fetch('/api/tasks', {
        headers: {
          'Authorization': `Bearer ${sessionToken}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to load tasks');
      }
      const data = await response.json();
      setTasks(data);
    } catch (err) {
      console.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Auth Handlers
  const handleLogin = async (email, password) => {
    setLoginError(null);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      // Store credentials and session
      localStorage.setItem('kanban_token', data.token);
      setToken(data.token);
      setUser(data.user);
      setCurrentView('board');
      
      // Fetch tasks for the logged in user
      fetchTasks(data.token);
    } catch (err) {
      setLoginError(err.message);
      throw err;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('kanban_token');
    setToken(null);
    setUser(null);
    setTasks([]);
    setCurrentView('login');
    setLoginError(null);
  };

  // Task CRUD Handlers (Scoped)
  const handleSaveTask = async (taskData) => {
    const isEdit = !!taskData.id;
    const url = isEdit ? `/api/tasks/${taskData.id}` : '/api/tasks';
    const method = isEdit ? 'PUT' : 'POST';

    // Optimistic UI updates
    const tempId = 'temp-' + Date.now();
    let oldTasks = [...tasks];
    
    if (!isEdit) {
      // Append temporary item for slick instant loading response
      const tempTask = {
        ...taskData,
        id: tempId,
        createdAt: new Date().toISOString()
      };
      setTasks([...tasks, tempTask]);
    } else {
      setTasks(tasks.map(t => t.id === taskData.id ? { ...t, ...taskData } : t));
    }

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(taskData)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to persist task');
      }

      if (!isEdit) {
        // Swap out temporary object with formal server object
        setTasks(prev => prev.map(t => t.id === tempId ? data : t));
      } else {
        setTasks(prev => prev.map(t => t.id === taskData.id ? data : t));
      }
    } catch (err) {
      console.error(err.message);
      // Revert UI to prevent visual mismatch
      setTasks(oldTasks);
      alert('Persistence error: Could not sync task with server. Please try again.');
    }
  };

  const handleDeleteTask = async (taskId) => {
    const oldTasks = [...tasks];
    // Optimistic UI update
    setTasks(tasks.filter(t => t.id !== taskId));

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete task');
      }
    } catch (err) {
      console.error(err.message);
      // Revert UI
      setTasks(oldTasks);
      alert('Sync failure: Could not delete task on server.');
    }
  };

  const handleMoveTask = async (taskId, newStatus) => {
    const oldTasks = [...tasks];
    // Optimistic update
    setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update task status');
      }
    } catch (err) {
      console.error(err.message);
      setTasks(oldTasks);
    }
  };

  const handleUpdateTaskStatus = (taskId, newStatus) => {
    handleMoveTask(taskId, newStatus);
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const openAddTaskModal = () => {
    setEditingTask(null);
    setIsModalOpen(true);
  };

  const openEditTaskModal = (task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  // Searching & Filtering
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesPriority = 
      priorityFilter === 'all' || task.priority === priorityFilter;

    return matchesSearch && matchesPriority;
  });

  // Loading Indicator for Session Check
  if (authChecking) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0b0f19', color: '#9ca3af' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div style={{ border: '3px solid rgba(255,255,255,0.08)', borderTop: '3px solid #6366f1', borderRadius: '50%', width: '30px', height: '30px', animation: 'spin 1s linear infinite' }}></div>
          <span>Verifying security session...</span>
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          `}} />
        </div>
      </div>
    );
  }

  // Auth Routing
  if (currentView === 'login' || !user) {
    return <Login onLogin={handleLogin} error={loginError} />;
  }

  return (
    <div className="app-container">
      {/* Header */}
      <header className="header">
        <div className="logo-group">
          <span className="logo-icon">📋</span>
          <h1 className="logo-text">KanbanFlow</h1>
        </div>
        <div className="header-actions">
          {/* Theme Toggle */}
          <button 
            className="btn btn-icon btn-text"
            onClick={toggleTheme} 
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </svg>
            )}
          </button>

          {/* Conditional Admin Button */}
          {user.isAdmin && (
            <button 
              className={`btn ${currentView === 'admin' ? 'btn-primary' : ''}`}
              onClick={() => setCurrentView(currentView === 'admin' ? 'board' : 'admin')}
              title="Admin Panel"
            >
              ⚙️ Admin
            </button>
          )}

          {/* Sign Out */}
          <button 
            className="btn" 
            onClick={handleLogout}
            title="Sign Out of Session"
          >
            👋 Sign Out
          </button>
          
          {/* Add Task Button (Desktop Board View Only) */}
          {currentView === 'board' && (
            <button 
              className="btn btn-primary"
              onClick={openAddTaskModal}
            >
              ➕ Add Task
            </button>
          )}
        </div>
      </header>

      {/* View Routing */}
      {currentView === 'admin' && user.isAdmin ? (
        <AdminPanel
          token={token}
          currentUser={user}
          onBackToBoard={() => setCurrentView('board')}
        />
      ) : (
        <>
          {/* Filter and Search Bar */}
          <section className="filter-bar">
            <div className="search-input-wrapper">
              <svg className="search-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input
                type="text"
                className="search-input"
                placeholder="Search your tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="filter-group">
              <label htmlFor="priority-filter" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Priority:</label>
              <select
                id="priority-filter"
                className="select-input"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
              >
                <option value="all">All Priorities</option>
                <option value="low">Low Only</option>
                <option value="medium">Medium Only</option>
                <option value="high">High Only</option>
              </select>
            </div>
          </section>

          {/* Kanban Board Grid */}
          {loading ? (
            <div style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                <div style={{ border: '3px solid var(--border-color)', borderTop: '3px solid var(--accent-color)', borderRadius: '50%', width: '30px', height: '30px', animation: 'spin 1s linear infinite' }}></div>
                <span>Syncing dashboard...</span>
              </div>
            </div>
          ) : (
            <KanbanBoard
              tasks={filteredTasks}
              onEditTask={openEditTaskModal}
              onDeleteTask={handleDeleteTask}
              onMoveTask={handleMoveTask}
              onUpdateTaskStatus={handleUpdateTaskStatus}
            />
          )}

          {/* Floating Mobile Task Button */}
          <button 
            className="btn btn-primary floating-add-btn"
            onClick={openAddTaskModal}
            aria-label="Add new task"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>

          {/* Create/Edit Modal Dialog */}
          <TaskModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSave={handleSaveTask}
            task={editingTask}
          />
        </>
      )}
    </div>
  );
}
