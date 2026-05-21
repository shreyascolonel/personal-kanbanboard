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

  const subtasksCount = task.subtasks ? task.subtasks.length : 0;
  const completedSubtasksCount = task.subtasks ? task.subtasks.filter(s => s.isCompleted).length : 0;
  const progressPercent = subtasksCount > 0 ? (completedSubtasksCount / subtasksCount) * 100 : 0;
  const commentsCount = task.comments ? task.comments.length : 0;
  const attachmentsCount = task.attachments ? task.attachments.length : 0;

  const isLocalOnly = task.id.startsWith('local-');

  const getCardBorderStyle = () => {
    if (!task.dueDate || task.status === 'done') return {};

    try {
      const due = new Date(task.dueDate + 'T23:59:59'); // end of due day
      const now = new Date();

      if (due < now) {
        return { borderColor: 'rgba(239, 68, 68, 0.4)', borderWidth: 1.5 };
      }

      // Check if approaching (within next 24 hours)
      const diffMs = due.getTime() - now.getTime();
      const diffHrs = diffMs / (1000 * 60 * 60);

      if (diffHrs >= 0 && diffHrs <= 24) {
        return { borderColor: 'rgba(245, 158, 11, 0.4)', borderWidth: 1.5 };
      }
    } catch (e) {}
    return {};
  };

  const cardBorderStyle = getCardBorderStyle();

  return (
    <TouchableOpacity style={[styles.card, cardBorderStyle]} onPress={() => onEdit(task)}>
      {/* Dynamic Tag Pills Row */}
      {task.tags && Array.isArray(task.tags) && task.tags.length > 0 ? (
        <View style={styles.cardTagsContainer}>
          {task.tags.map((tag) => {
            let charSum = 0;
            for (let c = 0; c < tag.length; c++) charSum += tag.charCodeAt(c);
            const colorIndex = charSum % 6;
            return (
              <View key={tag} style={[styles.cardTagPill, styles[`tagColor${colorIndex}`]]}>
                <Text style={styles.cardTagText}>{tag}</Text>
              </View>
            );
          })}
        </View>
      ) : null}

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

      {/* Checklist Progress Bar */}
      {subtasksCount > 0 ? (
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: `${progressPercent}%` }]} />
        </View>
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

        {/* Subtask progress count badge */}
        {subtasksCount > 0 ? (
          <View style={styles.indicatorBadge}>
            <Text style={styles.indicatorBadgeText}>☑️ {completedSubtasksCount}/{subtasksCount}</Text>
          </View>
        ) : null}

        {/* Comments count badge */}
        {commentsCount > 0 ? (
          <View style={styles.indicatorBadge}>
            <Text style={styles.indicatorBadgeText}>💬 {commentsCount}</Text>
          </View>
        ) : null}

        {/* Attachments count badge */}
        {attachmentsCount > 0 ? (
          <View style={styles.indicatorBadge}>
            <Text style={styles.indicatorBadgeText}>📎 {attachmentsCount}</Text>
          </View>
        ) : null}

        {/* Stopwatch hour badge */}
        {(task.actualHours > 0 || task.estimatedHours > 0) ? (
          <View style={styles.indicatorBadge}>
            <Text style={styles.indicatorBadgeText}>
              ⏱️ {task.actualHours || 0}h / {task.estimatedHours || 0}h
            </Text>
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
  progressContainer: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 4,
    marginBottom: 4,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 2,
  },
  indicatorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  indicatorBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#9ca3af',
  },
  cardTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 6,
  },
  cardTagPill: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  cardTagText: {
    color: '#f9fafb',
    fontSize: 10,
    fontWeight: '700',
  },
  tagColor0: { backgroundColor: 'rgba(59, 130, 246, 0.15)', borderColor: 'rgba(59, 130, 246, 0.3)' },
  tagColor1: { backgroundColor: 'rgba(16, 185, 129, 0.15)', borderColor: 'rgba(16, 185, 129, 0.3)' },
  tagColor2: { backgroundColor: 'rgba(245, 158, 11, 0.15)', borderColor: 'rgba(245, 158, 11, 0.3)' },
  tagColor3: { backgroundColor: 'rgba(139, 92, 246, 0.15)', borderColor: 'rgba(139, 92, 246, 0.3)' },
  tagColor4: { backgroundColor: 'rgba(236, 72, 153, 0.15)', borderColor: 'rgba(236, 72, 153, 0.3)' },
  tagColor5: { backgroundColor: 'rgba(20, 184, 166, 0.15)', borderColor: 'rgba(20, 184, 166, 0.3)' },
});
