import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Modal, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';

export default function TaskModal({ isOpen, onClose, onSave, task, currentUser, token, serverUrl }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('todo');
  const [priority, setPriority] = useState('low');
  const [dueDate, setDueDate] = useState('');

  // Extended states
  const [subtasks, setSubtasks] = useState([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [comments, setComments] = useState([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);

  // 1. Set form values ONLY when modal opens to prevent clobbering typed inputs
  useEffect(() => {
    if (isOpen) {
      setTitle(task?.title || '');
      setDescription(task?.description || '');
      setStatus(task?.status || 'todo');
      setPriority(task?.priority || 'low');
      setDueDate(task?.dueDate || '');
    }
  }, [isOpen]);

  // 2. Keep subtasks, comments, and attachments synchronised when parent task state changes
  useEffect(() => {
    if (task) {
      setSubtasks(task.subtasks || []);
      setComments(task.comments || []);
      setAttachments(task.attachments || []);
    } else {
      setSubtasks([]);
      setComments([]);
      setAttachments([]);
    }
  }, [task]);

  const getUpdatedTaskData = (extendedFields) => {
    return {
      id: task ? task.id : undefined,
      title: title.trim(),
      description: description.trim(),
      status,
      priority,
      dueDate: dueDate.trim(),
      createdAt: task ? task.createdAt : new Date().toISOString(),
      subtasks,
      comments,
      attachments: task ? task.attachments : [],
      ...extendedFields
    };
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      Alert.alert('Validation Error', 'Task title is required.');
      return;
    }

    onSave(getUpdatedTaskData());
    onClose();
  };

  // Subtask Handlers
  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;

    const newSub = {
      id: 'sub-' + Date.now() + '-' + Math.round(Math.random() * 1000),
      title: newSubtaskTitle.trim(),
      isCompleted: false
    };

    const updated = [...subtasks, newSub];
    setSubtasks(updated);
    setNewSubtaskTitle('');

    if (task) {
      onSave(getUpdatedTaskData({ subtasks: updated }));
    }
  };

  const handleToggleSubtask = (subId) => {
    const updated = subtasks.map(s => 
      s.id === subId ? { ...s, isCompleted: !s.isCompleted } : s
    );
    setSubtasks(updated);
    if (task) {
      onSave(getUpdatedTaskData({ subtasks: updated }));
    }
  };

  const handleDeleteSubtask = (subId) => {
    const updated = subtasks.filter(s => s.id !== subId);
    setSubtasks(updated);
    if (task) {
      onSave(getUpdatedTaskData({ subtasks: updated }));
    }
  };

  // Comment Handler
  const handleAddComment = () => {
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
      onSave(getUpdatedTaskData({ comments: updated }));
    }
  };

  // File Upload Pick & Post Handler
  const pickAndUploadFile = async () => {
    if (!task) return;

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const fileAsset = result.assets[0];

      if (fileAsset.size > 10 * 1024 * 1024) {
        Alert.alert('File Too Large', 'Maximum file upload size is 10MB.');
        return;
      }

      setUploading(true);

      const formData = new FormData();
      formData.append('file', {
        uri: Platform.OS === 'ios' ? fileAsset.uri.replace('file://', '') : fileAsset.uri,
        name: fileAsset.name,
        type: fileAsset.mimeType || 'application/octet-stream',
      });

      const response = await fetch(`${serverUrl}/api/tasks/${task.id}/attachments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: formData
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setAttachments(data.attachments || []);
      onSave(data);
      Alert.alert('Success', 'File attached successfully!');
    } catch (err) {
      Alert.alert('Upload Error', err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAttachment = async (attachId) => {
    Alert.alert(
      'Delete Attachment',
      'Are you sure you want to permanently delete this file attachment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`${serverUrl}/api/tasks/${task.id}/attachments/${attachId}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              });

              const data = await response.json();
              if (!response.ok) {
                throw new Error(data.error || 'Deletion failed');
              }

              setAttachments(data.attachments || []);
              onSave(data);
            } catch (err) {
              Alert.alert('Delete Error', err.message);
            }
          }
        }
      ]
    );
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

  const selectPriority = (level) => {
    setPriority(level);
  };

  const selectStatus = (state) => {
    setStatus(state);
  };

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{task ? 'Edit Task' : 'Add New Task'}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Form Scroll */}
          <ScrollView contentContainerStyle={styles.formScroll}>
            {/* Title */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Title *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Wash the car"
                placeholderTextColor="#6b7280"
                value={title}
                onChangeText={setTitle}
              />
            </View>

            {/* Description */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Enter details..."
                placeholderTextColor="#6b7280"
                multiline
                numberOfLines={4}
                value={description}
                onChangeText={setDescription}
              />
            </View>

            {/* Priority Selector (Styled Segmented Controls) */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Priority</Text>
              <View style={styles.selectorRow}>
                {['low', 'medium', 'high'].map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={[
                      styles.selectorBtn,
                      priority === p && styles[`priorityActive_${p}`]
                    ]}
                    onPress={() => selectPriority(p)}
                  >
                    <Text style={[
                      styles.selectorBtnText,
                      priority === p && styles.selectorBtnTextActive
                    ]}>
                      {p}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Status Selector */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Status</Text>
              <View style={styles.selectorRow}>
                {['todo', 'in-progress', 'done'].map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={[
                      styles.selectorBtn,
                      status === s && styles.statusActive
                    ]}
                    onPress={() => selectStatus(s)}
                  >
                    <Text style={[
                      styles.selectorBtnText,
                      status === s && styles.selectorBtnTextActive
                    ]}>
                      {s === 'in-progress' ? 'doing' : s}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Due Date */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Due Date (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 2026-05-30"
                placeholderTextColor="#6b7280"
                value={dueDate}
                onChangeText={setDueDate}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Extended Sections - Only visible when EDITING an existing task */}
            {task ? (
              <>
                <View style={styles.separator} />

                {/* SUBTASKS SECTION */}
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Subtasks Checklist</Text>
                </View>

                <View style={styles.subtaskList}>
                  {subtasks.length === 0 ? (
                    <Text style={styles.emptyText}>No subtasks created yet.</Text>
                  ) : (
                    subtasks.map(sub => (
                      <View key={sub.id} style={styles.subtaskItem}>
                        <TouchableOpacity 
                          style={styles.checkboxContainer} 
                          onPress={() => handleToggleSubtask(sub.id)}
                        >
                          <Text style={styles.checkboxIcon}>
                            {sub.isCompleted ? '☑️' : '⬜'}
                          </Text>
                        </TouchableOpacity>
                        <Text style={[styles.subtaskTitle, sub.isCompleted && styles.completedSubtask]}>
                          {sub.title}
                        </Text>
                        <TouchableOpacity 
                          style={styles.deleteSubtaskBtn} 
                          onPress={() => handleDeleteSubtask(sub.id)}
                        >
                          <Text style={styles.deleteSubtaskText}>✕</Text>
                        </TouchableOpacity>
                      </View>
                    ))
                  )}
                </View>

                <View style={styles.subtaskAddForm}>
                  <TextInput
                    style={[styles.input, styles.subtaskAddInput]}
                    placeholder="Add a new checklist subtask..."
                    placeholderTextColor="#6b7280"
                    value={newSubtaskTitle}
                    onChangeText={setNewSubtaskTitle}
                  />
                  <TouchableOpacity style={styles.addSubtaskBtn} onPress={handleAddSubtask}>
                    <Text style={styles.addSubtaskBtnText}>Add</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.separator} />

                {/* ATTACHMENTS SECTION */}
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>File Attachments</Text>
                </View>

                <View style={styles.attachmentsList}>
                  {attachments.length === 0 ? (
                    <Text style={styles.emptyText}>No attachments uploaded.</Text>
                  ) : (
                    attachments.map(att => (
                      <View key={att.id} style={styles.attachmentItem}>
                        <Text style={styles.attachmentIcon}>📎</Text>
                        <View style={styles.attachmentInfo}>
                          <Text style={styles.attachmentName} numberOfLines={1}>{att.originalName}</Text>
                          <Text style={styles.attachmentSize}>
                            {formatBytes(att.size)} • {formatCommentDate(att.uploadedAt)}
                          </Text>
                        </View>
                        <TouchableOpacity 
                          style={styles.deleteAttachmentBtn} 
                          onPress={() => handleDeleteAttachment(att.id)}
                        >
                          <Text style={styles.deleteAttachmentText}>✕</Text>
                        </TouchableOpacity>
                      </View>
                    ))
                  )}
                </View>

                <TouchableOpacity 
                  style={[styles.uploadBtn, uploading && styles.uploadBtnDisabled]} 
                  onPress={pickAndUploadFile}
                  disabled={uploading}
                >
                  <Text style={styles.uploadBtnText}>
                    {uploading ? '⌛ Uploading...' : '📎 Choose file to upload (Max 10MB)'}
                  </Text>
                </TouchableOpacity>

                <View style={styles.separator} />

                {/* COMMENTS SECTION */}
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Comments Feed</Text>
                </View>

                <View style={styles.commentsList}>
                  {comments.length === 0 ? (
                    <Text style={styles.emptyText}>No comments posted yet.</Text>
                  ) : (
                    [...comments]
                      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
                      .map(c => (
                        <View key={c.id} style={styles.commentBubble}>
                          <View style={styles.commentHeader}>
                            <Text style={styles.commentAuthor} numberOfLines={1}>{c.userEmail}</Text>
                            <Text style={styles.commentDate}>{formatCommentDate(c.createdAt)}</Text>
                          </View>
                          <Text style={styles.commentText}>{c.text}</Text>
                        </View>
                      ))
                  )}
                </View>

                <View style={styles.commentAddForm}>
                  <TextInput
                    style={[styles.input, styles.commentInput]}
                    placeholder="Write a comment..."
                    placeholderTextColor="#6b7280"
                    multiline
                    numberOfLines={2}
                    value={newCommentText}
                    onChangeText={setNewCommentText}
                  />
                  <TouchableOpacity style={styles.postCommentBtn} onPress={handleAddComment}>
                    <Text style={styles.postCommentBtnText}>Post Comment</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <View style={styles.newCardInfoContainer}>
                <Text style={styles.newCardInfoText}>
                  Create this task first to add subtasks, upload files, or post comments!
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.saveBtn} onPress={handleSubmit}>
              <Text style={styles.saveBtnText}>{task ? 'Save Changes' : 'Create Task'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    padding: 20,
  },
  content: {
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 10,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#f9fafb',
  },
  closeBtn: {
    padding: 4,
  },
  closeBtnText: {
    color: '#9ca3af',
    fontSize: 16,
  },
  formScroll: {
    padding: 20,
    gap: 15,
  },
  formGroup: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9ca3af',
  },
  input: {
    backgroundColor: 'rgba(31, 41, 55, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 15,
    color: '#f9fafb',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top', // android specific
  },
  selectorRow: {
    flexDirection: 'row',
    gap: 8,
  },
  selectorBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#1f2937',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  selectorBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9ca3af',
    textTransform: 'capitalize',
  },
  selectorBtnTextActive: {
    color: '#ffffff',
  },
  priorityActive_low: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  priorityActive_medium: {
    backgroundColor: '#f59e0b',
    borderColor: '#f59e0b',
  },
  priorityActive_high: {
    backgroundColor: '#ef4444',
    borderColor: '#ef4444',
  },
  statusActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    backgroundColor: '#111827',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#1f2937',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#9ca3af',
    fontSize: 14,
    fontWeight: '600',
  },
  saveBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginVertical: 15,
  },
  sectionHeader: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emptyText: {
    fontSize: 13,
    color: '#6b7280',
    fontStyle: 'italic',
    paddingVertical: 5,
  },
  subtaskList: {
    gap: 8,
  },
  subtaskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(31, 41, 55, 0.3)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  checkboxContainer: {
    marginRight: 10,
  },
  checkboxIcon: {
    fontSize: 16,
  },
  subtaskTitle: {
    fontSize: 14,
    color: '#f9fafb',
    flex: 1,
  },
  completedSubtask: {
    textDecorationLine: 'line-through',
    color: '#6b7280',
  },
  deleteSubtaskBtn: {
    padding: 4,
  },
  deleteSubtaskText: {
    color: '#6b7280',
    fontSize: 14,
  },
  subtaskAddForm: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  subtaskAddInput: {
    flex: 1,
    paddingVertical: 6,
    fontSize: 13,
  },
  addSubtaskBtn: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addSubtaskBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  attachmentsList: {
    gap: 8,
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(31, 41, 55, 0.3)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  attachmentIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  attachmentInfo: {
    flex: 1,
    gap: 2,
  },
  attachmentName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#f9fafb',
  },
  attachmentSize: {
    fontSize: 11,
    color: '#6b7280',
  },
  deleteAttachmentBtn: {
    padding: 4,
  },
  deleteAttachmentText: {
    color: '#ef4444',
    fontSize: 14,
  },
  uploadBtn: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#6366f1',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
    marginTop: 10,
  },
  uploadBtnDisabled: {
    borderColor: '#4b5563',
    backgroundColor: 'rgba(75, 85, 99, 0.05)',
  },
  uploadBtnText: {
    color: '#6366f1',
    fontSize: 13,
    fontWeight: '600',
  },
  commentsList: {
    gap: 10,
    marginBottom: 10,
  },
  commentBubble: {
    backgroundColor: 'rgba(31, 41, 55, 0.35)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
    padding: 12,
    gap: 4,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  commentAuthor: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6366f1',
    flex: 1,
  },
  commentDate: {
    fontSize: 10,
    color: '#6b7280',
  },
  commentText: {
    fontSize: 13,
    color: '#e5e7eb',
    lineHeight: 18,
  },
  commentAddForm: {
    gap: 8,
    marginTop: 5,
  },
  commentInput: {
    minHeight: 50,
    textAlignVertical: 'top',
    fontSize: 13,
    paddingTop: 8,
  },
  postCommentBtn: {
    backgroundColor: '#6366f1',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 15,
    alignSelf: 'flex-end',
    alignItems: 'center',
    justifyContent: 'center',
  },
  postCommentBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  newCardInfoContainer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    paddingVertical: 15,
    alignItems: 'center',
  },
  newCardInfoText: {
    color: '#6b7280',
    fontStyle: 'italic',
    fontSize: 12,
    textAlign: 'center',
  },
});
