import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, BackHandler } from 'react-native';
import { Text, useTheme, IconButton, Portal, Dialog, TextInput, Button, FAB, List, Modal, Searchbar, Avatar } from 'react-native-paper';
import { Tabs, router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/authStore';
import { useNoteStore, NoteItem } from '@/store/noteStore';
import CustomAlert from '@/components/CustomAlert';
import NoteCard from '@/components/NoteCard';
import * as DocumentPicker from 'expo-document-picker';
import { readAsStringAsync, EncodingType, copyAsync, deleteAsync, documentDirectory } from 'expo-file-system/legacy';
import { cancelNoteNotification } from '@/hooks/useDueNotifications';
import * as XLSX from 'xlsx';

interface ParsedNote {
  id: string;
  name: string;
  amount: number;
  folderName: string;
  duration: number;
  durationType: 'days' | 'months' | 'years';
  startDate: number;
  isValid: boolean;
  errorMsg?: string;
}

export default function NotesScreen() {
  const theme = useTheme();
  const user = useAuthStore(state => state.user);
  const { folders, notes: allNotes, addFolder, renameFolder, deleteFolder, deleteNote } = useNoteStore();
  
  const [dialogVisible, setDialogVisible] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  
  const [selectedNote, setSelectedNote] = useState<NoteItem | null>(null);

  const [importPreviewVisible, setImportPreviewVisible] = useState(false);
  const [parsedNotesPreview, setParsedNotesPreview] = useState<ParsedNote[]>([]);

  const orphanNotes = allNotes.filter(n => !n.folderId);

  // Custom Alert State
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    onConfirm: () => {},
    showCancel: false,
    confirmText: 'OK',
  });

  const showAlert = (config: any) => {
    setAlertConfig({ visible: true, showCancel: false, confirmText: 'OK', onConfirm: hideAlert, ...config });
  };

  const hideAlert = () => {
    setAlertConfig(prev => ({ ...prev, visible: false }));
  };

  const handleCreateOrRenameFolder = () => {
    if (newFolderName.trim()) {
      if (editingFolderId) {
        renameFolder(editingFolderId, newFolderName.trim());
        showAlert({ title: 'Success', message: 'Folder renamed successfully.', confirmText: 'OK' });
      } else {
        addFolder(newFolderName.trim());
        showAlert({ title: 'Success', message: 'Folder created successfully.', confirmText: 'OK' });
      }
      setNewFolderName('');
      setEditingFolderId(null);
      setDialogVisible(false);
    }
  };

  const openRenameDialog = (id: string, currentName: string) => {
    setEditingFolderId(id);
    setNewFolderName(currentName);
    setDialogVisible(true);
  };

  const handleDeleteFolder = (id: string, name: string) => {
    showAlert({
      title: 'Delete Folder?',
      message: `Are you sure you want to delete "${name}"? All notes inside it will be permanently deleted.`,
      showCancel: true,
      confirmText: 'Delete',
      onConfirm: () => {
        deleteFolder(id);
        hideAlert();
      }
    });
  };

  const handleImportExcel = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
          'text/csv'
        ],
        copyToCacheDirectory: false, // Prevents Android cache permission bugs
      });

      if (result.canceled || !result.assets || result.assets.length === 0) return;

      const asset = result.assets[0];
      const b64 = await readAsStringAsync(asset.uri, { encoding: EncodingType.Base64 });

      const workbook = XLSX.read(b64, { type: 'base64' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);

      const parsedNotes: ParsedNote[] = [];

      data.forEach((row: any) => {
        const rawName = row.name || row.Name;
        const rawAmount = row.amount || row.Amount;
        const rawFolder = row.folder || row.Folder;
        const rawStartDate = row.startdate || row.StartDate || row['start date'] || row['Start Date'] || row['Start date'];
        const rawDuration = row.duration || row.Duration;
        const rawType = row.type || row.Type;
        
        const folderName = rawFolder ? String(rawFolder).trim() : '';
        const name = rawName ? String(rawName).trim() : '';
        const amount = Number(rawAmount) || 0;
        const duration = Number(rawDuration) || 0;
        
        let isValid = true;
        let errorMsg = '';
        if (!name) { isValid = false; errorMsg = 'Missing name'; }
        else if (!amount) { isValid = false; errorMsg = 'Invalid amount'; }
        else if (!duration) { isValid = false; errorMsg = 'Invalid duration'; }

        // Parse date robustly
        let startDate = Date.now();
        if (rawStartDate) {
          if (typeof rawStartDate === 'number') {
            // Excel numeric date format
            startDate = new Date((rawStartDate - (25567 + 2)) * 86400 * 1000).getTime();
          } else {
            const dateStr = String(rawStartDate).trim();
            // Try standard Date parsing first
            const parsed = new Date(dateStr);
            if (!isNaN(parsed.getTime())) {
              startDate = parsed.getTime();
            } else {
              // Fallback for DD-MM-YYYY or DD/MM/YYYY since Hermes doesn't support it natively
              const parts = dateStr.split(/[-/]/);
              if (parts.length === 3) {
                let day = parseInt(parts[0], 10);
                let month = parseInt(parts[1], 10);
                let year = parseInt(parts[2], 10);
                
                // If year is first (YYYY-MM-DD) which failed standard parse for some reason
                if (day > 1000) {
                  year = day;
                  day = parseInt(parts[2], 10);
                } else if (month > 12) {
                  // It was actually MM-DD-YYYY
                  const temp = day;
                  day = month;
                  month = temp;
                }
                
                // Handle 2-digit years
                if (year < 100) year += 2000;
                
                const manualDate = new Date(year, month - 1, day);
                if (!isNaN(manualDate.getTime())) {
                  startDate = manualDate.getTime();
                }
              }
            }
          }
        }

        const durationTypeStr = String(rawType).toLowerCase();
        const durationType = (durationTypeStr === 'years') ? 'years' : (durationTypeStr === 'months') ? 'months' : 'days';

        parsedNotes.push({
          id: Math.random().toString(),
          name,
          amount,
          folderName,
          duration,
          durationType,
          startDate,
          isValid,
          errorMsg
        });
      });

      setParsedNotesPreview(parsedNotes);
      setImportPreviewVisible(true);

    } catch (error) {
      console.error("Excel import error:", error);
      showAlert({
        title: 'Import Failed',
        message: 'There was an error parsing the file. Please ensure it is a valid Excel or CSV file.',
        confirmText: 'OK'
      });
    }
  };

  const handleConfirmImport = () => {
    const validNotes = parsedNotesPreview.filter(n => n.isValid);
    let importedCount = 0;
    const store = useNoteStore.getState();
    const folderCache: { [key: string]: string } = {};

    validNotes.forEach(note => {
      let folderId = null;
      if (note.folderName) {
        const lowerName = note.folderName.toLowerCase();
        if (folderCache[lowerName]) {
          folderId = folderCache[lowerName];
        } else {
          const existingFolder = store.folders.find(f => f.name.toLowerCase() === lowerName);
          if (existingFolder) {
            folderId = existingFolder.id;
            folderCache[lowerName] = folderId;
          } else {
            folderId = store.addFolder(note.folderName);
            folderCache[lowerName] = folderId;
          }
        }
      }

      const startObj = new Date(note.startDate);
      const endObj = new Date(note.startDate);
      if (note.durationType === 'years') {
        endObj.setFullYear(startObj.getFullYear() + note.duration);
      } else if (note.durationType === 'months') {
        endObj.setMonth(startObj.getMonth() + note.duration);
      } else {
        endObj.setDate(startObj.getDate() + note.duration);
      }

      store.addNote({
        name: note.name,
        amount: note.amount,
        folderId,
        startDate: note.startDate,
        duration: note.duration,
        durationType: note.durationType,
        endDate: endObj.getTime(),
        reminderDate: endObj.getTime() - (1000 * 60 * 60 * 24),
      });

      importedCount++;
    });

    setImportPreviewVisible(false);
    setParsedNotesPreview([]);

    showAlert({
      title: 'Import Successful',
      message: `Successfully imported ${importedCount} notes.`,
      confirmText: 'OK'
    });
  };

  const handleEditNote = (noteId: string) => {
    router.push({ pathname: '/create-note', params: { editNoteId: noteId } } as any);
  };

  // Multi-select State
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedNoteIds, setSelectedNoteIds] = useState<string[]>([]);
  const [selectedFolderIds, setSelectedFolderIds] = useState<string[]>([]);

  
  const handleFolderLongPress = (folderId: string) => {
    if (!selectionMode) {
      setSelectionMode(true);
      setSelectedFolderIds([folderId]);
    }
  };

  const handleToggleFolderSelection = (folderId: string) => {
    if (selectionMode) {
      if (selectedFolderIds.includes(folderId)) {
        const next = selectedFolderIds.filter(id => id !== folderId);
        setSelectedFolderIds(next);
        if (next.length === 0 && selectedNoteIds.length === 0) setSelectionMode(false);
      } else {
        setSelectedFolderIds([...selectedFolderIds, folderId]);
      }
    }
  };

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
        if (next.length === 0 && selectedFolderIds.length === 0) setSelectionMode(false);
      } else {
        setSelectedNoteIds([...selectedNoteIds, noteId]);
      }
    } else {
      // If not in selection mode, maybe open the note viewer or do nothing, but the card has buttons.
    }
  };

  const exitSelection = () => {
    setSelectionMode(false);
    setSelectedNoteIds([]);
    setSelectedFolderIds([]);
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

    const deleteSelectedItems = () => {
    const totalCount = selectedNoteIds.length + selectedFolderIds.length;
    showAlert({
      title: 'Delete Selected?',
      message: `Are you sure you want to delete ${totalCount} items? (Folders will delete all their contents too)`,
      showCancel: true,
      confirmText: 'Delete',
      onConfirm: () => {
        selectedNoteIds.forEach(id => deleteNote(id));
        selectedFolderIds.forEach(id => deleteFolder(id));
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
        selectedNoteIds.forEach(id => editNote(id, { isGiven: true }));
        exitSelection();
        hideAlert();
      }
    });
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);

  const filteredFolders = folders
    .filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => a.createdAt - b.createdAt);
  
  const displayedNotes = (searchQuery.trim() !== ''
    ? allNotes.filter(n => n.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : orphanNotes).sort((a, b) => a.startDate - b.startDate);

    const allSelected = selectedNoteIds.length === displayedNotes.length && selectedFolderIds.length === filteredFolders.length;
  
  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedNoteIds([]);
      setSelectedFolderIds([]);
      setSelectionMode(false);
    } else {
      setSelectedNoteIds(displayedNotes.map(n => n.id));
      setSelectedFolderIds(filteredFolders.map(f => f.id));
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Tabs.Screen
        options={{
          headerTitle: selectionMode ? '' : isSearchActive ? () => (
            <Searchbar
              placeholder="Search notes or folders..."
              onChangeText={setSearchQuery}
              value={searchQuery}
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', height: 40, elevation: 0, minWidth: 260 }}
              inputStyle={{ minHeight: 0, paddingVertical: 0, color: theme.colors.onSurface }}
              iconColor={theme.colors.onSurfaceVariant}
              autoFocus
            />
          ) : 'WealthifyPro',
          headerTitleAlign: 'left',
          headerStyle: { backgroundColor: selectionMode ? '#1E0A3C' : theme.colors.surface },
          headerLeft: () => selectionMode ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 16 }}>
              <IconButton icon="close" size={24} onPress={exitSelection} />
              <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>{selectedNoteIds.length + selectedFolderIds.length} Selected</Text>
              
            </View>
          ) : isSearchActive ? (
            <IconButton icon="arrow-left" size={24} onPress={() => { setIsSearchActive(false); setSearchQuery(''); }} />
          ) : undefined,
          headerRight: () => (
            <View style={{ flexDirection: 'row' }}>
              {selectionMode ? (
                <>
                  <IconButton 
                    icon={allSelected ? "checkbox-multiple-marked" : "checkbox-multiple-blank-outline"} 
                    iconColor={theme.colors.primary} 
                    size={24} 
                    onPress={handleSelectAll} 
                  />
                  <IconButton icon="check-all" iconColor={theme.colors.primary} size={24} onPress={markSelectedAsGiven} />
                  <IconButton icon="delete-outline" iconColor={theme.colors.error} size={24} onPress={deleteSelectedItems} />
                </>
              ) : isSearchActive ? null : (
                <>
                  <IconButton
                    icon="magnify"
                    iconColor={theme.colors.onSurface}
                    size={24}
                    onPress={() => setIsSearchActive(true)}
                  />
                  <IconButton
                    icon="file-excel-outline"
                    iconColor={theme.colors.secondary}
                    size={24}
                    onPress={handleImportExcel}
                  />
                  <IconButton
                    icon="folder-plus"
                    iconColor={theme.colors.onSurface}
                    size={24}
                    onPress={() => {
                      setEditingFolderId(null);
                      setNewFolderName('');
                      setDialogVisible(true);
                    }}
                  />
                  <TouchableOpacity onPress={() => router.push('/settings')} style={{ marginRight: 12, justifyContent: 'center' }}>
                    {user?.profilePictureUrl ? (
                      <Avatar.Image size={28} source={{ uri: user.profilePictureUrl }} />
                    ) : (
                      <Avatar.Text 
                        size={28} 
                        label={(user?.name?.substring(0, 2) || 'U').toUpperCase()} 
                        style={{ backgroundColor: theme.colors.primary }} 
                        labelStyle={{ fontSize: 12, fontWeight: 'bold' }}
                      />
                    )}
                  </TouchableOpacity>
                </>
              )}
            </View>
          ),
        }}
      />



      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.listContent}>
        {filteredFolders.length === 0 && displayedNotes.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="folder-open-outline" size={64} color={theme.colors.onSurfaceVariant} />
            <Text variant="titleMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 16 }}>
              No notes or folders yet
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center', marginTop: 8 }}>
              Tap the + icon to create your first note or folder.
            </Text>
          </View>
        ) : (
          <>
            {filteredFolders.map(item => (
              <TouchableOpacity 
                key={item.id}
                activeOpacity={0.7} 
                onPress={() => {
                  if (selectionMode) {
                    handleToggleFolderSelection(item.id);
                  } else {
                    router.push({ pathname: '/note-folder/[id]', params: { id: item.id } } as any);
                  }
                }}
                onLongPress={() => handleFolderLongPress(item.id)}
                style={[
                  styles.folderCard, 
                  { backgroundColor: selectedFolderIds.includes(item.id) ? 'rgba(124, 58, 237, 0.2)' : theme.colors.surface },
                  selectedFolderIds.includes(item.id) ? { borderColor: theme.colors.primary, borderWidth: 1 } : {}
                ]}
              >
                <MaterialCommunityIcons name="folder-text" size={40} color={theme.colors.primary} />
                <View style={styles.folderInfo}>
                  <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>{item.name}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 8 }}>
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                      Created {new Date(item.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
                {!selectionMode && (
                  <>
                    <IconButton
                      icon="pencil"
                      size={20}
                      iconColor={theme.colors.onSurfaceVariant}
                      onPress={() => openRenameDialog(item.id, item.name)}
                    />
                    <IconButton
                      icon="delete"
                      size={20}
                      iconColor={theme.colors.error}
                      onPress={() => handleDeleteFolder(item.id, item.name)}
                    />
                  </>
                )}
              </TouchableOpacity>
            ))}

            {displayedNotes.length > 0 && (
              <View style={{ marginTop: filteredFolders.length > 0 ? 16 : 0 }}>
                <Text variant="titleMedium" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 8, marginLeft: 4 }}>
                  {searchQuery.trim() !== '' ? 'Matching Notes' : 'Unfoldered Notes'}
                </Text>
                <View>
                  {displayedNotes.map(note => {
                    const folderName = note.folderId ? folders.find(f => f.id === note.folderId)?.name : undefined;
                    return (
                      <NoteCard 
                        key={note.id} 
                        note={note} 
                        folderName={folderName}
                      onEdit={selectionMode ? undefined : handleEditNote}
                      onDelete={selectionMode ? undefined : ((noteId) => {
                        showAlert({
                          title: 'Delete Note?',
                          message: 'Are you sure you want to permanently delete this note?',
                          showCancel: true,
                          confirmText: 'Delete',
                          onConfirm: () => {
                            cancelNoteNotification(noteId);
                            deleteNote(noteId);
                            hideAlert();
                          }
                        });
                      })} 
                      selected={selectedNoteIds.includes(note.id)}
                      selectionMode={selectionMode}
                      onPress={() => {
                        if (selectionMode) {
                          handleToggleSelection(note.id);
                        }
                      }}
                      onLongPress={() => handleLongPress(note.id)}
                    />
                  );
                })}
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>

      <Portal>
        <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)} style={{ backgroundColor: theme.colors.surface }}>
          <Dialog.Title>{editingFolderId ? 'Rename Folder' : 'Create New Folder'}</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Folder Name"
              mode="flat"
              value={newFolderName}
              onChangeText={setNewFolderName}
              placeholder="e.g. Work Notes"
              autoFocus
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDialogVisible(false)}>Cancel</Button>
            <Button mode="contained" onPress={handleCreateOrRenameFolder}>{editingFolderId ? 'Save' : 'Create'}</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Portal>
        <Modal 
          visible={importPreviewVisible} 
          onDismiss={() => setImportPreviewVisible(false)}
          style={{ justifyContent: 'flex-end', margin: 0 }}
          contentContainerStyle={[styles.previewModal, { backgroundColor: theme.colors.background }]}
        >
          <View style={styles.previewHeader}>
            <Text variant="titleLarge" style={{ color: theme.colors.onBackground, fontWeight: 'bold' }}>Import Preview</Text>
            <IconButton icon="close" size={24} iconColor={theme.colors.onBackground} onPress={() => setImportPreviewVisible(false)} />
          </View>
          
          <View style={[styles.previewStats, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.statBox}>
              <Text variant="titleLarge" style={{ color: '#10B981', fontWeight: 'bold' }}>
                {parsedNotesPreview.filter(n => n.isValid).length}
              </Text>
              <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>Valid</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text variant="titleLarge" style={{ color: '#EF4444', fontWeight: 'bold' }}>
                {parsedNotesPreview.filter(n => !n.isValid).length}
              </Text>
              <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>Invalid</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text variant="titleLarge" style={{ color: theme.colors.onSurface, fontWeight: 'bold' }}>
                {parsedNotesPreview.length}
              </Text>
              <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>Total</Text>
            </View>
          </View>

          <ScrollView style={styles.previewList}>
            {parsedNotesPreview.map((note) => (
              <View key={note.id} style={[styles.previewCard, { backgroundColor: theme.colors.surface }]}>
                <MaterialCommunityIcons 
                  name={note.isValid ? "check-circle" : "close-circle"} 
                  size={24} 
                  color={note.isValid ? '#10B981' : '#EF4444'} 
                />
                <View style={styles.previewCardInfo}>
                  <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: 'bold' }}>
                    {note.name || 'Unknown'}
                  </Text>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    ₹{note.amount.toLocaleString()} • {note.duration} {note.durationType}
                  </Text>
                  {note.folderName ? (
                    <Text variant="labelSmall" style={{ color: theme.colors.primary, marginTop: 4 }}>
                      <MaterialCommunityIcons name="folder" size={12} /> {note.folderName}
                    </Text>
                  ) : null}
                  {!note.isValid && (
                    <Text variant="labelSmall" style={{ color: '#EF4444', marginTop: 4 }}>
                      {note.errorMsg}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </ScrollView>

          <View style={styles.previewFooter}>
            <Button mode="outlined" style={{ flex: 1, marginRight: 8 }} onPress={() => setImportPreviewVisible(false)}>
              Cancel
            </Button>
            <Button 
              mode="contained" 
              style={{ flex: 2 }} 
              disabled={parsedNotesPreview.filter(n => n.isValid).length === 0}
              onPress={handleConfirmImport}
            >
              Import {parsedNotesPreview.filter(n => n.isValid).length} Notes
            </Button>
          </View>
        </Modal>
      </Portal>

      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        onDismiss={hideAlert}
        onConfirm={alertConfig.onConfirm}
        showCancel={alertConfig.showCancel}
        confirmText={alertConfig.confirmText}
      />

      {/* Floating Action Button for Creating Note */}
      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        color="#fff"
        onPress={() => router.push('/create-note')}
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
    marginBottom: 8,
  },
  listContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 80,
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 32,
  },
  folderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
  },
  folderInfo: {
    flex: 1,
    marginLeft: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  previewModal: {
    margin: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '90%',
    paddingBottom: 40,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  previewStats: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    justifyContent: 'space-evenly',
  },
  statBox: {
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  previewList: {
    marginBottom: 16,
  },
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  previewCardInfo: {
    marginLeft: 16,
    flex: 1,
  },
  previewFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
