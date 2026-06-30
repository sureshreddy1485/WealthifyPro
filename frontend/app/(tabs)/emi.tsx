import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, BackHandler } from 'react-native';
import { Text, useTheme, IconButton, Portal, Dialog, TextInput, Button, FAB, Searchbar, Avatar } from 'react-native-paper';
import { Tabs, router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/authStore';
import { useEmiStore, EmiItem } from '@/store/emiStore';
import CustomAlert from '@/components/CustomAlert';
import EmiCard from '@/components/EmiCard';

export default function EmiScreen() {
  const theme = useTheme();
  const user = useAuthStore(state => state.user);
  const { folders, emis: allEmis, addFolder, renameFolder, deleteFolder, deleteEmi } = useEmiStore();
  
  const [dialogVisible, setDialogVisible] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);

  const orphanEmis = allEmis.filter(e => !e.folderId);
  const [selectedEmi, setSelectedEmi] = useState<EmiItem | null>(null);

  // Multi-select State
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedEmiIds, setSelectedEmiIds] = useState<string[]>([]);
  const [selectedFolderIds, setSelectedFolderIds] = useState<string[]>([]);

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
        if (next.length === 0 && selectedEmiIds.length === 0) setSelectionMode(false);
      } else {
        setSelectedFolderIds([...selectedFolderIds, folderId]);
      }
    }
  };

  const handleLongPress = (emiId: string) => {
    if (!selectionMode) {
      setSelectionMode(true);
      setSelectedEmiIds([emiId]);
    }
  };

  const handleToggleSelection = (emiId: string) => {
    if (selectionMode) {
      if (selectedEmiIds.includes(emiId)) {
        const next = selectedEmiIds.filter(id => id !== emiId);
        setSelectedEmiIds(next);
        if (next.length === 0 && selectedFolderIds.length === 0) setSelectionMode(false);
      } else {
        setSelectedEmiIds([...selectedEmiIds, emiId]);
      }
    }
  };

  const exitSelection = () => {
    setSelectionMode(false);
    setSelectedEmiIds([]);
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
    const totalCount = selectedEmiIds.length + selectedFolderIds.length;
    showAlert({
      title: 'Delete Selected?',
      message: `Are you sure you want to delete ${totalCount} items? (Folders will delete all their contents too)`,
      showCancel: true,
      confirmText: 'Delete',
      onConfirm: () => {
        selectedEmiIds.forEach(id => deleteEmi(id));
        selectedFolderIds.forEach(id => deleteFolder(id));
        exitSelection();
        hideAlert();
      }
    });
  };

  const handleCreateOrRenameFolder = () => {
    if (newFolderName.trim()) {
      if (editingFolderId) {
        renameFolder(editingFolderId, newFolderName.trim());
      } else {
        addFolder(newFolderName.trim());
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
      message: `Are you sure you want to delete "${name}"? All EMIs inside it will be permanently deleted.`,
      showCancel: true,
      confirmText: 'Delete',
      onConfirm: () => {
        deleteFolder(id);
        hideAlert();
      }
    });
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);

  const filteredFolders = folders
    .filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => a.createdAt - b.createdAt);
  
  const displayedEmis = (searchQuery.trim() !== ''
    ? allEmis.filter(e => 
        e.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        e.principal.toString().includes(searchQuery)
      )
    : orphanEmis).sort((a, b) => a.createdAt - b.createdAt);

  const allSelected = selectedEmiIds.length === displayedEmis.length && selectedFolderIds.length === filteredFolders.length;
  
  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedEmiIds([]);
      setSelectedFolderIds([]);
      setSelectionMode(false);
    } else {
      setSelectedEmiIds(displayedEmis.map(n => n.id));
      setSelectedFolderIds(filteredFolders.map(f => f.id));
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Tabs.Screen
        options={{
          headerTitle: selectionMode ? '' : isSearchActive ? () => (
            <Searchbar
              placeholder="Search EMIs or folders..."
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
              <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>{selectedEmiIds.length + selectedFolderIds.length} Selected</Text>
            </View>
          ) : isSearchActive ? (
            <IconButton icon="arrow-left" size={24} onPress={() => { setIsSearchActive(false); setSearchQuery(''); }} />
          ) : undefined,
          headerRight: () => (
            <View style={{ flexDirection: 'row' }}>
              {selectionMode ? (
                <View style={{flexDirection: 'row'}}>
                  <IconButton 
                    icon={allSelected ? "checkbox-multiple-marked" : "checkbox-multiple-blank-outline"} 
                    iconColor={theme.colors.primary} 
                    size={24} 
                    onPress={handleSelectAll} 
                  />
                  <IconButton icon="delete-outline" iconColor={theme.colors.error} size={24} onPress={deleteSelectedItems} />
                </View>
              ) : isSearchActive ? null : (
                <>
                  <IconButton
                    icon="magnify"
                    iconColor={theme.colors.onSurface}
                    size={24}
                    onPress={() => setIsSearchActive(true)}
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



      <ScrollView contentContainerStyle={styles.listContent}>
        {filteredFolders.length === 0 && displayedEmis.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="folder-open-outline" size={64} color={theme.colors.onSurfaceVariant} />
            <Text variant="titleMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 16 }}>
              No EMIs yet
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center', marginTop: 8 }}>
              Tap the calculator icon below to create your first calculation.
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
                    router.push({ pathname: '/emi-folder/[id]', params: { id: item.id } } as any);
                  }
                }}
                onLongPress={() => handleFolderLongPress(item.id)}
                style={[
                  styles.folderCard, 
                  { backgroundColor: selectedFolderIds.includes(item.id) ? 'rgba(124, 58, 237, 0.2)' : theme.colors.surface },
                  selectedFolderIds.includes(item.id) ? { borderColor: theme.colors.primary, borderWidth: 1 } : {}
                ]}
              >
                <MaterialCommunityIcons name="folder" size={40} color={theme.colors.primary} />
                <View style={styles.folderInfo}>
                  <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>{item.name}</Text>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    Created {new Date(item.createdAt).toLocaleDateString()}
                  </Text>
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

            {displayedEmis.length > 0 && (
              <View style={{ marginTop: filteredFolders.length > 0 ? 16 : 0 }}>
                <Text variant="titleMedium" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 8, marginLeft: 4 }}>
                  {searchQuery.trim() !== '' ? 'Matching EMIs' : 'Unfoldered EMIs'}
                </Text>
                <View>
                  {displayedEmis.map(e => {
                    const folderName = e.folderId ? folders.find(f => f.id === e.folderId)?.name : undefined;
                    return (
                      <EmiCard 
                        key={e.id} 
                        emi={e} 
                        folderName={folderName}
                        selected={selectedEmiIds.includes(e.id)}
                        selectionMode={selectionMode}
                        onPress={() => {
                          if (selectionMode) {
                            handleToggleSelection(e.id);
                          } else {
                            setSelectedEmi(e);
                          }
                        }}
                        onLongPress={() => handleLongPress(e.id)}
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
              placeholder="e.g. Home Loan"
              autoFocus
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDialogVisible(false)}>Cancel</Button>
            <Button mode="contained" onPress={handleCreateOrRenameFolder}>{editingFolderId ? 'Save' : 'Create'}</Button>
          </Dialog.Actions>
        </Dialog>
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

      {/* Floating Action Button for Global Calculator */}
      <FAB
        icon="calculator"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        color="#fff"
        onPress={() => router.push('/emi-calculator')}
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
    paddingBottom: 80, // Space for FAB
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
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
});
