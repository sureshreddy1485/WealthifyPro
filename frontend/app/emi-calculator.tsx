import React, { useState, useRef } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { TextInput, Button, Text, useTheme, Portal, Modal, IconButton, SegmentedButtons, Appbar } from 'react-native-paper';
import CustomAlert from '@/components/CustomAlert';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { useEmiStore } from '@/store/emiStore';
import { useLocalSearchParams, router, Stack } from 'expo-router';

export default function EmiCalculatorScreen() {
  const { folderId } = useLocalSearchParams<{ folderId?: string }>();
  const theme = useTheme();

  const [customerName, setCustomerName] = useState('');
  const [principal, setPrincipal] = useState('');
  const [rate, setRate] = useState('');
  const [duration, setDuration] = useState('');
  const [durationType, setDurationType] = useState('years');

  const [calcResult, setCalcResult] = useState<{
    principal: number;
    emi: number;
    totalInterest: number;
    totalPayment: number;
    rate: number;
    durationMonths: number;
  } | null>(null);

  const viewShotRef = useRef<any>(null);

  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    onConfirm: () => {},
    showCancel: false,
    confirmText: 'OK'
  });

  const showAlert = (config: any) => {
    setAlertConfig({ visible: true, showCancel: false, confirmText: 'OK', onConfirm: hideAlert, ...config });
  };

  const hideAlert = () => setAlertConfig(prev => ({ ...prev, visible: false }));

  const calculateEmi = () => {
    if (!principal || !rate || !duration) {
      showAlert({ title: 'Error', message: 'Please enter Principal, Rate, and Duration.' });
      return;
    }

    const P = parseFloat(principal);
    const annualRate = parseFloat(rate);
    const r = annualRate / 12 / 100;
    
    let n = parseFloat(duration);
    if (durationType === 'years') {
      n = n * 12;
    }

    if (isNaN(P) || isNaN(annualRate) || isNaN(n) || P <= 0 || annualRate < 0 || n <= 0) {
      showAlert({ title: 'Error', message: 'Please enter valid positive numbers.' });
      return;
    }

    let emi = 0;
    let totalPayment = 0;
    let totalInterest = 0;

    if (annualRate === 0) {
      emi = P / n;
      totalPayment = P;
      totalInterest = 0;
    } else {
      emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
      totalPayment = emi * n;
      totalInterest = totalPayment - P;
    }

    setCalcResult({
      principal: P,
      emi,
      totalInterest,
      totalPayment,
      rate: annualRate,
      durationMonths: n,
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

  const saveToLedger = () => {
    if (!calcResult) return;

    let resolvedFolderId: string | null = folderId || null;

    if (!resolvedFolderId) {
      // Find or create "General" folder
      const { folders: currentFolders, addFolder: storeAddFolder } = useEmiStore.getState();
      let generalFolder = currentFolders.find(f => f.name === 'General');
      if (!generalFolder) {
        storeAddFolder('General');
        const { folders: updatedFolders } = useEmiStore.getState();
        generalFolder = updatedFolders.find(f => f.name === 'General');
      }
      resolvedFolderId = generalFolder?.id || null;
    }

    const { addEmi } = useEmiStore.getState();
    addEmi({
      folderId: resolvedFolderId,
      customerName: customerName.trim() || 'Untitled EMI',
      principal: calcResult.principal,
      rate: calcResult.rate,
      durationMonths: calcResult.durationMonths,
      emi: calcResult.emi,
      totalInterest: calcResult.totalInterest,
      totalPayment: calcResult.totalPayment
    });

    showAlert({
      title: 'Success',
      message: resolvedFolderId
        ? (folderId ? 'EMI saved to folder successfully!' : 'EMI saved to "General" folder!')
        : 'EMI saved successfully!',
      onConfirm: () => {
        hideAlert();
        setCalcResult(null);
        setPrincipal('');
        setRate('');
        setDuration('');
        setCustomerName('');
        router.back();
      }
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Stack.Screen 
        options={{ 
          header: () => (
            <Appbar.Header style={{ backgroundColor: theme.colors.surface, elevation: 0 }}>
              <Appbar.BackAction onPress={() => router.back()} color={theme.colors.onSurface} />
              <Appbar.Content title="EMI Calculator" titleStyle={{ fontWeight: 'bold', color: theme.colors.primary }} />
            </Appbar.Header>
          )
        }} 
      />
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        
        {/* Input Fields */}
      <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <TextInput
          label="Customer / Loan Name (Optional)"
          value={customerName}
          onChangeText={setCustomerName}
          mode="flat"
          style={styles.input}
        />
        
        <TextInput
          label="Principal Amount (₹)"
          value={principal}
          onChangeText={setPrincipal}
          keyboardType="numeric"
          mode="flat"
          style={styles.input}
        />

        <TextInput
          label="Annual Interest Rate (%)"
          value={rate}
          onChangeText={setRate}
          keyboardType="numeric"
          mode="flat"
          style={styles.input}
        />

        <TextInput
          label="Duration"
          value={duration}
          onChangeText={setDuration}
          keyboardType="numeric"
          mode="flat"
          style={styles.input}
        />
        <SegmentedButtons
          value={durationType}
          onValueChange={setDurationType}
          buttons={[
            { value: 'years', label: 'Years' },
            { value: 'months', label: 'Months' },
          ]}
          style={{ marginBottom: 12 }}
        />

        <Button mode="contained" onPress={calculateEmi} style={styles.calcBtn} labelStyle={{ fontSize: 16, fontWeight: 'bold' }}>
          Calculate EMI
        </Button>
      </View>

      {/* Result Card */}
      {calcResult && (
        <ViewShot ref={viewShotRef} options={{ format: 'jpg', quality: 1 }}>
          <View style={[styles.resultCard, { borderColor: theme.colors.primary, backgroundColor: theme.colors.background }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View>
                <Text variant="titleLarge" style={{ color: theme.colors.primary, fontWeight: 'bold' }}>
                  EMI Details
                </Text>
                {customerName ? (
                  <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
                    {customerName}
                  </Text>
                ) : null}
              </View>
              <IconButton icon="share-variant" iconColor={theme.colors.primary} size={24} onPress={shareReceipt} style={{ margin: 0 }} />
            </View>

            <View style={{ marginVertical: 16, gap: 12 }}>
              <View style={styles.resultRow}>
                <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>Monthly EMI</Text>
                <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: 'bold' }}>
                  ₹{Math.round(calcResult.emi).toLocaleString()}
                </Text>
              </View>
              <View style={styles.resultRow}>
                <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>Principal Amount</Text>
                <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: 'bold' }}>
                  ₹{calcResult.principal.toLocaleString()}
                </Text>
              </View>
              <View style={styles.resultRow}>
                <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>Total Interest</Text>
                <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: 'bold' }}>
                  ₹{Math.round(calcResult.totalInterest).toLocaleString()}
                </Text>
              </View>
              <View style={[styles.resultRow, { borderTopWidth: 1, borderTopColor: theme.colors.surfaceVariant, paddingTop: 12 }]}>
                <Text variant="bodyLarge" style={{ color: theme.colors.onSurface, fontWeight: 'bold' }}>Total Payment</Text>
                <Text variant="titleLarge" style={{ color: theme.colors.primary, fontWeight: 'bold' }}>
                  ₹{Math.round(calcResult.totalPayment).toLocaleString()}
                </Text>
              </View>
            </View>
          </View>
        </ViewShot>
      )}

      {/* Save Button */}
      {calcResult && (
        <Button 
          mode="contained-tonal" 
          onPress={saveToLedger} 
          style={styles.saveBtn}
          icon="content-save"
        >
          {folderId ? 'Save to Folder' : 'Save as Unfoldered'}
        </Button>
      )}

      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        onDismiss={hideAlert}
        onConfirm={alertConfig.onConfirm}
        showCancel={alertConfig.showCancel}
        confirmText={alertConfig.confirmText}
      />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
  },
  input: {
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  calcBtn: {
    marginTop: 16,
    paddingVertical: 6,
    borderRadius: 8,
  },
  resultCard: {
    borderWidth: 2,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  saveBtn: {
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 40,
  }
});
