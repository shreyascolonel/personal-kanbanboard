import React, { useState, useEffect } from 'react';

export default function AdminPanel({ token, currentUser, onBackToBoard }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [modalError, setModalError] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch users. Access denied.');
      }
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      setError(err.message || 'An error occurred while loading users.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setModalError('');

    if (!email.trim() || !password) {
      setModalError('Email and Password are required.');
      return;
    }

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email: email.trim(), password, isAdmin })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create user');
      }

      setUsers([...users, data]);
      setIsAddModalOpen(false);
      resetForm();
    } catch (err) {
      setModalError(err.message);
    }
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    setModalError('');

    if (!email.trim()) {
      setModalError('Email is required.');
      return;
    }

    try {
      const updateData = { email: email.trim(), isAdmin };
      if (password) {
        updateData.password = password; // Only send password if admin typed a new one
      }

      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update user');
      }

      setUsers(users.map(u => u.id === selectedUser.id ? data : u));
      setIsEditModalOpen(false);
      resetForm();
    } catch (err) {
      setModalError(err.message);
    }
  };

  const handleDeleteUser = async (userId, userEmail) => {
    if (userId === currentUser.id) {
      alert('Security Alert: You cannot delete your own administrative account.');
      return;
    }

    if (!window.confirm(`Warning: Are you sure you want to delete user "${userEmail}"?\nThis will also delete ALL tasks associated with this user.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete user');
      }

      setUsers(users.filter(u => u.id !== userId));
    } catch (err) {
      alert(err.message);
    }
  };

  const openAddModal = () => {
    resetForm();
    setModalError('');
    setIsAddModalOpen(true);
  };

  const openEditModal = (user) => {
    resetForm();
    setModalError('');
    setSelectedUser(user);
    setEmail(user.email);
    setIsAdmin(user.isAdmin);
    setIsEditModalOpen(true);
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setIsAdmin(false);
    setSelectedUser(null);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="admin-container">
      {/* Header */}
      <div className="admin-header-row">
        <div className="admin-title-group">
          <h2 className="admin-title">User Management Panel</h2>
          <p className="admin-subtitle">Add new members, reset passwords, and manage administrative privileges.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn" onClick={onBackToBoard}>
            ← Back to Board
          </button>
          <button className="btn btn-primary" onClick={openAddModal}>
            ➕ Add User
          </button>
        </div>
      </div>

      {error && (
        <div style={{ color: 'var(--priority-high-text)', backgroundColor: 'var(--priority-high-bg)', padding: '1rem', borderRadius: 'var(--border-radius-md)' }}>
          ⚠️ {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '3rem' }}>
          Loading user records...
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Created Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td style={{ fontWeight: '500' }}>
                      {user.email} {user.id === currentUser.id && <span style={{ opacity: 0.6, fontSize: '0.8rem' }}>(You)</span>}
                    </td>
                    <td>
                      <span className={`admin-badge ${user.isAdmin ? 'admin-badge-admin' : ''}`}>
                        {user.isAdmin ? 'Administrator' : 'User'}
                      </span>
                    </td>
                    <td>{formatDate(user.createdAt)}</td>
                    <td className="admin-actions-cell">
                      <button className="btn" style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem' }} onClick={() => openEditModal(user)}>
                        ✏️ Edit / Reset
                      </button>
                      <button 
                        className="btn" 
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem', color: 'var(--priority-high-text)' }}
                        disabled={user.id === currentUser.id}
                        onClick={() => handleDeleteUser(user.id, user.email)}
                      >
                        🗑️ Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile User List View */}
          <div className="mobile-user-list">
            {users.map((user) => (
              <div className="mobile-user-card" key={user.id}>
                <div className="mobile-user-header">
                  <span className="mobile-user-email">
                    {user.email} {user.id === currentUser.id && <span style={{ opacity: 0.6 }}>(You)</span>}
                  </span>
                  <span className={`admin-badge ${user.isAdmin ? 'admin-badge-admin' : ''}`}>
                    {user.isAdmin ? 'Admin' : 'User'}
                  </span>
                </div>
                
                <div className="mobile-user-row">
                  <span className="mobile-user-label">Created At</span>
                  <span className="mobile-user-value">{formatDate(user.createdAt)}</span>
                </div>

                <div className="mobile-user-actions">
                  <button className="btn" style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem' }} onClick={() => openEditModal(user)}>
                    ✏️ Edit
                  </button>
                  <button 
                    className="btn" 
                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem', color: 'var(--priority-high-text)' }}
                    disabled={user.id === currentUser.id}
                    onClick={() => handleDeleteUser(user.id, user.email)}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Add User Modal */}
      {isAddModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Create New User Account</h2>
              <button className="btn btn-text btn-icon" onClick={() => setIsAddModalOpen(false)}>
                ✕
              </button>
            </div>
            
            <form onSubmit={handleAddUser} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {modalError && <div style={{ color: 'var(--priority-high-text)', fontSize: '0.85rem' }}>{modalError}</div>}
              
              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="e.g. member@kanban.local"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Create temporary password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                <input
                  id="add-is-admin"
                  type="checkbox"
                  checked={isAdmin}
                  onChange={(e) => setIsAdmin(e.target.checked)}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <label htmlFor="add-is-admin" style={{ cursor: 'pointer' }}>Grant System Administrator Privileges</label>
              </div>

              <div className="modal-actions" style={{ marginTop: '0.5rem' }}>
                <button type="button" className="btn" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit / Reset Password User Modal */}
      {isEditModalOpen && (
        <div className="modal-overlay" onClick={() => setIsEditModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Edit User Account</h2>
              <button className="btn btn-text btn-icon" onClick={() => setIsEditModalOpen(false)}>
                ✕
              </button>
            </div>
            
            <form onSubmit={handleEditUser} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {modalError && <div style={{ color: 'var(--priority-high-text)', fontSize: '0.85rem' }}>{modalError}</div>}
              
              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  className="form-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label>Reset Password (leave blank to keep unchanged)</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                <input
                  id="edit-is-admin"
                  type="checkbox"
                  checked={isAdmin}
                  disabled={selectedUser?.id === currentUser.id}
                  onChange={(e) => setIsAdmin(e.target.checked)}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <label htmlFor="edit-is-admin" style={{ cursor: 'pointer', opacity: selectedUser?.id === currentUser.id ? 0.6 : 1 }}>
                  Grant System Administrator Privileges
                </label>
              </div>

              <div className="modal-actions" style={{ marginTop: '0.5rem' }}>
                <button type="button" className="btn" onClick={() => setIsEditModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
