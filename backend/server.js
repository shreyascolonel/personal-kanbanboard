const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Set up directory path for persistent files (Docker volume vs local fallback)
const DATA_DIR = fs.existsSync('/data') ? '/data' : __dirname;
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const TASKS_FILE = path.join(DATA_DIR, 'tasks.json');
const SECRET_FILE = path.join(DATA_DIR, 'jwt.secret');

// Load or generate persistent JWT Secret
let JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  if (fs.existsSync(SECRET_FILE)) {
    JWT_SECRET = fs.readFileSync(SECRET_FILE, 'utf8').trim();
  } else {
    JWT_SECRET = crypto.randomBytes(32).toString('hex');
    try {
      fs.writeFileSync(SECRET_FILE, JWT_SECRET, 'utf8');
    } catch (err) {
      console.error('Warning: could not write jwt.secret, using memory fallback:', err);
    }
  }
}

// ----------------------------------------------------
// DATABASE INITIALIZATION & ACCESS HELPERS
// ----------------------------------------------------

// Safe user reading
function readUsers() {
  try {
    if (!fs.existsSync(USERS_FILE)) {
      // Seed initial admin user if empty
      const salt = bcrypt.genSaltSync(10);
      const passwordHash = bcrypt.hashSync('admin', salt);
      const defaultAdmin = [
        {
          id: 'user-admin',
          email: 'admin@kanban.local',
          passwordHash,
          isAdmin: true,
          createdAt: new Date().toISOString()
        }
      ];
      fs.writeFileSync(USERS_FILE, JSON.stringify(defaultAdmin, null, 2), 'utf8');
      return defaultAdmin;
    }
    const raw = fs.readFileSync(USERS_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    console.error('Error reading users database:', error);
    return [];
  }
}

// Safe user writing
function writeUsers(users) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error writing users database:', error);
    return false;
  }
}

// Safe task reading
function readTasks() {
  try {
    if (!fs.existsSync(TASKS_FILE)) {
      // Seed default tasks assigned to the seed admin
      const defaultTasks = [
        {
          id: 'sample-1',
          userId: 'user-admin',
          title: 'Welcome to your Kanban Board! 🚀',
          description: 'This is a simple, no-fuss Kanban board. You can use it to track your to-do list, project tasks, or personal chores.',
          status: 'todo',
          priority: 'low',
          dueDate: '',
          createdAt: new Date().toISOString()
        },
        {
          id: 'sample-2',
          userId: 'user-admin',
          title: 'Mobile & Tablet Friendly UI 📱',
          description: 'Try opening this app on your phone or tablet! On mobile screens, use the beautiful column tabs at the top to slide between lists, and use the quick arrow buttons on cards to move tasks between lists without drag-and-drop fuss.',
          status: 'in-progress',
          priority: 'medium',
          dueDate: '',
          createdAt: new Date().toISOString()
        },
        {
          id: 'sample-3',
          userId: 'user-admin',
          title: 'Deploy to your Home Server 🏠',
          description: 'This application runs in a single Docker container. You can host it on your homeserver and log in from multiple devices. Your tasks are isolated per-user!',
          status: 'done',
          priority: 'high',
          dueDate: '',
          createdAt: new Date().toISOString()
        }
      ];
      fs.writeFileSync(TASKS_FILE, JSON.stringify(defaultTasks, null, 2), 'utf8');
      return defaultTasks;
    }
    const raw = fs.readFileSync(TASKS_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    console.error('Error reading tasks database:', error);
    return [];
  }
}

// Safe task writing
function writeTasks(tasks) {
  try {
    fs.writeFileSync(TASKS_FILE, JSON.stringify(tasks, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error writing tasks database:', error);
    return false;
  }
}

// Initialize Databases
readUsers();
readTasks();

// ----------------------------------------------------
// AUTHENTICATION MIDDLEWARES
// ----------------------------------------------------

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ error: 'Access token missing' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = decoded;
    next();
  });
}

function requireAdmin(req, res, next) {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ error: 'Administrative access required' });
  }
  next();
}

// ----------------------------------------------------
// AUTHENTICATION ROUTES
// ----------------------------------------------------

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const users = readUsers();
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    return res.status(400).json({ error: 'Invalid email or password' });
  }

  // Sign Token
  const token = jwt.sign(
    { id: user.id, email: user.email, isAdmin: user.isAdmin },
    JWT_SECRET,
    { expiresIn: '30d' } // Long-lasting logins for home servers
  );

  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      isAdmin: user.isAdmin
    }
  });
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

// ----------------------------------------------------
// TASK ROUTES (SCOPED PER USER)
// ----------------------------------------------------

app.get('/api/tasks', authenticateToken, (req, res) => {
  const tasks = readTasks();
  const userTasks = tasks.filter(t => t.userId === req.user.id);
  res.json(userTasks);
});

app.post('/api/tasks', authenticateToken, (req, res) => {
  const { title, description, status, priority, dueDate } = req.body;
  
  if (!title) {
    return res.status(400).json({ error: 'Task title is required' });
  }

  const tasks = readTasks();
  const newTask = {
    id: 'task-' + crypto.randomBytes(6).toString('hex'),
    userId: req.user.id,
    title,
    description: description || '',
    status: status || 'todo',
    priority: priority || 'low',
    dueDate: dueDate || '',
    createdAt: new Date().toISOString()
  };

  tasks.push(newTask);
  const success = writeTasks(tasks);

  if (success) {
    res.status(201).json(newTask);
  } else {
    res.status(500).json({ error: 'Failed to save task' });
  }
});

app.put('/api/tasks/:id', authenticateToken, (req, res) => {
  const taskId = req.params.id;
  const { title, description, status, priority, dueDate } = req.body;

  const tasks = readTasks();
  const taskIndex = tasks.findIndex(t => t.id === taskId);

  if (taskIndex === -1) {
    return res.status(404).json({ error: 'Task not found' });
  }

  // Security Scoping: Verify task ownership
  if (tasks[taskIndex].userId !== req.user.id) {
    return res.status(403).json({ error: 'Unauthorized to edit this task' });
  }

  // Update allowed fields
  if (title !== undefined) tasks[taskIndex].title = title;
  if (description !== undefined) tasks[taskIndex].description = description;
  if (status !== undefined) tasks[taskIndex].status = status;
  if (priority !== undefined) tasks[taskIndex].priority = priority;
  if (dueDate !== undefined) tasks[taskIndex].dueDate = dueDate;

  const success = writeTasks(tasks);
  if (success) {
    res.json(tasks[taskIndex]);
  } else {
    res.status(500).json({ error: 'Failed to update task' });
  }
});

app.delete('/api/tasks/:id', authenticateToken, (req, res) => {
  const taskId = req.params.id;
  const tasks = readTasks();
  const taskIndex = tasks.findIndex(t => t.id === taskId);

  if (taskIndex === -1) {
    return res.status(404).json({ error: 'Task not found' });
  }

  // Security Scoping: Verify task ownership
  if (tasks[taskIndex].userId !== req.user.id) {
    return res.status(403).json({ error: 'Unauthorized to delete this task' });
  }

  tasks.splice(taskIndex, 1);
  const success = writeTasks(tasks);

  if (success) {
    res.json({ success: true, message: 'Task deleted successfully' });
  } else {
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// ----------------------------------------------------
// ADMINISTRATIVE USER MANAGEMENT ROUTES
// ----------------------------------------------------

app.get('/api/admin/users', authenticateToken, requireAdmin, (req, res) => {
  const users = readUsers();
  // Strip password hashes from response
  const sanitizedUsers = users.map(u => ({
    id: u.id,
    email: u.email,
    isAdmin: u.isAdmin,
    createdAt: u.createdAt
  }));
  res.json(sanitizedUsers);
});

app.post('/api/admin/users', authenticateToken, requireAdmin, (req, res) => {
  const { email, password, isAdmin } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const users = readUsers();
  if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(400).json({ error: 'User with this email already exists' });
  }

  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(password, salt);

  const newUser = {
    id: 'user-' + crypto.randomBytes(6).toString('hex'),
    email: email.toLowerCase(),
    passwordHash,
    isAdmin: !!isAdmin,
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  const success = writeUsers(users);

  if (success) {
    res.status(201).json({
      id: newUser.id,
      email: newUser.email,
      isAdmin: newUser.isAdmin,
      createdAt: newUser.createdAt
    });
  } else {
    res.status(500).json({ error: 'Failed to create user' });
  }
});

app.put('/api/admin/users/:id', authenticateToken, requireAdmin, (req, res) => {
  const userId = req.params.id;
  const { email, password, isAdmin } = req.body;

  const users = readUsers();
  const userIndex = users.findIndex(u => u.id === userId);

  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Sanity Check: Cannot change admin status for self
  if (userId === req.user.id && isAdmin !== undefined && isAdmin !== users[userIndex].isAdmin) {
    return res.status(400).json({ error: 'Cannot revoke your own administrator privileges' });
  }

  if (email !== undefined) {
    const emailLower = email.toLowerCase();
    if (emailLower !== users[userIndex].email && users.some(u => u.email.toLowerCase() === emailLower)) {
      return res.status(400).json({ error: 'Email already in use by another account' });
    }
    users[userIndex].email = emailLower;
  }

  if (isAdmin !== undefined) {
    users[userIndex].isAdmin = !!isAdmin;
  }

  if (password) {
    const salt = bcrypt.genSaltSync(10);
    users[userIndex].passwordHash = bcrypt.hashSync(password, salt);
  }

  const success = writeUsers(users);
  if (success) {
    res.json({
      id: users[userIndex].id,
      email: users[userIndex].email,
      isAdmin: users[userIndex].isAdmin,
      createdAt: users[userIndex].createdAt
    });
  } else {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

app.delete('/api/admin/users/:id', authenticateToken, requireAdmin, (req, res) => {
  const userId = req.params.id;

  // Sanity Check: Cannot delete yourself!
  if (userId === req.user.id) {
    return res.status(400).json({ error: 'Cannot delete your own administrative account' });
  }

  const users = readUsers();
  const userIndex = users.findIndex(u => u.id === userId);

  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Remove the user
  users.splice(userIndex, 1);
  const successUsers = writeUsers(users);

  if (!successUsers) {
    return res.status(500).json({ error: 'Failed to delete user' });
  }

  // Data Hygiene: Delete all tasks belonging to the deleted user
  const tasks = readTasks();
  const filteredTasks = tasks.filter(t => t.userId !== userId);
  const successTasks = writeTasks(filteredTasks);

  res.json({
    success: true,
    message: 'User deleted and tasks cleaned up successfully'
  });
});

// ----------------------------------------------------
// FRONTEND STATIC SERVING
// ----------------------------------------------------

const PUBLIC_DIR = path.join(__dirname, 'public');
if (fs.existsSync(PUBLIC_DIR)) {
  app.use(express.static(PUBLIC_DIR));
  app.get('*', (req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.send('Kanban Backend API is running! Start the frontend development server to access the UI.');
  });
}

app.listen(PORT, () => {
  console.log(`===================================================`);
  console.log(` Multi-User Kanban Server listening on port ${PORT}`);
  console.log(` Database: ${USERS_FILE} & ${TASKS_FILE}`);
  console.log(` Persistent JWT Secret: ${SECRET_FILE ? 'Loaded' : 'Generated'}`);
  console.log(` Initial Admin: admin@kanban.local / admin`);
  console.log(`===================================================`);
});
