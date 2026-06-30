import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, FlatList, BackHandler } from 'react-native';
import { Text, useTheme, FAB, Searchbar, IconButton, ActivityIndicator, Button, Appbar } from 'react-native-paper';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { useNoteStore, NoteItem } from '@/store/noteStore';
import CustomAlert from '@/components/CustomAlert';
import NoteCard from '@/components/NoteCard';
import { cancelNoteNotification } from '@/hooks/useDueNotifications';

export default function NoteFolderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setIsReady(true), 300);
    return () => clearTimeout(t);
  }, []);
  
  const { folders, notes: allNotes, deleteNote, deleteFolder } = useNoteStore();
  const folder = folders.find(f => f.id === id);
  const notes = allNotes.filter(n => n.folderId === id);

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);

  // Custom Alert State
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    onConfirm: () => {},
    showCancel: false,
    confirmText: 'OK',
    requireAuth: false,
  });

  const showAlert = (config: any) => {
    setAlertConfig({ visible: true, showCancel: false, confirmText: 'OK', requireAuth: false, onConfirm: hideAlert, ...config });
  };

  const hideAlert = () => {
    setAlertConfig(prev => ({ ...prev, visible: false }));
  };

  const handleDeleteNote = (noteId: string) => {
    showAlert({
      title: 'Delete Note?',
      message: 'Are you sure you want to permanently delete this note?',
      showCancel: true,
      confirmText: 'Delete',
      requireAuth: true,
      onConfirm: () => {
        cancelNoteNotification(noteId); // stop daily reminder
        deleteNote(noteId);
        hideAlert();
      }
    });
  };

  const handleFolderDelete = () => {
    showAlert({
      title: 'Delete Folder?',
      message: `Are you sure you want to delete "${folder?.name}"? All notes inside it will be permanently deleted.`,
      showCancel: true,
      confirmText: 'Delete',
      requireAuth: true,
      onConfirm: () => {
        if (id) deleteFolder(id);
        hideAlert();
        router.back();
      }
    });
  };

  if (!folder) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Stack.Screen options={{ title: 'Not Found' }} />
        <Text>Folder not found</Text>
      </View>
    );
  }

  const handleEditNote = (noteId: string) => {
    router.push({ pathname: '/create-note', params: { editNoteId: noteId } } as any);
  };

  // Multi-select State
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedNoteIds, setSelectedNoteIds] = useState<string[]>([]);

  const handleLongPress = (noteId: string) => {
    if (!selectionMode) {
      setSelectionMode(true);
      setSelectedNoteIds([noteId]);
    }
  };

  const handleToggleSelection = (noteId: string) => {
    if (selectionMode) {
      if (selectedNoteIds.includes(noteId)) {
        const next = selectedNoteIds.filter(id => id !== noteId);
        setSelectedNoteIds(next);
        if (next.length === 0) setSelectionMode(false);
      } else {
        setSelectedNoteIds([...selectedNoteIds, noteId]);
      }
    }
  };

  const exitSelection = () => {
    setSelectionMode(false);
    setSelectedNoteIds([]);
  };

  useEffect(() => {
    const onBackPress = () => {
      if (selectionMode) {
        exitSelection();
        return true;
      }
      return false;
    };
    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [selectionMode]);

  const deleteSelectedNotes = () => {
    showAlert({
      title: 'Delete Notes?',
      message: `Are you sure you want to delete ${selectedNoteIds.length} notes?`,
      showCancel: true,
      confirmText: 'Delete',
      requireAuth: true,
      onConfirm: () => {
        selectedNoteIds.forEach(id => {
          cancelNoteNotification(id); // stop daily reminder
          deleteNote(id);
        });
        exitSelection();
        hideAlert();
      }
    });
  };

  const markSelectedAsGiven = () => {
    showAlert({
      title: 'Mark as Given?',
      message: `Are you sure you want to mark ${selectedNoteIds.length} notes as given/settled?`,
      showCancel: true,
      confirmText: 'Yes',
      onConfirm: () => {
        const { editNote } = useNoteStore.getState();
        selectedNoteIds.forEach(id => {
          editNote(id, { isGiven: true });
          cancelNoteNotification(id); // stop daily reminder once settled
        });
        exitSelection();
        hideAlert();
      }
    });
  };

  const filteredNotes = notes
    .filter(n => n.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => a.startDate - b.startDate);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Stack.Screen 
        options={{ 
          header: () => (
            <Appbar.Header style={{ backgroundColor: selectionMode ? '#1E0A3C' : theme.colors.surface, elevation: 0 }}>
              {selectionMode ? (
                <>
                  <Appbar.Action icon="close" onPress={exitSelection} iconColor={theme.colors.onSurface} />
                  <Appbar.Content title={`${selectedNoteIds.length} Selected`} titleStyle={{ fontWeight: 'bold', color: theme.colors.onSurface, fontSize: 18 }} />
                  <Appbar.Action 
                    icon={selectedNoteIds.length === filteredNotes.length ? "checkbox-multiple-marked" : "checkbox-multiple-blank-outline"} 
                    iconColor={theme.colors.primary} 
                    onPress={() => {
                      if (selectedNoteIds.length === filteredNotes.length) {
                        setSelectedNoteIds([]);
                        setSelectionMode(false);
                      } else {
                        setSelectedNoteIds(filteredNotes.map(n => n.id));
                      }
                    }} 
                  />
                  <Appbar.Action icon="check-all" iconColor={theme.colors.primary} onPress={markSelectedAsGiven} />
                  <Appbar.Action icon="delete-outline" iconColor={theme.colors.error} onPress={deleteSelectedNotes} />
                </>
              ) : isSearchActive ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 16 }}>
                  <Appbar.Action icon="arrow-left" onPress={() => { setIsSearchActive(false); setSearchQuery(''); }} iconColor={theme.colors.onSurface} />
                  <Searchbar
                    placeholder="Search notes..."
                    onChangeText={setSearchQuery}
                    value={searchQuery}
                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', height: 40, elevation: 0, flex: 1 }}
                    inputStyle={{ minHeight: 0, paddingVertical: 0, color: theme.colors.onSurface }}
                    iconColor={theme.colors.onSurfaceVariant}
                    autoFocus
                  />
                </View>
              ) : (
                <>
                  <Appbar.BackAction onPress={() => router.back()} color={theme.colors.onSurface} />
                  <Appbar.Content title={folder.name} titleStyle={{ fontWeight: 'bold', color: theme.colors.primary }} />
                  <Appbar.Action icon="magnify" iconColor={theme.colors.onSurface} onPress={() => setIsSearchActive(true)} />
                  <Appbar.Action icon="delete-outline" iconColor="#EF4444" onPress={handleFolderDelete} />
                </>
              )}
            </Appbar.Header>
          )
        }} 
      />
      
      <View style={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: 0 }}>
        
        {notes.length > 0 && (
          <View style={{ marginTop: 4, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text variant="labelLarge" style={{ color: theme.colors.onSurfaceVariant }}>
              Total Active Amount:
            </Text>
            <Text variant="titleMedium" style={{ color: theme.colors.primary, fontWeight: 'bold' }}>
              ₹{notes.filter(n => !n.isGiven).reduce((sum, n) => sum + n.amount, 0).toLocaleString()}
            </Text>
          </View>
        )}
      </View>

      {filteredNotes.length === 0 ? (
        <View style={styles.emptyState}>
          <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
            This folder is empty.
          </Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center', marginTop: 8 }}>
            Tap the + button to add a new note.
          </Text>
        </View>
      ) : !isReady ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredNotes}
          keyExtractor={(note) => note.id}
          contentContainerStyle={styles.scrollContent}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          renderItem={({ item: note }) => (
            <NoteCard 
              note={note} 
              onDelete={selectionMode ? undefined : handleDeleteNote} 
              onEdit={selectionMode ? undefined : handleEditNote} 
              selected={selectedNoteIds.includes(note.id)}
              selectionMode={selectionMode}
              onPress={() => {
                if (selectionMode) {
                  handleToggleSelection(note.id);
                }
              }}
              onLongPress={() => handleLongPress(note.id)}
            />
          )}
        />
      )}

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        color="#fff"
        onPress={() => router.push({ pathname: '/create-note', params: { folderId: folder.id } } as any)}
      />

      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        onDismiss={hideAlert}
        onConfirm={alertConfig.onConfirm}
        showCancel={alertConfig.showCancel}
        confirmText={alertConfig.confirmText}
        requireAuth={alertConfig.requireAuth}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchBar: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    elevation: 0,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 100, // Increased padding so FAB doesn't cover last item
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 32,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
});
