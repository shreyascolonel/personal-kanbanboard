import React, { useState, useEffect, useCallback } from 'react';
import { 
  StyleSheet, 
  SafeAreaView, 
  View, 
  ActivityIndicator, 
  Text, 
  Alert,
  StatusBar
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';

// Configure expo-notifications to handle alerts
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Components
import LoginScreen from './components/LoginScreen';
import BoardScreen from './components/BoardScreen';
import TaskModal from './components/TaskModal';

export default function App() {
  // Session & Server States
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [serverUrl, setServerUrl] = useState('');
  const [authChecking, setAuthChecking] = useState(true);
  const [currentScreen, setCurrentScreen] = useState('login'); // 'login', 'board'

  // Task & Sync States
  const [tasks, setTasks] = useState([]);
  const [syncQueue, setSyncQueue] = useState([]);
  const [isOnline, setIsOnline] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  // ----------------------------------------------------
  // INITIAL DATA LIFECYCLE
  // ----------------------------------------------------
  useEffect(() => {
    loadLocalSession();
    requestNotificationPermissions();
  }, []);

  const requestNotificationPermissions = async () => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        console.log('Local notifications permission denied');
      }
    } catch (e) {
      console.warn('Error checking/requesting notifications permission:', e);
    }
  };

  const scheduleTaskNotifications = async (tasksList) => {
    try {
      // 1. Cancel all scheduled notifications to avoid duplicates/orphans
      await Notifications.cancelAllScheduledNotificationsAsync();

      // 2. Loop and schedule for each active task with a due date
      for (const task of tasksList) {
        if (task.status === 'done' || !task.dueDate) continue;

        const due = new Date(task.dueDate + 'T09:00:00'); // 9 AM local time on due date
        if (isNaN(due.getTime())) continue;

        // 24 hours before due date
        const notifyTime = new Date(due.getTime() - 24 * 60 * 60 * 1000);
        const now = new Date();

        if (notifyTime > now) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: `Task Deadline Approaching! ⏳`,
              body: `"${task.title}" is due tomorrow at 9:00 AM.`,
              data: { taskId: task.id },
            },
            trigger: notifyTime,
          });
        }
      }
    } catch (err) {
      console.warn('Failed to schedule local notifications:', err);
    }
  };

  // Synchronise notifications whenever tasks change
  useEffect(() => {
    scheduleTaskNotifications(tasks);
  }, [tasks]);

  const loadLocalSession = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('token');
      const storedUser = await AsyncStorage.getItem('user');
      const storedUrl = await AsyncStorage.getItem('serverUrl');
      const storedTasks = await AsyncStorage.getItem('tasks');
      const storedQueue = await AsyncStorage.getItem('syncQueue');

      if (storedUrl) setServerUrl(storedUrl);
      if (storedTasks) setTasks(JSON.parse(storedTasks));
      if (storedQueue) setSyncQueue(JSON.parse(storedQueue));

      if (storedToken && storedUser && storedUrl) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        setCurrentScreen('board');
        // Instantly run sync verification
        triggerSync(storedToken, JSON.parse(storedUser), storedUrl, JSON.parse(storedQueue) || []);
      } else {
        setCurrentScreen('login');
      }
    } catch (err) {
      console.warn('Failed to load AsyncStorage session:', err);
    } finally {
      setAuthChecking(false);
    }
  };

  // ----------------------------------------------------
  // OFFLINE-FIRST SYNC ENGINE
  // ----------------------------------------------------
  const triggerSync = async (
    activeToken = token, 
    activeUser = user, 
    activeUrl = serverUrl, 
    activeQueue = syncQueue
  ) => {
    if (!activeToken || !activeUrl) return;
    
    setSyncing(true);
    try {
      // 1. Connection Ping test
      const pingResponse = await fetch(`${activeUrl}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${activeToken}` },
        signal: AbortController ? new AbortController().signal : null // optional abort
      });

      if (!pingResponse.ok) {
        throw new Error('Connection rejected by server');
      }

      setIsOnline(true);

      // 2. Process Sync Outbox (Local Queue)
      let currentLocalTasks = [...tasks];
      const localTasksData = await AsyncStorage.getItem('tasks');
      if (localTasksData) {
        currentLocalTasks = JSON.parse(localTasksData);
      }

      let updatedQueue = [...activeQueue];

      if (activeQueue.length > 0) {
        // Sequentially execute queue items to preserve operational order
        for (const item of activeQueue) {
          try {
            if (item.type === 'create') {
              const res = await fetch(`${activeUrl}/api/tasks`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${activeToken}`
                },
                body: JSON.stringify({
                  title: item.data.title,
                  description: item.data.description,
                  status: item.data.status,
                  priority: item.data.priority,
                  dueDate: item.data.dueDate
                })
              });

              if (res.ok) {
                const serverTask = await res.json();
                // Map local temporary ID to the real server ID in local list
                currentLocalTasks = currentLocalTasks.map(t => 
                  t.id === item.id ? serverTask : t
                );
              }
            } else if (item.type === 'update') {
              // Ignore if it's a temporary task that failed creation earlier
              if (item.id.startsWith('local-')) continue;

              await fetch(`${activeUrl}/api/tasks/${item.id}`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${activeToken}`
                },
                body: JSON.stringify(item.data)
              });
            } else if (item.type === 'delete') {
              if (item.id.startsWith('local-')) continue;

              await fetch(`${activeUrl}/api/tasks/${item.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${activeToken}` }
              });
            }
          } catch (err) {
            console.warn(`Sync queue item action failed for task ${item.id}:`, err.message);
            // Leave in queue to retry later
            continue;
          }
        }

        // Wipe successful queue items (for simplicity we clear all, or filter failed ones)
        updatedQueue = [];
        await AsyncStorage.setItem('syncQueue', JSON.stringify([]));
        setSyncQueue([]);
      }

      // 3. Pull Server Tasks
      const pullResponse = await fetch(`${activeUrl}/api/tasks`, {
        headers: { 'Authorization': `Bearer ${activeToken}` }
      });

      if (pullResponse.ok) {
        const freshServerTasks = await pullResponse.json();
        setTasks(freshServerTasks);
        await AsyncStorage.setItem('tasks', JSON.stringify(freshServerTasks));
      } else {
        // Fallback to local tasks list if pull fails
        setTasks(currentLocalTasks);
        await AsyncStorage.setItem('tasks', JSON.stringify(currentLocalTasks));
      }

    } catch (err) {
      console.warn('Sync connection offline:', err.message);
      setIsOnline(false);
    } finally {
      setSyncing(false);
    }
  };

  // Automated Ping polling every 15 seconds to sync when user is on home network
  useEffect(() => {
    if (currentScreen !== 'board' || !token || !serverUrl) return;

    const interval = setInterval(() => {
      triggerSync(token, user, serverUrl, syncQueue);
    }, 15000);

    return () => clearInterval(interval);
  }, [currentScreen, token, serverUrl, syncQueue, tasks]);

  // ----------------------------------------------------
  // AUTHENTICATION HANDLERS
  // ----------------------------------------------------
  const handleLogin = async (email, password, url) => {
    // Normalise URL input
    let formattedUrl = url.trim().replace(/\/+$/, ""); // Strip trailing slashes
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = 'http://' + formattedUrl;
    }

    try {
      const response = await fetch(`${formattedUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Connection rejected');
      }

      // Persist Session
      await AsyncStorage.setItem('token', data.token);
      await AsyncStorage.setItem('user', JSON.stringify(data.user));
      await AsyncStorage.setItem('serverUrl', formattedUrl);

      setToken(data.token);
      setUser(data.user);
      setServerUrl(formattedUrl);
      setCurrentScreen('board');

      // Boot up Sync Engine
      triggerSync(data.token, data.user, formattedUrl, []);
    } catch (err) {
      Alert.alert('Login Error', err.message || 'Could not connect to homeserver. Verify address & Wi-Fi.');
      throw err;
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('serverUrl');
      await AsyncStorage.removeItem('tasks');
      await AsyncStorage.removeItem('syncQueue');

      setToken(null);
      setUser(null);
      setServerUrl('');
      setTasks([]);
      setSyncQueue([]);
      setIsOnline(false);
      setCurrentScreen('login');
    } catch (err) {
      console.error(err);
    }
  };

  // ----------------------------------------------------
  // TASK CRUD CONTROLS (OFFLINE-FIRST HYBRID)
  // ----------------------------------------------------
  const handleSaveTask = async (taskData) => {
    const isEdit = !!taskData.id;
    const tempId = isEdit ? taskData.id : 'local-' + Date.now();

    // 1. Perform Local State & Cache Update (snappy native feel)
    let updatedTasksList;
    let oldTasksList = [...tasks];

    if (!isEdit) {
      const newTask = {
        ...taskData,
        id: tempId,
        userId: user.id,
        createdAt: new Date().toISOString()
      };
      updatedTasksList = [...tasks, newTask];
    } else {
      updatedTasksList = tasks.map(t => t.id === tempId ? { ...t, ...taskData } : t);
    }

    setTasks(updatedTasksList);
    await AsyncStorage.setItem('tasks', JSON.stringify(updatedTasksList));
    setIsModalOpen(false);

    // 2. Sync attempt or queue locally if offline
    if (isOnline) {
      try {
        const url = isEdit ? `${serverUrl}/api/tasks/${tempId}` : `${serverUrl}/api/tasks`;
        const method = isEdit ? 'PUT' : 'POST';

        const res = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(taskData)
        });

        const serverObj = await res.json();
        if (!res.ok) throw new Error(serverObj.error || 'Server error');

        if (!isEdit) {
          // Swap temp ID for Server ID
          const syncCleanedTasks = updatedTasksList.map(t => t.id === tempId ? serverObj : t);
          setTasks(syncCleanedTasks);
          await AsyncStorage.setItem('tasks', JSON.stringify(syncCleanedTasks));
        }
        return; // Success, no queue needed!
      } catch (err) {
        console.warn('Instant save push failed, queuing change locally:', err.message);
      }
    }

    // 3. Offline Outbox queueing fallback
    let updatedQueue = [...syncQueue];
    if (!isEdit) {
      const targetTask = updatedTasksList.find(t => t.id === tempId);
      updatedQueue.push({ type: 'create', id: tempId, data: targetTask });
    } else {
      if (tempId.startsWith('local-')) {
        // If it's a temporary task, update its matching 'create' record directly in queue
        updatedQueue = updatedQueue.map(item => 
          item.id === tempId ? { ...item, data: { ...item.data, ...taskData } } : item
        );
      } else {
        // If it's an existing server task, update current queue or push update item
        const existingUpdateIndex = updatedQueue.findIndex(item => item.id === tempId && item.type === 'update');
        if (existingUpdateIndex !== -1) {
          updatedQueue[existingUpdateIndex].data = { ...updatedQueue[existingUpdateIndex].data, ...taskData };
        } else {
          updatedQueue.push({ type: 'update', id: tempId, data: taskData });
        }
      }
    }

    setSyncQueue(updatedQueue);
    await AsyncStorage.setItem('syncQueue', JSON.stringify(updatedQueue));
  };

  const handleDeleteTask = async (taskId) => {
    // 1. Local State Update
    const oldTasksList = [...tasks];
    const updatedTasksList = tasks.filter(t => t.id !== taskId);
    setTasks(updatedTasksList);
    await AsyncStorage.setItem('tasks', JSON.stringify(updatedTasksList));

    // 2. Server sync attempt
    if (isOnline && !taskId.startsWith('local-')) {
      try {
        const res = await fetch(`${serverUrl}/api/tasks/${taskId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) return; // Sync success!
      } catch (err) {
        console.warn('Instant delete failed, queuing locally:', err.message);
      }
    }

    // 3. Offline outbox queueing fallback
    let updatedQueue = [...syncQueue];
    if (taskId.startsWith('local-')) {
      // If it was a temporary task that hasn't synced yet, simply wipe it from queue!
      updatedQueue = updatedQueue.filter(item => item.id !== taskId);
    } else {
      // Wipe any existing update mutations, and push a delete mutation
      updatedQueue = updatedQueue.filter(item => !(item.id === taskId && item.type === 'update'));
      updatedQueue.push({ type: 'delete', id: taskId });
    }

    setSyncQueue(updatedQueue);
    await AsyncStorage.setItem('syncQueue', JSON.stringify(updatedQueue));
  };

  const handleMoveTask = async (taskId, newStatus) => {
    // 1. Local Update
    const oldTasksList = [...tasks];
    const updatedTasksList = tasks.map(t => 
      t.id === taskId ? { ...t, status: newStatus } : t
    );
    setTasks(updatedTasksList);
    await AsyncStorage.setItem('tasks', JSON.stringify(updatedTasksList));

    // 2. Server sync attempt
    if (isOnline && !taskId.startsWith('local-')) {
      try {
        const res = await fetch(`${serverUrl}/api/tasks/${taskId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ status: newStatus })
        });
        if (res.ok) return;
      } catch (err) {
        console.warn('Instant status update failed, queuing locally:', err.message);
      }
    }

    // 3. Offline queueing fallback
    let updatedQueue = [...syncQueue];
    if (taskId.startsWith('local-')) {
      updatedQueue = updatedQueue.map(item => 
        item.id === taskId ? { ...item, data: { ...item.data, status: newStatus } } : item
      );
    } else {
      const existingUpdateIndex = updatedQueue.findIndex(item => item.id === taskId && item.type === 'update');
      if (existingUpdateIndex !== -1) {
        updatedQueue[existingUpdateIndex].data.status = newStatus;
      } else {
        updatedQueue.push({ type: 'update', id: taskId, data: { status: newStatus } });
      }
    }

    setSyncQueue(updatedQueue);
    await AsyncStorage.setItem('syncQueue', JSON.stringify(updatedQueue));
  };

  const openAddTaskModal = () => {
    setEditingTask(null);
    setIsModalOpen(true);
  };

  const openEditTaskModal = (task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  // ----------------------------------------------------
  // VIEWS RENDERER
  // ----------------------------------------------------
  if (authChecking) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#0b0f19" />
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Initializing database...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.appContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#111827" />
      <ExpoStatusBar style="light" />

      {currentScreen === 'login' || !user ? (
        <LoginScreen onLogin={handleLogin} />
      ) : (
        <BoardScreen
          tasks={tasks}
          isOnline={isOnline}
          syncing={syncing}
          syncQueueCount={syncQueue.length}
          onSyncNow={() => triggerSync(token, user, serverUrl, syncQueue)}
          onEditTask={openEditTaskModal}
          onDeleteTask={handleDeleteTask}
          onMoveTask={handleMoveTask}
          onAddTask={openAddTaskModal}
          onLogout={handleLogout}
        />
      )}

      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveTask}
        task={editingTask}
        currentUser={user}
        token={token}
        serverUrl={serverUrl}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0b0f19',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#9ca3af',
    marginTop: 15,
    fontSize: 15,
    fontWeight: '500',
  },
  appContainer: {
    flex: 1,
    backgroundColor: '#0b0f19',
  },
});
