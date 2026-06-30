import React, { useState, useMemo, useRef } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, TextInput, Button, useTheme, Portal, Dialog, IconButton, Modal, List, Appbar } from 'react-native-paper';
import { DatePickerModal, en, registerTranslation } from 'react-native-paper-dates';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { useNoteStore } from '@/store/noteStore';
import { useLedgerStore } from '@/store/ledgerStore';
import CustomAlert from '@/components/CustomAlert';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';

registerTranslation('en', en);

function getDays30360(d1: Date, d2: Date) {
  let day1 = d1.getDate();
  let month1 = d1.getMonth() + 1;
  let year1 = d1.getFullYear();

  let day2 = d2.getDate();
  let month2 = d2.getMonth() + 1;
  let year2 = d2.getFullYear();

  if (day1 === 31) day1 = 30;
  if (day2 === 31 && day1 === 30) day2 = 30;

  return 360 * (year2 - year1) + 30 * (month2 - month1) + (day2 - day1);
}

export default function NoteCalculatorScreen() {
  const { noteId } = useLocalSearchParams<{ noteId: string }>();
  const theme = useTheme();
  
  const { notes, editNote, deleteNote } = useNoteStore();
  const note = notes.find(n => n.id === noteId);

  const [endDate, setEndDate] = useState(new Date());
  const [openEndDatePicker, setOpenEndDatePicker] = useState(false);
  const [rate, setRate] = useState('');

  // Workflow State
  const [deleteNoteDialogVisible, setDeleteNoteDialogVisible] = useState(false);
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  
  const { folders, addLedger, addFolder } = useLedgerStore();

  const [calcResult, setCalcResult] = useState<{
    principal: number;
    interest: number;
    total: number;
    duration: number;
    rate: number;
  } | null>(null);

  const [alertConfig, setAlertConfig] = useState({
    visible: false, title: '', message: '',
  });

  const showAlert = (title: string, message: string) => setAlertConfig({ visible: true, title, message });
  const viewShotRef = useRef<any>(null);

  const durationDays = useMemo(() => {
    if (!note) return 0;
    return getDays30360(new Date(note.startDate), endDate);
  }, [note, endDate]);

  if (!note) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Stack.Screen options={{ title: 'Not Found' }} />
        <Text>Note not found</Text>
        <Button onPress={() => router.back()} style={{ marginTop: 16 }}>Go Back</Button>
      </View>
    );
  }

  const handleCalculate = () => {
    const r = parseFloat(rate);
    if (isNaN(r)) {
      showAlert('Invalid Input', 'Please enter a valid interest rate.');
      return;
    }

    const p = note.amount;
    const d = durationDays;
    
    // Rate is ₹ per ₹100 per month
    const dailyRateMultiplier = (r / 100) / 30;
    const interest = p * dailyRateMultiplier * d;
    const total = p + interest;

    setCalcResult({ principal: p, interest, total, duration: d, rate: r });
  };

  const shareImage = async () => {
    if (viewShotRef.current && viewShotRef.current.capture) {
      try {
        const uri = await viewShotRef.current.capture();
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(uri);
        } else {
          showAlert('Error', 'Sharing is not available on this device.');
        }
      } catch (e) {
        showAlert('Error', 'Failed to capture or share image.');
      }
    }
  };

  const saveToFolder = (targetFolderId: string | null) => {
    if (calcResult) {
      let resolvedFolderId = targetFolderId;

      if (!resolvedFolderId) {
        const currentFolders = useLedgerStore.getState().folders;
        let generalFolder = currentFolders.find(f => f.name === 'General');
        if (!generalFolder) {
          useLedgerStore.getState().addFolder('General');
          const updatedFolders = useLedgerStore.getState().folders;
          generalFolder = updatedFolders.find(f => f.name === 'General');
        }
        resolvedFolderId = generalFolder?.id || null;
      }

      addLedger({
        folderId: resolvedFolderId,
        customerName: note.name || 'Untitled Note Ledger',
        principal: calcResult.principal,
        rate: calcResult.rate,
        duration: calcResult.duration,
        interest: calcResult.interest,
        total: calcResult.total,
      });

      setSaveModalVisible(false);
      
      // Mark note as given since it's now settled and saved as a ledger
      editNote(note.id, { isGiven: true });
      
      // Prompt user to delete or keep the original note
      setTimeout(() => setDeleteNoteDialogVisible(true), 300);
    }
  };

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      addFolder(newFolderName.trim());
      setNewFolderName('');
      setIsCreatingFolder(false);
    }
  };

  const handleDeleteOption = (shouldDelete: boolean) => {
    if (shouldDelete) {
      deleteNote(note.id);
      showAlert('Success', 'Note deleted and saved to ledger.');
    } else {
      showAlert('Success', 'Note kept and saved to ledger.');
    }
    setDeleteNoteDialogVisible(false);
    setTimeout(() => {
      router.replace('/(tabs)/ledger');
    }, 1500);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Stack.Screen 
        options={{ 
          title: 'Calculate Interest',
          headerStyle: { backgroundColor: theme.colors.background },
          headerTintColor: theme.colors.onSurface,
          headerLeft: () => (
            <IconButton 
              icon="arrow-left" 
              iconColor={theme.colors.onSurface} 
              size={24} 
              onPress={() => router.back()} 
              style={{ marginLeft: -8 }}
            />
          )
        }} 
      />

      <ScrollView contentContainerStyle={styles.content}>
        
        <View style={[styles.card, { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.1)', borderWidth: 1 }]}>
          <Text variant="titleLarge" style={{ color: theme.colors.onSurface, fontWeight: 'bold', marginBottom: 8 }}>
            {note.name || "Untitled Note"}
          </Text>
          
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            Principal Amount:
          </Text>
          <Text variant="displaySmall" style={{ color: theme.colors.primary, fontWeight: 'bold', marginBottom: 16 }}>
            ₹{note.amount.toLocaleString()}
          </Text>

          <View style={styles.row}>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>Start Date:</Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
              {new Date(note.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </Text>
          </View>

          <View style={[styles.row, { alignItems: 'center', marginVertical: 12 }]}>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>End Date:</Text>
            <TouchableOpacity 
              onPress={() => setOpenEndDatePicker(true)}
              style={[styles.dateButton, { backgroundColor: '#1E0A3C', borderColor: 'rgba(124, 58, 237, 0.2)', borderWidth: 1 }]}
            >
              <IconButton icon="calendar-month-outline" size={16} iconColor={theme.colors.primary} style={{ margin: 0, padding: 0 }} />
              <Text style={{ color: theme.colors.primary, marginLeft: 6, fontWeight: '500' }}>
                {endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.row}>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>Duration:</Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, fontWeight: 'bold' }}>
              {durationDays} Days
            </Text>
          </View>
        </View>

        <Text variant="labelLarge" style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>
          Interest Rate (₹ per ₹100 per month) *
        </Text>
        <TextInput
          mode="flat"
          keyboardType="numeric"
          placeholder="e.g., 1.5"
          value={rate}
          onChangeText={setRate}
          style={styles.input}
        />

        <Button 
          mode="contained" 
          onPress={handleCalculate}
          style={styles.calcBtn}
          labelStyle={{ fontSize: 16, fontWeight: 'bold' }}
        >
          Calculate
        </Button>

        {calcResult && (
          <View style={{ marginTop: 24 }}>
            <ViewShot ref={viewShotRef} options={{ format: 'jpg', quality: 1 }}>
              <View style={{ padding: 4, backgroundColor: theme.colors.background }}>
                <View style={[styles.receiptBox, { borderColor: theme.colors.primary, backgroundColor: theme.colors.background }]}>
                  <Text variant="titleLarge" style={{ color: theme.colors.primary, fontWeight: 'bold', marginBottom: 16 }}>
                    Total: ₹{calcResult.total.toFixed(2)}
                  </Text>
                  
                  <Text variant="bodyLarge" style={styles.receiptLine}>• Principal: ₹{calcResult.principal.toFixed(2)}</Text>
                  <Text variant="bodyLarge" style={styles.receiptLine}>
                    • Interest: ₹{calcResult.interest.toFixed(2)}
                  </Text>
                  <Text variant="bodyLarge" style={styles.receiptLine}>
                    • Rate: {calcResult.rate} ₹/100/mo
                  </Text>
                  <Text variant="bodyLarge" style={styles.receiptLine}>• Days: {calcResult.duration}</Text>
                  
                  <View style={styles.receiptFooter}>
                    <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                      Date: {new Date().toLocaleDateString()}
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
                onPress={shareImage}
                style={[styles.actionBtn, { backgroundColor: '#A855F7' }]}
              >
                Share Image
              </Button>
              <Button 
                mode="contained" 
                icon="content-save" 
                onPress={() => setSaveModalVisible(true)}
                style={[styles.actionBtn, { backgroundColor: '#10B981' }]}
              >
                Settle & Save
              </Button>
            </View>
          </View>
        )}
      </ScrollView>

      <DatePickerModal
        locale="en"
        mode="single"
        visible={openEndDatePicker}
        onDismiss={() => setOpenEndDatePicker(false)}
        date={endDate}
        onConfirm={(params) => {
          setOpenEndDatePicker(false);
          if (params.date) setEndDate(params.date);
        }}
      />

      <Portal>
        {/* Save Ledger Modal */}
        <Modal 
          visible={saveModalVisible} 
          onDismiss={() => {
            setSaveModalVisible(false);
            setIsCreatingFolder(false);
          }}
          contentContainerStyle={[styles.modalContent, { backgroundColor: theme.colors.surface }]}
        >
          <Text variant="titleLarge" style={{ fontWeight: 'bold', marginBottom: 16 }}>Select Folder to Save Ledger</Text>
          
          {isCreatingFolder ? (
            <View style={{ marginBottom: 16 }}>
              <TextInput
                label="Folder Name"
                mode="flat"
                value={newFolderName}
                onChangeText={setNewFolderName}
                placeholder="e.g. John Doe"
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
                  No folders found. Please create one below to save your ledger.
                </Text>
              ) : (
                <ScrollView style={{ maxHeight: 300, marginBottom: 16 }}>
                  <List.Item
                    title="None (No Folder)"
                    left={props => <List.Icon {...props} icon="folder-remove-outline" />}
                    onPress={() => saveToFolder(null)}
                    style={{ backgroundColor: theme.colors.surfaceVariant, borderRadius: 8, marginBottom: 8 }}
                  />
                  {folders.map(folder => (
                    <List.Item
                      key={folder.id}
                      title={folder.name}
                      left={props => <List.Icon {...props} icon="folder" />}
                      onPress={() => saveToFolder(folder.id)}
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
              <Button onPress={() => setSaveModalVisible(false)}>
                Cancel
              </Button>
            </>
          )}
        </Modal>

        <Dialog visible={deleteNoteDialogVisible} onDismiss={() => setDeleteNoteDialogVisible(false)} style={{ backgroundColor: theme.colors.surface }}>
          <Dialog.Title>Keep or Delete Note?</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">The note has been successfully settled and saved to the Ledger! Do you want to keep the original Note in your records or permanently delete it?</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => handleDeleteOption(false)}>Keep Note</Button>
            <Button mode="contained" buttonColor={theme.colors.error} onPress={() => handleDeleteOption(true)}>Delete Note</Button>
          </Dialog.Actions>
        </Dialog>
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
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  card: { borderRadius: 16, padding: 20, marginBottom: 24 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  dateButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8 },
  label: { marginBottom: 8, fontWeight: '500' },
  input: { marginBottom: 24, backgroundColor: 'rgba(255, 255, 255, 0.05)' },
  calcBtn: { paddingVertical: 8, borderRadius: 12 },
  actionRow: { flexDirection: 'row', gap: 12, marginVertical: 8 },
  actionBtn: { flex: 1, borderRadius: 8 },
  receiptBox: { borderWidth: 1, borderRadius: 16, padding: 24, marginBottom: 16 },
  receiptLine: { marginBottom: 8, color: '#FFF' },
  receiptFooter: { marginTop: 24, alignItems: 'flex-end' },
  modalContent: { margin: 20, padding: 24, borderRadius: 16 },
});
