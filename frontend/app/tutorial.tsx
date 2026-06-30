import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, useTheme, Appbar, Surface, Icon } from 'react-native-paper';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TutorialScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header style={{ backgroundColor: theme.colors.surface, elevation: 0 }}>
        <Appbar.BackAction onPress={() => router.back()} color={theme.colors.onSurface} />
        <Appbar.Content title="How to use WealthifyPro" titleStyle={{ color: theme.colors.primary, fontWeight: 'bold' }} />
      </Appbar.Header>

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: 40 + insets.bottom }]}>
        
        <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={1}>
          <View style={styles.iconContainer}>
            <Icon source="notebook-outline" size={40} color={theme.colors.primary} />
          </View>
          <Text variant="titleLarge" style={[styles.title, { color: theme.colors.primary }]}>1. Notes Module</Text>
          <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 8 }}>
            The Notes module helps you keep track of text records and simple financial values.
          </Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, lineHeight: 22 }}>
            • <Text style={{ fontWeight: 'bold' }}>Folders:</Text> Organize your notes into custom folders.{"\n"}
            • <Text style={{ fontWeight: 'bold' }}>Values:</Text> Assign an optional amount/value to any note.{"\n"}
            • <Text style={{ fontWeight: 'bold' }}>Given/Taken:</Text> Mark notes visually to track if money was given or received.{"\n"}
            • <Text style={{ fontWeight: 'bold' }}>Reminders:</Text> Set due dates to get push notifications when a note is due.
          </Text>
        </Surface>

        <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={1}>
          <View style={styles.iconContainer}>
            <Icon source="book-open-variant" size={40} color={theme.colors.secondary} />
          </View>
          <Text variant="titleLarge" style={[styles.title, { color: theme.colors.secondary }]}>2. Ledger Module</Text>
          <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 8 }}>
            The Ledger is your go-to tool for calculating simple and compound interest over time.
          </Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, lineHeight: 22 }}>
            • <Text style={{ fontWeight: 'bold' }}>Principal & Rate:</Text> Enter the starting amount and the annual interest rate.{"\n"}
            • <Text style={{ fontWeight: 'bold' }}>Duration:</Text> Specify the loan duration in months or years.{"\n"}
            • <Text style={{ fontWeight: 'bold' }}>Auto-Calculation:</Text> The app instantly calculates the total interest accrued and the final maturity amount.{"\n"}
            • <Text style={{ fontWeight: 'bold' }}>Organization:</Text> Save your calculations into client or purpose-specific folders.
          </Text>
        </Surface>

        <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={1}>
          <View style={styles.iconContainer}>
            <Icon source="calculator-variant-outline" size={40} color="#10B981" />
          </View>
          <Text variant="titleLarge" style={[styles.title, { color: '#10B981' }]}>3. EMI Calculator</Text>
          <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 8 }}>
            Plan loans easily with the EMI (Equated Monthly Installment) module.
          </Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, lineHeight: 22 }}>
            • <Text style={{ fontWeight: 'bold' }}>Monthly Payments:</Text> Find out exactly how much you need to pay each month.{"\n"}
            • <Text style={{ fontWeight: 'bold' }}>Breakdown:</Text> Instantly see the split between total principal and total interest over the life of the loan.{"\n"}
            • <Text style={{ fontWeight: 'bold' }}>Save Records:</Text> Keep track of active EMI loans by saving them into folders.
          </Text>
        </Surface>

        <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={1}>
          <View style={styles.iconContainer}>
            <Icon source="shield-check" size={40} color="#F59E0B" />
          </View>
          <Text variant="titleLarge" style={[styles.title, { color: '#F59E0B' }]}>4. Security & Sync</Text>
          <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 8 }}>
            Your financial data is sensitive, so we built WealthifyPro to be highly secure.
          </Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, lineHeight: 22 }}>
            • <Text style={{ fontWeight: 'bold' }}>Cloud Sync:</Text> Everything is automatically backed up to the cloud. You can also trigger a manual sync in Settings.{"\n"}
            • <Text style={{ fontWeight: 'bold' }}>App Lock:</Text> Enable App Lock in Settings to require a Fingerprint or PIN to open the app.{"\n"}
            • <Text style={{ fontWeight: 'bold' }}>Data Deletion:</Text> Any destructive action (deleting a folder or account) requires your device's Security PIN to prevent accidental loss.
          </Text>
        </Surface>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  iconContainer: {
    marginBottom: 12,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 8,
  }
});
