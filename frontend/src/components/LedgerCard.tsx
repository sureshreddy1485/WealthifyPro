import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LedgerItem } from '@/store/ledgerStore';

interface LedgerCardProps {
  ledger: LedgerItem;
  folderName?: string;
  selected?: boolean;
  selectionMode?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
}

export default function LedgerCard({ ledger, folderName, selected, selectionMode, onPress, onLongPress }: LedgerCardProps) {
  const theme = useTheme();
  
  return (
    <TouchableOpacity 
      activeOpacity={0.7} 
      onPress={onPress} 
      onLongPress={onLongPress}
      delayLongPress={300}
    >
      <View style={[
        styles.card, 
        { 
          backgroundColor: selected ? 'rgba(124, 58, 237, 0.15)' : theme.colors.surface, 
          borderColor: selected ? theme.colors.primary : theme.colors.surfaceVariant, 
          borderWidth: selected ? 2 : 1 
        }
      ]}>
        <View style={styles.contentRow}>
          {/* Left Checkbox / Icon */}
          <View style={[
            styles.avatar, 
            { backgroundColor: selected ? theme.colors.primary : theme.colors.surfaceVariant }
          ]}>
            {selected ? (
              <MaterialCommunityIcons name="check" size={24} color="#fff" />
            ) : (
              <MaterialCommunityIcons name="calculator-variant-outline" size={24} color={theme.colors.primary} />
            )}
          </View>

          {/* Center Details */}
          <View style={styles.details}>
            <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: 'bold' }}>
              {ledger.customerName || "Untitled Ledger"}
            </Text>
            {folderName && (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                <MaterialCommunityIcons name="folder-outline" size={14} color={theme.colors.onSurfaceVariant} />
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginLeft: 4 }}>
                  {folderName}
                </Text>
              </View>
            )}
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
              Principal: ₹{ledger.principal.toLocaleString()}
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              Rate: {ledger.rate} | Days: {ledger.duration}
            </Text>
          </View>

          {/* Right Details */}
          <View style={styles.rightDetails}>
            <Text style={{ color: theme.colors.primary, fontWeight: 'bold', fontSize: 16 }}>
              +₹{ledger.interest.toFixed(2)}
            </Text>
            <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 12, marginTop: 4 }}>
              {new Date(ledger.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  contentRow: {
    flexDirection: 'row',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  details: {
    flex: 1,
    justifyContent: 'center',
  },
  rightDetails: {
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginLeft: 8,
  }
});
