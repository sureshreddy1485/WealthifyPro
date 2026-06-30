import React, { useState, useRef } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { TextInput, Button, Text, SegmentedButtons, useTheme, Portal, Modal, IconButton, List, Appbar } from 'react-native-paper';
import { DatePickerModal, en, registerTranslation } from 'react-native-paper-dates';
import CustomAlert from '@/components/CustomAlert';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { useLedgerStore } from '@/store/ledgerStore';
import { useLocalSearchParams, router, Stack } from 'expo-router';

// Register locale for react-native-paper-dates
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

export default function InterestCalculatorScreen() {
  const { folderId } = useLocalSearchParams<{ folderId?: string }>();
  const theme = useTheme();

  const [customerName, setCustomerName] = useState('');
  const [principal, setPrincipal] = useState('');
  const [rate, setRate] = useState('');
  const [duration, setDuration] = useState('');
  const [mode, setMode] = useState('simple');
  const [rateType, setRateType] = useState('rupees');

  // Days Calc Modal State
  const [daysModalVisible, setDaysModalVisible] = useState(false);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [openStartDatePicker, setOpenStartDatePicker] = useState(false);
  const [openEndDatePicker, setOpenEndDatePicker] = useState(false);

  const [calcResult, setCalcResult] = useState<{
    principal: number;
    interest: number;
    total: number;
    rate: number;
    duration: number;
    rateType: string;
    mode: string;
  } | null>(null);

  // Basic Calc Modal State
  const [basicModalVisible, setBasicModalVisible] = useState(false);
  const [calcDisplay, setCalcDisplay] = useState('0');

  // Save Modal State
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  
  const folders = useLedgerStore(state => state.folders);
  const addLedger = useLedgerStore(state => state.addLedger);
  const addFolder = useLedgerStore(state => state.addFolder);

  // Custom Alert State
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
  });

  const showAlert = (title: string, message: string) => {
    setAlertConfig({ visible: true, title, message });
  };

  const hideAlert = () => {
    setAlertConfig(prev => ({ ...prev, visible: false }));
  };

  const viewShotRef = useRef<any>(null);

  const handleCalculateInterest = () => {
    const p = parseFloat(principal);
    const r = parseFloat(rate);
    const d = parseFloat(duration);

    if (isNaN(p) || isNaN(r) || isNaN(d)) {
      showAlert('Invalid Input', 'Please fill Principal, Rate, and Duration correctly.');
      return;
    }

    let interest = 0;
    
    // Determine daily rate multiplier
    // If 'percent': Rate is % per annum -> Daily rate = (R / 100) / 365
    // If 'rupees': Rate is ₹ per ₹100 per month -> Daily rate = (R / 100) / 30
    const dailyRateMultiplier = rateType === 'percent' ? (r / 100) / 365 : (r / 100) / 30;

    if (mode === 'simple') {
      interest = p * dailyRateMultiplier * d;
    } else {
      const totalCompound = p * Math.pow((1 + dailyRateMultiplier), d);
      interest = totalCompound - p;
    }

    const total = p + interest;
    
    setCalcResult({
      principal: p,
      interest,
      total,
      rate: r,
      duration: d,
      rateType,
      mode,
    });
  };

  const handleApplyDays = () => {
    const days = getDays30360(startDate, endDate);
    setDuration(days.toString());
    setDaysModalVisible(false);
  };

  const handleCalcKeyPress = (key: string) => {
    if (key === 'C') {
      setCalcDisplay('0');
    } else if (key === '=') {
      try {
        // eslint-disable-next-line no-eval
        const result = eval(calcDisplay);
        setCalcDisplay(String(result));
      } catch (e) {
        setCalcDisplay('Error');
      }
    } else {
      setCalcDisplay(prev => (prev === '0' || prev === 'Error' ? key : prev + key));
    }
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
        // Find or create "General" folder
        const { folders: currentFolders, addFolder: storeAddFolder } = useLedgerStore.getState();
        let generalFolder = currentFolders.find(f => f.name === 'General');
        if (!generalFolder) {
          storeAddFolder('General');
          const { folders: updatedFolders } = useLedgerStore.getState();
          generalFolder = updatedFolders.find(f => f.name === 'General');
        }
        resolvedFolderId = generalFolder?.id || null;
      }

      addLedger({
        folderId: resolvedFolderId,
        customerName: customerName || 'Untitled Ledger',
        principal: calcResult.principal,
        rate: calcResult.rate,
        duration: calcResult.duration,
        interest: calcResult.interest,
        total: calcResult.total,
      });
      setSaveModalVisible(false);
      
      showAlert('Success', resolvedFolderId ? 'Ledger saved to folder!' : 'Ledger saved successfully!');
      
      // Delay navigation slightly so user sees alert
      setTimeout(() => {
        hideAlert();
        if (resolvedFolderId) {
          router.replace({ pathname: '/folder/[id]', params: { id: resolvedFolderId } } as any);
        } else {
          router.replace('/(tabs)/ledger');
        }
      }, 1500);
    }
  };

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      addFolder(newFolderName.trim());
      setNewFolderName('');
      setIsCreatingFolder(false);
    }
  };

  const calcButtons = [
    ['1', '2', '3', '/'],
    ['4', '5', '6', '*'],
    ['7', '8', '9', '-'],
    ['.', '0', 'C', '+'],
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Stack.Screen 
        options={{ 
          header: () => (
            <Appbar.Header style={{ backgroundColor: theme.colors.surface, elevation: 0 }}>
              <Appbar.BackAction onPress={() => router.back()} color={theme.colors.onSurface} />
              <Appbar.Content title="Interest Calculator" titleStyle={{ fontWeight: 'bold', color: theme.colors.primary }} />
            </Appbar.Header>
          )
        }} 
      />
      <ScrollView contentContainerStyle={styles.content}>
        
        <Text variant="labelLarge" style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>
          Customer Name (Optional)
        </Text>
        <TextInput
          mode="flat"
          placeholder="e.g. John Doe"
          value={customerName}
          onChangeText={setCustomerName}
          style={styles.input}
        />

        <View style={styles.actionRow}>
          <Button 
            mode="outlined" 
            icon="calculator" 
            onPress={() => setBasicModalVisible(true)}
            style={styles.actionBtn}
          >
            Basic Calc
          </Button>
          <Button 
            mode="contained" 
            icon="calendar-range" 
            onPress={() => setDaysModalVisible(true)}
            style={styles.actionBtn}
          >
            Days Calc
          </Button>
        </View>

        <Text variant="labelLarge" style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>
          Principal (₹)
        </Text>
        <TextInput
          mode="flat"
          keyboardType="numeric"
          placeholder="10000"
          value={principal}
          onChangeText={setPrincipal}
          style={styles.input}
        />

        <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <Text variant="labelLarge" style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>
              Interest Mode
            </Text>
            <SegmentedButtons
              value={mode}
              onValueChange={setMode}
              buttons={[
                { value: 'simple', label: 'Simple' },
                { value: 'compound', label: 'Compound' },
              ]}
              style={styles.segmented}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="labelLarge" style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>
              Rate Format
            </Text>
            <SegmentedButtons
              value={rateType}
              onValueChange={setRateType}
              buttons={[
                { value: 'rupees', label: '₹ (Rs)' },
                { value: 'percent', label: '% (P.A)' },
              ]}
              style={styles.segmented}
            />
          </View>
        </View>

        <Text variant="labelLarge" style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>
          {rateType === 'rupees' ? 'Rate (₹ per ₹100 per month)' : 'Rate (% per annum)'}
        </Text>
        <TextInput
          mode="flat"
          keyboardType="numeric"
          placeholder={rateType === 'rupees' ? '1.5' : '12'}
          value={rate}
          onChangeText={setRate}
          style={styles.input}
        />

        <Text variant="labelLarge" style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>
          Duration (Days)
        </Text>
        <TextInput
          mode="flat"
          keyboardType="numeric"
          placeholder="30"
          value={duration}
          onChangeText={setDuration}
          style={styles.input}
        />

        <Button
          mode="contained"
          onPress={handleCalculateInterest}
          style={styles.calculateBtn}
          contentStyle={{ paddingVertical: 8 }}
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
                    • Interest: ₹{calcResult.interest.toFixed(2)} ({calcResult.mode === 'simple' ? 'SI' : 'CI'})
                  </Text>
                  <Text variant="bodyLarge" style={styles.receiptLine}>
                    • Rate: {calcResult.rate}{calcResult.rateType === 'percent' ? '% P.A' : ' ₹/100/mo'}
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
                onPress={() => {
                  if (folderId) {
                    saveToFolder(folderId as string);
                  } else {
                    setSaveModalVisible(true);
                  }
                }}
                style={[styles.actionBtn, { backgroundColor: '#10B981' }]}
              >
                Save Ledger
              </Button>
            </View>
          </View>
        )}
      </ScrollView>

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
          <Text variant="titleLarge" style={{ fontWeight: 'bold', marginBottom: 16 }}>Select Folder</Text>
          
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

        {/* Days Calculator Modal */}
        <Modal 
          visible={daysModalVisible} 
          onDismiss={() => setDaysModalVisible(false)}
          contentContainerStyle={[styles.modalContent, { backgroundColor: theme.colors.surface }]}
        >
          <View style={styles.modalHeader}>
            <Text variant="titleLarge" style={{ fontWeight: 'bold' }}>Date Difference</Text>
            <IconButton icon="close" onPress={() => setDaysModalVisible(false)} />
          </View>
          
          <Text variant="labelLarge" style={styles.label}>Start Date</Text>
          <TouchableOpacity onPress={() => setOpenStartDatePicker(true)} activeOpacity={0.8}>
            <View pointerEvents="none">
              <TextInput
                mode="flat"
                value={startDate.toLocaleDateString()}
                style={styles.input}
                right={<TextInput.Icon icon="calendar" />}
              />
            </View>
          </TouchableOpacity>

          <Text variant="labelLarge" style={styles.label}>End Date</Text>
          <TouchableOpacity onPress={() => setOpenEndDatePicker(true)} activeOpacity={0.8}>
            <View pointerEvents="none">
              <TextInput
                mode="flat"
                value={endDate.toLocaleDateString()}
                style={styles.input}
                right={<TextInput.Icon icon="calendar" />}
              />
            </View>
          </TouchableOpacity>

          <Text style={{ textAlign: 'center', marginVertical: 24, color: theme.colors.onSurfaceVariant }}>
            Difference is {getDays30360(startDate, endDate)} days (30/360)
          </Text>

          <Button mode="contained" onPress={handleApplyDays} style={{ borderRadius: 8 }}>
            Apply Difference
          </Button>
        </Modal>

        {/* Basic Calculator Modal */}
        <Modal 
          visible={basicModalVisible} 
          onDismiss={() => setBasicModalVisible(false)}
          contentContainerStyle={[styles.modalContent, { backgroundColor: theme.colors.surface }]}
        >
          <View style={styles.modalHeader}>
            <Text variant="titleLarge" style={{ fontWeight: 'bold' }}>Basic Calculator</Text>
            <IconButton icon="close" onPress={() => setBasicModalVisible(false)} />
          </View>

          <View style={[styles.calcDisplayBox, { backgroundColor: theme.colors.surfaceVariant }]}>
            <Text variant="displaySmall" style={{ textAlign: 'right', color: theme.colors.onSurface }}>
              {calcDisplay}
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8, gap: 16 }}>
              <TouchableOpacity onPress={() => setPrincipal(calcDisplay)}>
                <Text style={{ color: theme.colors.primary, fontWeight: 'bold' }}>Apply to Principal</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.calcGrid}>
            {calcButtons.map((row, i) => (
              <View key={i} style={styles.calcRow}>
                {row.map(key => (
                  <TouchableOpacity 
                    key={key} 
                    style={[styles.calcKey, { backgroundColor: theme.colors.elevation.level3 }]}
                    onPress={() => handleCalcKeyPress(key)}
                  >
                    <Text variant="titleLarge">{key}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ))}
            <TouchableOpacity 
              style={[styles.calcEqualsRow, { backgroundColor: theme.colors.primary }]}
              onPress={() => handleCalcKeyPress('=')}
            >
              <Text variant="titleLarge" style={{ color: theme.colors.onPrimary }}>=</Text>
            </TouchableOpacity>
          </View>
        </Modal>
      </Portal>

      <DatePickerModal
        locale="en"
        mode="single"
        visible={openStartDatePicker}
        onDismiss={() => setOpenStartDatePicker(false)}
        date={startDate}
        startYear={2020}
        validRange={{ startDate: new Date(2020, 0, 1) }}
        onConfirm={(params: { date?: Date }) => {
          setOpenStartDatePicker(false);
          if (params.date) setStartDate(params.date);
        }}
      />

      <DatePickerModal
        locale="en"
        mode="single"
        visible={openEndDatePicker}
        onDismiss={() => setOpenEndDatePicker(false)}
        date={endDate}
        startYear={2020}
        validRange={{ startDate: new Date(2020, 0, 1) }}
        onConfirm={(params: { date?: Date }) => {
          setOpenEndDatePicker(false);
          if (params.date) setEndDate(params.date);
        }}
      />

      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        onDismiss={hideAlert}
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
    gap: 4,
    paddingBottom: 40,
  },
  label: {
    marginTop: 8,
    marginBottom: 4,
  },
  input: {
    backgroundColor: 'transparent',
    marginBottom: 12,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 8,
  },
  actionBtn: {
    flex: 1,
    borderRadius: 8,
  },
  segmented: {
    marginVertical: 12,
  },
  calculateBtn: {
    marginTop: 24,
    borderRadius: 12,
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
  modalContent: {
    margin: 20,
    padding: 24,
    borderRadius: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  calcDisplayBox: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    minHeight: 100,
    justifyContent: 'center',
  },
  calcGrid: {
    gap: 12,
  },
  calcRow: {
    flexDirection: 'row',
    gap: 12,
  },
  calcKey: {
    flex: 1,
    height: 60,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calcEqualsRow: {
    width: '100%',
    height: 60,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
});
