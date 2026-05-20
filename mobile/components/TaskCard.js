import React from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  Alert 
} from 'react-native';

export default function TaskCard({ task, onEdit, onDelete, onMoveTask }) {
  const getPriorityStyle = () => {
    switch (task.priority) {
      case 'high':
        return { bg: 'rgba(239, 68, 68, 0.1)', text: '#ef4444' };
      case 'medium':
        return { bg: 'rgba(245, 158, 11, 0.1)', text: '#f59e0b' };
      default:
        return { bg: 'rgba(16, 185, 129, 0.1)', text: '#10b981' };
    }
  };

  const priorityStyle = getPriorityStyle();

  const formatDueDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch (e) {
      return dateStr;
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => onDelete(task.id) }
      ]
    );
  };

  const isLocalOnly = task.id.startsWith('local-');

  return (
    <TouchableOpacity style={styles.card} onPress={() => onEdit(task)}>
      {/* Title & Delete Header */}
      <View style={styles.headerRow}>
        <Text style={styles.title} numberOfLines={2}>{task.title}</Text>
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
          <Text style={styles.deleteText}>🗑️</Text>
        </TouchableOpacity>
      </View>

      {/* Description */}
      {task.description ? (
        <Text style={styles.description} numberOfLines={3}>{task.description}</Text>
      ) : null}

      {/* Metadata Row */}
      <View style={styles.metaRow}>
        <View style={[styles.badge, { backgroundColor: priorityStyle.bg }]}>
          <Text style={[styles.badgeText, { color: priorityStyle.text }]}>{task.priority}</Text>
        </View>

        {task.dueDate ? (
          <View style={styles.dueDateRow}>
            <Text style={styles.dueDateIcon}>📅</Text>
            <Text style={styles.dueDateText}>{formatDueDate(task.dueDate)}</Text>
          </View>
        ) : null}

        {/* Offline Badge */}
        {isLocalOnly ? (
          <View style={styles.offlineBadge}>
            <Text style={styles.offlineText}>⏳ Local</Text>
          </View>
        ) : null}
      </View>

      {/* Navigation Touch Controls */}
      <View style={styles.touchControls}>
        {task.status !== 'todo' ? (
          <TouchableOpacity 
            style={styles.controlBtn} 
            onPress={() => onMoveTask(task.id, task.status === 'done' ? 'in-progress' : 'todo')}
          >
            <Text style={styles.controlBtnText}>← Back</Text>
          </TouchableOpacity>
        ) : null}
        
        {task.status !== 'done' ? (
          <TouchableOpacity 
            style={[styles.controlBtn, styles.controlBtnNext]} 
            onPress={() => onMoveTask(task.id, task.status === 'todo' ? 'in-progress' : 'done')}
          >
            <Text style={[styles.controlBtnText, styles.controlBtnTextNext]}>Next →</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(17, 24, 39, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    padding: 15,
    gap: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#f9fafb',
    flex: 1,
    marginRight: 10,
    lineHeight: 20,
  },
  deleteBtn: {
    padding: 2,
  },
  deleteText: {
    fontSize: 14,
    opacity: 0.6,
  },
  description: {
    fontSize: 13,
    color: '#9ca3af',
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  dueDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  dueDateIcon: {
    fontSize: 12,
    opacity: 0.5,
  },
  dueDateText: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '500',
  },
  offlineBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    marginLeft: 'auto',
  },
  offlineText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#f59e0b',
  },
  touchControls: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    paddingTop: 10,
    marginTop: 2,
  },
  controlBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#1f2937',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  controlBtnNext: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderColor: 'rgba(99, 102, 241, 0.2)',
    marginLeft: 'auto', // push Next to the rightmost edge
  },
  controlBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9ca3af',
  },
  controlBtnTextNext: {
    color: '#6366f1',
  },
});
