import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Share, FlatList, BackHandler } from 'react-native';
import { Text, useTheme, FAB, List, Portal, Modal, Button, IconButton, Searchbar, ActivityIndicator, Appbar } from 'react-native-paper';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { useLedgerStore, LedgerItem } from '@/store/ledgerStore';
import CustomAlert from '@/components/CustomAlert';
import LedgerCard from '@/components/LedgerCard';

export default function FolderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();

  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setIsReady(true), 300);
    return () => clearTimeout(t);
  }, []);
  
  const { folders, ledgers: allLedgers, deleteLedger } = useLedgerStore();
  const folder = folders.find(f => f.id === id);
  const ledgers = allLedgers.filter(l => l.folderId === id);

  const [selectedLedger, setSelectedLedger] = useState<LedgerItem | null>(null);
  const viewShotRef = useRef<any>(null);

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

  const handleFolderDelete = () => {
    showAlert({
      title: 'Delete Folder?',
      message: `Are you sure you want to delete "${folder?.name}" and all its ledgers? This action cannot be undone.`,
      showCancel: true,
      confirmText: 'Delete Folder',
      requireAuth: true,
      onConfirm: () => {
        const { deleteFolder } = useLedgerStore.getState();
        deleteFolder(folder!.id);
        router.back();
      }
    });
  };

  const handleDeleteLedger = (ledgerId: string) => {
    showAlert({
      title: 'Delete Record?',
      message: 'Are you sure you want to permanently delete this calculation receipt?',
      showCancel: true,
      confirmText: 'Delete',
      requireAuth: true,
      onConfirm: () => {
        deleteLedger(ledgerId);
        setSelectedLedger(null);
        hideAlert();
      }
    });
  };

  // Multi-select State
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedLedgerIds, setSelectedLedgerIds] = useState<string[]>([]);

  const handleLongPress = (ledgerId: string) => {
    if (!selectionMode) {
      setSelectionMode(true);
      setSelectedLedgerIds([ledgerId]);
    }
  };

  const handleToggleSelection = (ledgerId: string) => {
    if (selectionMode) {
      if (selectedLedgerIds.includes(ledgerId)) {
        const next = selectedLedgerIds.filter(id => id !== ledgerId);
        setSelectedLedgerIds(next);
        if (next.length === 0) setSelectionMode(false);
      } else {
        setSelectedLedgerIds([...selectedLedgerIds, ledgerId]);
      }
    }
  };

  const exitSelection = () => {
    setSelectionMode(false);
    setSelectedLedgerIds([]);
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

  const deleteSelectedLedgers = () => {
    showAlert({
      title: 'Delete Ledgers?',
      message: `Are you sure you want to delete ${selectedLedgerIds.length} ledgers?`,
      showCancel: true,
      confirmText: 'Delete',
      requireAuth: true,
      onConfirm: () => {
        selectedLedgerIds.forEach(id => deleteLedger(id));
        exitSelection();
        hideAlert();
      }
    });
  };

  const shareAsImage = async () => {
    if (viewShotRef.current && viewShotRef.current.capture) {
      try {
        const uri = await viewShotRef.current.capture();
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(uri);
        } else {
          showAlert({ title: 'Error', message: 'Sharing is not available on this device.' });
        }
      } catch (e) {
        showAlert({ title: 'Error', message: 'Failed to capture or share image.' });
      }
    }
  };

  const shareAsText = async () => {
    if (!selectedLedger) return;
    const text = `Ledger Details:
Total: ₹${selectedLedger.total.toFixed(2)}
Principal: ₹${selectedLedger.principal.toFixed(2)}
Interest: ₹${selectedLedger.interest.toFixed(2)}
Rate: ${selectedLedger.rate}
Days: ${selectedLedger.duration}
Date: ${new Date(selectedLedger.createdAt).toLocaleDateString()}
Sent via WealthifyPro`;

    try {
      await Share.share({
        message: text,
      });
    } catch (error) {
      showAlert({ title: 'Error', message: 'Failed to share text.' });
    }
  };

  if (!folder) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Stack.Screen options={{ title: 'Not Found' }} />
        <Text>Folder not found</Text>
      </View>
    );
  }

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);

  const filteredLedgers = ledgers.filter(l => 
    l.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
    l.principal.toString().includes(searchQuery)
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Stack.Screen 
        options={{ 
          header: () => (
            <Appbar.Header style={{ backgroundColor: selectionMode ? '#1E0A3C' : theme.colors.surface, elevation: 0 }}>
              {selectionMode ? (
                <>
                  <Appbar.Action icon="close" onPress={exitSelection} iconColor={theme.colors.onSurface} />
                  <Appbar.Content title={`${selectedLedgerIds.length} Selected`} titleStyle={{ fontWeight: 'bold', color: theme.colors.onSurface, fontSize: 18 }} />
                  <Appbar.Action 
                    icon={selectedLedgerIds.length === filteredLedgers.length ? "checkbox-multiple-marked" : "checkbox-multiple-blank-outline"} 
                    iconColor={theme.colors.primary} 
                    onPress={() => {
                      if (selectedLedgerIds.length === filteredLedgers.length) {
                        setSelectedLedgerIds([]);
                        setSelectionMode(false);
                      } else {
                        setSelectedLedgerIds(filteredLedgers.map(n => n.id));
                      }
                    }} 
                  />
                  <Appbar.Action icon="delete-outline" iconColor={theme.colors.error} onPress={deleteSelectedLedgers} />
                </>
              ) : isSearchActive ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 16 }}>
                  <Appbar.Action icon="arrow-left" onPress={() => { setIsSearchActive(false); setSearchQuery(''); }} iconColor={theme.colors.onSurface} />
                  <Searchbar
                    placeholder="Search ledgers..."
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


      
      {filteredLedgers.length === 0 ? (
        <View style={styles.emptyState}>
          <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
            This folder is empty or no matching ledgers found.
          </Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center', marginTop: 8 }}>
            Use the calculator to calculate interest and save it here.
          </Text>
        </View>
      ) : !isReady ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredLedgers}
          keyExtractor={(ledger) => ledger.id}
          contentContainerStyle={styles.scrollContent}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          renderItem={({ item: ledger }) => (
            <LedgerCard 
              ledger={ledger}
              selected={selectedLedgerIds.includes(ledger.id)}
              selectionMode={selectionMode}
              onPress={() => {
                if (selectionMode) {
                  handleToggleSelection(ledger.id);
                } else {
                  setSelectedLedger(ledger);
                }
              }}
              onLongPress={() => handleLongPress(ledger.id)}
            />
          )}
        />
      )}

      {/* Floating Action Button for the Calculator */}
      <FAB
        icon="calculator"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        color="#fff"
        onPress={() => router.push({ pathname: '/interest-calculator', params: { folderId: folder.id } } as any)}
      />

      <Portal>
        <Modal 
          visible={!!selectedLedger} 
          onDismiss={() => setSelectedLedger(null)}
          contentContainerStyle={[styles.modalContent, { backgroundColor: theme.colors.surface }]}
        >
          {selectedLedger && (
            <View>
              <ViewShot ref={viewShotRef} options={{ format: 'jpg', quality: 1 }}>
                <View style={{ padding: 4, backgroundColor: theme.colors.background }}>
                  <View style={[styles.receiptBox, { borderColor: theme.colors.primary, backgroundColor: theme.colors.background }]}>
                    <Text variant="titleLarge" style={{ color: theme.colors.primary, fontWeight: 'bold', marginBottom: 16 }}>
                      Total: ₹{selectedLedger.total.toFixed(2)}
                    </Text>
                    
                    <Text variant="bodyLarge" style={styles.receiptLine}>• Principal: ₹{selectedLedger.principal.toFixed(2)}</Text>
                    <Text variant="bodyLarge" style={styles.receiptLine}>• Interest: ₹{selectedLedger.interest.toFixed(2)} (SI)</Text>
                    <Text variant="bodyLarge" style={styles.receiptLine}>• Rate: {selectedLedger.rate}</Text>
                    <Text variant="bodyLarge" style={styles.receiptLine}>• Days: {selectedLedger.duration}</Text>
                    
                    <View style={styles.receiptFooter}>
                      <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                        Date: {new Date(selectedLedger.createdAt).toLocaleDateString()}
                      </Text>
                      <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant, fontWeight: 'bold' }}>
                        WealthifyPro
                      </Text>
                    </View>
                  </View>
                </View>
              </ViewShot>

              <View style={styles.actionRow}>
                <Button 
                  mode="contained" 
                  icon="share-variant" 
                  onPress={shareAsImage}
                  style={[styles.actionBtn, { backgroundColor: '#A855F7' }]}
                >
                  Share Image
                </Button>
                <Button 
                  mode="contained" 
                  icon="text" 
                  onPress={shareAsText}
                  style={[styles.actionBtn, { backgroundColor: '#3B82F6' }]}
                >
                  Share Text
                </Button>
              </View>
              
              <View style={[styles.actionRow, { marginTop: 12 }]}>
                <Button 
                  mode="outlined" 
                  onPress={() => setSelectedLedger(null)} 
                  style={{ flex: 1 }}
                >
                  Close
                </Button>
                <Button 
                  mode="contained" 
                  icon="delete" 
                  onPress={() => handleDeleteLedger(selectedLedger.id)} 
                  style={{ flex: 1, backgroundColor: theme.colors.error }}
                >
                  Delete
                </Button>
              </View>
            </View>
          )}
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
    paddingBottom: 80, // Space for FAB
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  modalContent: {
    margin: 20,
    padding: 24,
    borderRadius: 16,
  },
  receiptBox: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
  },
  receiptLine: {
    marginBottom: 8,
    color: '#FFF',
  },
  receiptFooter: {
    marginTop: 24,
    alignItems: 'flex-end',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    borderRadius: 8,
  },
});
