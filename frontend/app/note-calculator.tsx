import React, { useState, useMemo, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, TextInput, Button, useTheme, Portal, Dialog, IconButton } from 'react-native-paper';
import { DatePickerModal, en, registerTranslation } from 'react-native-paper-dates';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { useNoteStore } from '@/store/noteStore';
import CustomAlert from '@/components/CustomAlert';

registerTranslation('en', en);

function getDays30360(d1: Date, d2: Date) {
  let day1 = d1.getDate();
  let month1 = d1.getMonth() + 1;
  let year1 = d1.getFullYear();

  let day2 = d2.getDate();
  let month2 = d2.getMonth() + 1;
  let year2 = d2.getFullYear();

  if (day1 === 31) {
    day1 = 30;
  }
  if (day2 === 31 && day1 === 30) {
    day2 = 30;
  }

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
  const [markGivenDialogVisible, setMarkGivenDialogVisible] = useState(false);
  const [deleteNoteDialogVisible, setDeleteNoteDialogVisible] = useState(false);
  
  const [calcResult, setCalcResult] = useState<{
    interest: number;
    total: number;
    duration: number;
  } | null>(null);

  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
  });

  const showAlert = (title: string, message: string) => {
    setAlertConfig({ visible: true, title, message });
  };

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

    setCalcResult({ interest, total, duration: d });
    setMarkGivenDialogVisible(true);
  };

  const handleMarkGiven = (markAsGiven: boolean) => {
    if (markAsGiven) {
      editNote(note.id, { isGiven: true });
      setMarkGivenDialogVisible(false);
      setTimeout(() => setDeleteNoteDialogVisible(true), 300);
    } else {
      setMarkGivenDialogVisible(false);
      // Just show results
      showAlert('Calculation Result', `Interest: ₹${calcResult?.interest.toLocaleString()}\nTotal: ₹${calcResult?.total.toLocaleString()}`);
    }
  };

  const handleDeleteOption = (shouldDelete: boolean) => {
    if (shouldDelete) {
      deleteNote(note.id);
    }
    setDeleteNoteDialogVisible(false);
    router.back();
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
        <Dialog visible={markGivenDialogVisible} onDismiss={() => setMarkGivenDialogVisible(false)} style={{ backgroundColor: theme.colors.surface }}>
          <Dialog.Title>Update Note Status</Dialog.Title>
          <Dialog.Content>
            <Text variant="titleMedium" style={{ marginBottom: 8 }}>Calculation complete!</Text>
            <Text variant="bodyMedium">Interest: ₹{calcResult?.interest.toLocaleString()}</Text>
            <Text variant="bodyMedium">Total Amount: ₹{calcResult?.total.toLocaleString()}</Text>
            <Text variant="bodyMedium" style={{ marginTop: 12 }}>Do you want to mark this note as given/settled?</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => handleMarkGiven(false)}>Skip</Button>
            <Button mode="contained" onPress={() => handleMarkGiven(true)}>Mark as Given</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Portal>
        <Dialog visible={deleteNoteDialogVisible} onDismiss={() => setDeleteNoteDialogVisible(false)} style={{ backgroundColor: theme.colors.surface }}>
          <Dialog.Title>Keep or Delete?</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">The note has been marked as given! Do you want to keep it in your records or permanently delete it?</Text>
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
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  label: {
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    marginBottom: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  calcBtn: {
    paddingVertical: 8,
    borderRadius: 12,
  },
});
