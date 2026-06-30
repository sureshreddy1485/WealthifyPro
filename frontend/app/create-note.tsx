import React, { useState, useMemo, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, TextInput, Button, SegmentedButtons, useTheme, Menu, IconButton, Portal, Modal, List, Appbar } from 'react-native-paper';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { DatePickerModal } from 'react-native-paper-dates';
import { useNoteStore } from '@/store/noteStore';
import CustomAlert from '@/components/CustomAlert';

export default function CreateNoteScreen() {
  const { folderId: initialFolderId, editNoteId } = useLocalSearchParams<{ folderId?: string; editNoteId?: string }>();
  
  const theme = useTheme();
  const { folders, notes, addNote, editNote, addFolder } = useNoteStore();

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [folderId, setFolderId] = useState<string | null>(initialFolderId || null);
  const [startDate, setStartDate] = useState(new Date());
  const [durationType, setDurationType] = useState('days');
  const [duration, setDuration] = useState('');

  // Pre-fill state if we are editing an existing note
  useEffect(() => {
    if (editNoteId) {
      const existingNote = notes.find(n => n.id === editNoteId);
      if (existingNote) {
        setName(existingNote.name);
        setAmount(existingNote.amount.toString());
        setFolderId(existingNote.folderId);
        setStartDate(new Date(existingNote.startDate));
        setDurationType(existingNote.durationType);
        setDuration(existingNote.duration.toString());
      }
    }
  }, [editNoteId, notes]);

  // UI state
  const [isFolderMenuVisible, setFolderMenuVisible] = useState(false);
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
  });

  const showAlert = (title: string, message: string) => {
    setAlertConfig({ visible: true, title, message });
  };

  const calculatedEndDate = useMemo(() => {
    const num = parseFloat(duration);
    if (isNaN(num)) return null;
    const d = new Date(startDate);
    if (durationType === 'days') {
      d.setDate(d.getDate() + num);
    } else {
      d.setFullYear(d.getFullYear() + num);
    }
    return d;
  }, [startDate, duration, durationType]);

  const calculatedReminderDate = useMemo(() => {
    if (!calculatedEndDate) return null;
    const end = new Date(calculatedEndDate);
    const start = new Date(startDate);
    
    const reminder = new Date(end);
    reminder.setDate(reminder.getDate() - 5);

    // If total duration <= 5 days, the reminder will just be the start date
    if (reminder.getTime() < start.getTime()) {
      return start;
    }
    return reminder;
  }, [calculatedEndDate, startDate]);

  const handleSaveNote = () => {
    const numAmount = parseFloat(amount);
    const numDuration = parseFloat(duration);

    if (!name.trim() || isNaN(numAmount) || isNaN(numDuration)) {
      showAlert('Invalid Input', 'Please fill all required fields correctly (*).');
      return;
    }

    const notePayload = {
      name: name.trim(),
      amount: numAmount,
      folderId: folderId,
      startDate: startDate.getTime(),
      durationType: durationType as 'days' | 'years',
      duration: numDuration,
      endDate: calculatedEndDate ? calculatedEndDate.getTime() : 0,
      reminderDate: calculatedReminderDate ? calculatedReminderDate.getTime() : 0,
    };

    if (editNoteId) {
      editNote(editNoteId, notePayload);
      showAlert('Success', 'Note successfully updated!');
    } else {
      addNote(notePayload);
      showAlert('Success', 'Note successfully created!');
    }

    setTimeout(() => {
      setAlertConfig(prev => ({ ...prev, visible: false }));
      if (folderId) {
        router.replace({ pathname: '/note-folder/[id]', params: { id: folderId } } as any);
      } else {
        router.replace('/(tabs)/notes');
      }
    }, 1500);
  };

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      addFolder(newFolderName.trim());
      setNewFolderName('');
      setIsCreatingFolder(false);
    }
  };

  const selectedFolderName = folderId ? folders.find(f => f.id === folderId)?.name : 'Select a folder...';

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Stack.Screen 
        options={{ 
          header: () => (
            <Appbar.Header style={{ backgroundColor: theme.colors.surface, elevation: 0 }}>
              <Appbar.BackAction onPress={() => router.back()} color={theme.colors.onSurface} />
              <Appbar.Content title={editNoteId ? 'Edit Note' : 'Create Note'} titleStyle={{ fontWeight: 'bold', color: theme.colors.primary }} />
            </Appbar.Header>
          )
        }} 
      />

      <ScrollView contentContainerStyle={styles.content}>
        
        <Text variant="labelLarge" style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>
          Name *
        </Text>
        <TextInput
          mode="flat"
          placeholder="e.g., Insurance Premium"
          value={name}
          onChangeText={setName}
          style={styles.input}
        />

        <Text variant="labelLarge" style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>
          Amount *
        </Text>
        <TextInput
          mode="flat"
          keyboardType="numeric"
          placeholder="0.00"
          value={amount}
          onChangeText={setAmount}
          style={styles.input}
        />

        <Text variant="labelLarge" style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>
          Folder (Optional)
        </Text>
        <TouchableOpacity onPress={() => setFolderMenuVisible(true)} activeOpacity={0.8}>
          <View pointerEvents="none">
            <TextInput
              mode="flat"
              value={selectedFolderName}
              style={styles.input}
              right={<TextInput.Icon icon="chevron-down" />}
            />
          </View>
        </TouchableOpacity>

        <Text variant="labelLarge" style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>
          Start Date *
        </Text>
        <TouchableOpacity onPress={() => setDatePickerVisible(true)} activeOpacity={0.8}>
          <View pointerEvents="none">
            <TextInput
              mode="flat"
              value={startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              style={styles.input}
              right={<TextInput.Icon icon="calendar" />}
            />
          </View>
        </TouchableOpacity>

        <Text variant="labelLarge" style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>
          Duration Type *
        </Text>
        <SegmentedButtons
          value={durationType}
          onValueChange={setDurationType}
          buttons={[
            { value: 'days', label: 'Days' },
            { value: 'years', label: 'Years' },
          ]}
          style={styles.segmented}
        />

        <Text variant="labelLarge" style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>
          Number of {durationType === 'days' ? 'Days' : 'Years'} *
        </Text>
        <TextInput
          mode="flat"
          keyboardType="numeric"
          placeholder={durationType === 'days' ? "e.g., 30" : "e.g., 5"}
          value={duration}
          onChangeText={setDuration}
          style={styles.input}
        />

        {calculatedEndDate && (
          <View style={{ backgroundColor: theme.colors.surface, padding: 16, borderRadius: 12, marginBottom: 20 }}>
            <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 4 }}>
              Calculated End Date
            </Text>
            <Text variant="titleMedium" style={{ color: theme.colors.primary, fontWeight: 'bold', marginBottom: 12 }}>
              {calculatedEndDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </Text>

            <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 4 }}>
              Automatic Reminder
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
              5 days before (On {calculatedReminderDate?.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })})
            </Text>
          </View>
        )}

        <Button 
          mode="contained" 
          onPress={handleSaveNote}
          style={styles.submitBtn}
          labelStyle={{ fontSize: 16, fontWeight: 'bold' }}
        >
          {editNoteId ? 'Save Changes' : 'Create Note'}
        </Button>
      </ScrollView>

      <DatePickerModal
        locale="en"
        mode="single"
        visible={isDatePickerVisible}
        onDismiss={() => setDatePickerVisible(false)}
        date={startDate}
        startYear={2020}
        onConfirm={(params: { date?: Date }) => {
          setDatePickerVisible(false);
          if (params.date) setStartDate(params.date);
        }}
      />

      <Portal>
        <Modal 
          visible={isFolderMenuVisible} 
          onDismiss={() => {
            setFolderMenuVisible(false);
            setIsCreatingFolder(false);
          }}
          contentContainerStyle={[styles.modalContent, { backgroundColor: theme.colors.surface }]}
        >
          <Text variant="titleLarge" style={{ fontWeight: 'bold', marginBottom: 16 }}>Select Folder</Text>
          
          {isCreatingFolder ? (
            <View style={{ marginBottom: 16 }}>
              <TextInput
                label="Folder Name"
                mode="flat"
                value={newFolderName}
                onChangeText={setNewFolderName}
                placeholder="e.g. Work Notes"
                autoFocus
              />
              <View style={[styles.actionRow, { marginTop: 12 }]}>
                <Button onPress={() => setIsCreatingFolder(false)} style={{ flex: 1 }}>Cancel</Button>
                <Button mode="contained" onPress={handleCreateFolder} style={{ flex: 1 }}>Create</Button>
              </View>
            </View>
          ) : (
            <>
              {folders.length === 0 ? (
                <Text style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center', marginBottom: 16 }}>
                  No folders found. Please create one below.
                </Text>
              ) : (
                <ScrollView style={{ maxHeight: 300, marginBottom: 16 }}>
                  <List.Item
                    title="None (No Folder)"
                    left={props => <List.Icon {...props} icon="folder-remove-outline" />}
                    onPress={() => { setFolderId(null); setFolderMenuVisible(false); }}
                    style={{ backgroundColor: theme.colors.surfaceVariant, borderRadius: 8, marginBottom: 8 }}
                  />
                  {folders.map(folder => (
                    <List.Item
                      key={folder.id}
                      title={folder.name}
                      left={props => <List.Icon {...props} icon="folder" />}
                      onPress={() => { setFolderId(folder.id); setFolderMenuVisible(false); }}
                      style={{ backgroundColor: theme.colors.surfaceVariant, borderRadius: 8, marginBottom: 8 }}
                    />
                  ))}
                </ScrollView>
              )}
              
              <Button 
                mode="outlined" 
                icon="folder-plus" 
                onPress={() => setIsCreatingFolder(true)} 
                style={{ marginBottom: 8 }}
              >
                Create New Folder
              </Button>
              <Button onPress={() => setFolderMenuVisible(false)}>
                Cancel
              </Button>
            </>
          )}
        </Modal>
      </Portal>

      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        onDismiss={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  label: {
    marginBottom: 8,
    fontWeight: 'bold',
  },
  input: {
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
  segmented: {
    marginBottom: 20,
  },
  submitBtn: {
    marginTop: 16,
    paddingVertical: 6,
    borderRadius: 8,
  },
  modalContent: {
    margin: 20,
    padding: 24,
    borderRadius: 16,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
});
