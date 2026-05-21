import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  FlatList, 
  ActivityIndicator,
  TextInput,
  ScrollView
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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState(null);

  // Extract all unique tags present in the tasks list
  const allTags = Array.from(
    new Set(
      tasks.reduce((acc, t) => {
        if (t.tags && Array.isArray(t.tags)) {
          t.tags.forEach(tag => {
            if (tag && tag.trim()) acc.push(tag.trim());
          });
        }
        return acc;
      }, [])
    )
  );

  // Apply search query and tag filters
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = searchQuery.trim() === '' || 
      (task.title && task.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesTag = !selectedTag || 
      (task.tags && Array.isArray(task.tags) && task.tags.includes(selectedTag));

    return matchesSearch && matchesTag;
  });

  // Filter lists based on the filtered set
  const todoTasks = filteredTasks.filter(t => t.status === 'todo');
  const inProgressTasks = filteredTasks.filter(t => t.status === 'in-progress');
  const doneTasks = filteredTasks.filter(t => t.status === 'done');

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

      {/* Search & Tag Filters Container */}
      <View style={styles.filterSection}>
        <View style={styles.searchBarContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search tasks..."
            placeholderTextColor="#6b7280"
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearBtn}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {allTags.length > 0 && (
          <View style={styles.tagsContainer}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tagsScrollContent}
            >
              <TouchableOpacity
                style={[
                  styles.tagChip,
                  !selectedTag && styles.tagChipActive
                ]}
                onPress={() => setSelectedTag(null)}
              >
                <Text style={[
                  styles.tagChipText,
                  !selectedTag && styles.tagChipTextActive
                ]}>All</Text>
              </TouchableOpacity>

              {allTags.map((tag) => {
                const isActive = selectedTag === tag;
                let charSum = 0;
                for (let c = 0; c < tag.length; c++) charSum += tag.charCodeAt(c);
                const tagColorIndex = charSum % 6;

                return (
                  <TouchableOpacity
                    key={tag}
                    style={[
                      styles.tagChip,
                      isActive && styles.tagChipActive,
                      isActive && styles[`tagChipActiveColor${tagColorIndex}`]
                    ]}
                    onPress={() => setSelectedTag(isActive ? null : tag)}
                  >
                    <Text style={[
                      styles.tagChipText,
                      isActive && styles.tagChipTextActive
                    ]}>
                      🏷️ {tag}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}
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
  filterSection: {
    backgroundColor: '#111827',
    paddingHorizontal: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1f2937',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 38,
    marginBottom: 8,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    color: '#f9fafb',
    fontSize: 14,
    paddingVertical: 0,
  },
  clearBtn: {
    padding: 4,
  },
  clearIcon: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: '600',
  },
  tagsContainer: {
    height: 32,
    justifyContent: 'center',
  },
  tagsScrollContent: {
    alignItems: 'center',
    gap: 6,
    paddingRight: 10,
  },
  tagChip: {
    backgroundColor: '#1f2937',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
    height: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagChipActive: {
    borderColor: '#6366f1',
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
  },
  tagChipText: {
    color: '#9ca3af',
    fontSize: 11,
    fontWeight: '600',
  },
  tagChipTextActive: {
    color: '#ffffff',
  },
  tagChipActiveColor0: { backgroundColor: 'rgba(59, 130, 246, 0.25)', borderColor: '#3b82f6' },
  tagChipActiveColor1: { backgroundColor: 'rgba(16, 185, 129, 0.25)', borderColor: '#10b981' },
  tagChipActiveColor2: { backgroundColor: 'rgba(245, 158, 11, 0.25)', borderColor: '#f59e0b' },
  tagChipActiveColor3: { backgroundColor: 'rgba(139, 92, 246, 0.25)', borderColor: '#8b5cf6' },
  tagChipActiveColor4: { backgroundColor: 'rgba(236, 72, 153, 0.25)', borderColor: '#ec4899' },
  tagChipActiveColor5: { backgroundColor: 'rgba(20, 184, 166, 0.25)', borderColor: '#14b8a6' },
});
