import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  FlatList, 
  ActivityIndicator
} from 'react-native';

// Components
import TaskCard from './TaskCard';

export default function BoardScreen({
  tasks,
  isOnline,
  syncing,
  syncQueueCount,
  onSyncNow,
  onEditTask,
  onDeleteTask,
  onMoveTask,
  onAddTask,
  onLogout
}) {
  const [activeTab, setActiveTab] = useState('todo'); // 'todo', 'in-progress', 'done'

  // Filter lists
  const todoTasks = tasks.filter(t => t.status === 'todo');
  const inProgressTasks = tasks.filter(t => t.status === 'in-progress');
  const doneTasks = tasks.filter(t => t.status === 'done');

  const getActiveTasksList = () => {
    switch (activeTab) {
      case 'todo': return todoTasks;
      case 'in-progress': return inProgressTasks;
      case 'done': return doneTasks;
      default: return [];
    }
  };

  const getEmptyMessage = () => {
    switch (activeTab) {
      case 'todo': return 'No pending tasks! Time to relax or create a new one.';
      case 'in-progress': return 'No tasks in progress. Pick something from To Do!';
      case 'done': return 'Keep going! Completed tasks will appear here.';
      default: return 'No tasks found.';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header Bar */}
      <View style={styles.header}>
        <View>
          <Text style={styles.logo}>📋 KanbanFlow</Text>
          {/* Connection Status indicator */}
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: isOnline ? '#10b981' : '#f59e0b' }]} />
            <Text style={styles.statusText}>
              {isOnline ? 'Online Synced' : 'Local Offline'}
              {syncQueueCount > 0 ? ` (${syncQueueCount} pending)` : ''}
            </Text>
          </View>
        </View>
        
        <View style={styles.headerActions}>
          {/* Sync Button */}
          <TouchableOpacity 
            style={styles.syncBtn} 
            onPress={onSyncNow}
            disabled={syncing}
          >
            {syncing ? (
              <ActivityIndicator color="#6366f1" size="small" />
            ) : (
              <Text style={styles.syncBtnText}>🔄 Sync</Text>
            )}
          </TouchableOpacity>
          
          {/* Logout */}
          <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
            <Text style={styles.logoutBtnText}>👋 Exit</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'todo' && styles.tabActiveTodo]}
          onPress={() => setActiveTab('todo')}
        >
          <Text style={[styles.tabText, activeTab === 'todo' && styles.tabTextActive]}>To Do</Text>
          <Text style={styles.tabCount}>({todoTasks.length})</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'in-progress' && styles.tabActiveInProgress]}
          onPress={() => setActiveTab('in-progress')}
        >
          <Text style={[styles.tabText, activeTab === 'in-progress' && styles.tabTextActive]}>In Progress</Text>
          <Text style={styles.tabCount}>({inProgressTasks.length})</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'done' && styles.tabActiveDone]}
          onPress={() => setActiveTab('done')}
        >
          <Text style={[styles.tabText, activeTab === 'done' && styles.tabTextActive]}>Done</Text>
          <Text style={styles.tabCount}>({doneTasks.length})</Text>
        </TouchableOpacity>
      </View>

      {/* Tasks List */}
      <FlatList
        data={getActiveTasksList()}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TaskCard
            task={item}
            onEdit={onEditTask}
            onDelete={onDeleteTask}
            onMoveTask={onMoveTask}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🏖️</Text>
            <Text style={styles.emptyText}>{getEmptyMessage()}</Text>
          </View>
        }
      />

      {/* Floating Add Task Button */}
      <TouchableOpacity style={styles.fab} onPress={onAddTask}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0f19',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: '#111827',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  logo: {
    fontSize: 18,
    fontWeight: '800',
    color: '#f9fafb',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#9ca3af',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  syncBtn: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 65,
    alignItems: 'center',
    justifyContent: 'center',
  },
  syncBtnText: {
    color: '#6366f1',
    fontSize: 12,
    fontWeight: '600',
  },
  logoutBtn: {
    backgroundColor: '#1f2937',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  logoutBtnText: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: '600',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#111827',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    padding: 4,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    gap: 3,
  },
  tabActiveTodo: {
    backgroundColor: '#1f2937',
    borderBottomWidth: 2,
    borderBottomColor: '#6366f1',
  },
  tabActiveInProgress: {
    backgroundColor: '#1f2937',
    borderBottomWidth: 2,
    borderBottomColor: '#f59e0b',
  },
  tabActiveDone: {
    backgroundColor: '#1f2937',
    borderBottomWidth: 2,
    borderBottomColor: '#10b981',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9ca3af',
  },
  tabTextActive: {
    color: '#f9fafb',
  },
  tabCount: {
    fontSize: 10,
    color: '#6b7280',
    fontWeight: '500',
  },
  listContent: {
    padding: 12,
    paddingBottom: 85, // prevent FAB overlap
    gap: 10,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 20,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.01)',
  },
  emptyIcon: {
    fontSize: 30,
    marginBottom: 10,
  },
  emptyText: {
    color: '#6b7280',
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 18,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
  },
  fabText: {
    fontSize: 28,
    color: '#ffffff',
    fontWeight: '300',
    lineHeight: Platform => Platform.OS === 'ios' ? 28 : 32, // slight offset check
  },
});
