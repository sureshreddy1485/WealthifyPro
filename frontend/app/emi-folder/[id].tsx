import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Share, FlatList, BackHandler } from 'react-native';
import { Text, useTheme, FAB, Portal, Modal, Button, IconButton, Searchbar, ActivityIndicator, Appbar } from 'react-native-paper';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { useEmiStore, EmiItem } from '@/store/emiStore';
import CustomAlert from '@/components/CustomAlert';
import EmiCard from '@/components/EmiCard';

export default function EmiFolderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();

  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setIsReady(true), 300);
    return () => clearTimeout(t);
  }, []);
  
  const { folders, emis: allEmis, deleteEmi } = useEmiStore();
  const folder = folders.find(f => f.id === id);
  const emis = allEmis.filter(e => e.folderId === id);

  const [selectedEmi, setSelectedEmi] = useState<EmiItem | null>(null);
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
      message: `Are you sure you want to delete "${folder?.name}" and all its EMIs? This action cannot be undone.`,
      showCancel: true,
      confirmText: 'Delete Folder',
      requireAuth: true,
      onConfirm: () => {
        const { deleteFolder } = useEmiStore.getState();
        deleteFolder(folder!.id);
        router.back();
      }
    });
  };

  const handleDeleteEmi = (emiId: string) => {
    showAlert({
      title: 'Delete Record?',
      message: 'Are you sure you want to permanently delete this calculation receipt?',
      showCancel: true,
      confirmText: 'Delete',
      requireAuth: true,
      onConfirm: () => {
        deleteEmi(emiId);
        setSelectedEmi(null);
        hideAlert();
      }
    });
  };

  // Multi-select State
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedEmiIds, setSelectedEmiIds] = useState<string[]>([]);

  const handleLongPress = (emiId: string) => {
    if (!selectionMode) {
      setSelectionMode(true);
      setSelectedEmiIds([emiId]);
    }
  };

  const handleToggleSelection = (emiId: string) => {
    if (selectionMode) {
      if (selectedEmiIds.includes(emiId)) {
        const next = selectedEmiIds.filter(i => i !== emiId);
        setSelectedEmiIds(next);
        if (next.length === 0) setSelectionMode(false);
      } else {
        setSelectedEmiIds([...selectedEmiIds, emiId]);
      }
    }
  };

  const exitSelection = () => {
    setSelectionMode(false);
    setSelectedEmiIds([]);
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

  const deleteSelectedEmis = () => {
    showAlert({
      title: 'Delete EMIs?',
      message: `Are you sure you want to delete ${selectedEmiIds.length} EMIs?`,
      showCancel: true,
      confirmText: 'Delete',
      requireAuth: true,
      onConfirm: () => {
        selectedEmiIds.forEach(i => deleteEmi(i));
        exitSelection();
        hideAlert();
      }
    });
  };

  const shareReceipt = async () => {
    if (viewShotRef.current) {
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
    if (!selectedEmi) return;
    const text = `EMI Details:
Principal: ₹${selectedEmi.principal.toFixed(2)}
Rate: ${selectedEmi.rate}%
Tenure: ${selectedEmi.durationMonths} months
Monthly EMI: ₹${Math.round(selectedEmi.emi).toLocaleString()}
Total Interest: ₹${Math.round(selectedEmi.totalInterest).toLocaleString()}
Total Payment: ₹${Math.round(selectedEmi.totalPayment).toLocaleString()}
Date: ${new Date(selectedEmi.createdAt).toLocaleDateString()}
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

  const filteredEmis = emis.filter(l => 
    l.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
    l.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
                  <Appbar.Content title={`${selectedEmiIds.length} Selected`} titleStyle={{ fontWeight: 'bold', color: theme.colors.onSurface, fontSize: 18 }} />
                  <Appbar.Action 
                    icon={selectedEmiIds.length === filteredEmis.length ? "checkbox-multiple-marked" : "checkbox-multiple-blank-outline"} 
                    iconColor={theme.colors.primary} 
                    onPress={() => {
                      if (selectedEmiIds.length === filteredEmis.length) {
                        setSelectedEmiIds([]);
                        setSelectionMode(false);
                      } else {
                        setSelectedEmiIds(filteredEmis.map(n => n.id));
                      }
                    }} 
                  />
                  <Appbar.Action icon="delete-outline" iconColor={theme.colors.error} onPress={deleteSelectedEmis} />
                </>
              ) : isSearchActive ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 16 }}>
                  <Appbar.Action icon="arrow-left" onPress={() => { setIsSearchActive(false); setSearchQuery(''); }} iconColor={theme.colors.onSurface} />
                  <Searchbar
                    placeholder="Search EMIs..."
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
                </>
              )}
            </Appbar.Header>
          )
        }} 
      />


      
      {filteredEmis.length === 0 ? (
        <View style={styles.emptyState}>
          <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
            This folder is empty or no matching EMIs found.
          </Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center', marginTop: 8 }}>
            Use the calculator to calculate EMI and save it here.
          </Text>
        </View>
      ) : !isReady ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredEmis}
          keyExtractor={(e) => e.id}
          contentContainerStyle={styles.scrollContent}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          renderItem={({ item: e }) => (
            <EmiCard 
              emi={e}
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
          )}
        />
      )}

      {/* Floating Action Button for the Calculator */}
      <FAB
        icon="calculator"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        color="#fff"
        onPress={() => router.push({ pathname: '/emi-calculator', params: { folderId: folder.id } } as any)}
      />

      <Portal>
        <Modal 
          visible={!!selectedEmi} 
          onDismiss={() => setSelectedEmi(null)}
          contentContainerStyle={[styles.modalContent, { backgroundColor: theme.colors.surface }]}
        >
          {selectedEmi && (
            <View>
              <ViewShot ref={viewShotRef} options={{ format: 'jpg', quality: 1 }}>
                <View style={{ padding: 4, backgroundColor: theme.colors.background }}>
                  <View style={[styles.receiptBox, { borderColor: theme.colors.primary, backgroundColor: theme.colors.background }]}>
                    <Text variant="titleLarge" style={{ color: theme.colors.primary, fontWeight: 'bold', marginBottom: 16 }}>
                      Monthly EMI: ₹{Math.round(selectedEmi.emi).toLocaleString()}
                    </Text>
                    
                    <Text variant="bodyLarge" style={styles.receiptLine}>• Principal: ₹{selectedEmi.principal.toLocaleString()}</Text>
                    <Text variant="bodyLarge" style={styles.receiptLine}>• Interest: ₹{Math.round(selectedEmi.totalInterest).toLocaleString()}</Text>
                    <Text variant="bodyLarge" style={styles.receiptLine}>• Rate: {selectedEmi.rate}%</Text>
                    <Text variant="bodyLarge" style={styles.receiptLine}>• Tenure: {selectedEmi.durationMonths} months</Text>
                    <Text variant="bodyLarge" style={[styles.receiptLine, { color: theme.colors.primary, fontWeight: 'bold' }]}>• Total Payment: ₹{Math.round(selectedEmi.totalPayment).toLocaleString()}</Text>
                    
                    <View style={styles.receiptFooter}>
                      <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                        Date: {new Date(selectedEmi.createdAt).toLocaleDateString()}
                      </Text>
                      {selectedEmi.customerName && (
                        <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
                          For: {selectedEmi.customerName}
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
              </ViewShot>

              <View style={styles.modalActions}>
                <Button icon="share-variant" mode="contained-tonal" onPress={shareReceipt} style={{ flex: 1, marginRight: 8 }}>
                  Image
                </Button>
                <Button icon="message-text-outline" mode="contained-tonal" onPress={shareAsText} style={{ flex: 1, marginLeft: 8 }}>
                  Text
                </Button>
              </View>

              <Button 
                icon="delete-outline" 
                mode="text" 
                textColor="#EF4444" 
                onPress={() => handleDeleteEmi(selectedEmi.id)}
                style={{ marginTop: 8 }}
              >
                Delete Record
              </Button>
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
    borderWidth: 2,
    borderRadius: 12,
    padding: 16,
  },
  receiptLine: {
    marginBottom: 8,
  },
  receiptFooter: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: 24,
    justifyContent: 'space-between',
  }
});
