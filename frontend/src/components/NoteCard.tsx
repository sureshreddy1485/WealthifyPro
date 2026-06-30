import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, useTheme, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NoteItem } from '@/store/noteStore';
import { router } from 'expo-router';

interface NoteCardProps {
  note: NoteItem;
  folderName?: string;
  onDelete?: (id: string) => void;
  onEdit?: (id: string) => void;
  selected?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
  selectionMode?: boolean;
}

export default function NoteCard({ note, folderName, onDelete, onEdit, selected, onPress, onLongPress, selectionMode }: NoteCardProps) {
  const theme = useTheme();

  // Calculate days remaining
  const now = new Date();
  const end = new Date(note.endDate);
  const diffTime = end.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  const isOverdue = diffDays < 0;
  
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
          {/* Left Avatar */}
          <View style={[
            styles.avatar, 
            { backgroundColor: selected ? theme.colors.primary : theme.colors.surfaceVariant }
          ]}>
            {selected ? (
              <MaterialCommunityIcons name="check" size={24} color="#fff" />
            ) : (
              <MaterialCommunityIcons 
                name="bell" 
                size={24} 
                color={
                  isOverdue ? '#EF4444' : 
                  diffDays <= 30 ? '#EAB308' : 
                  '#22C55E'
                } 
              />
            )}
          </View>

        {/* Center Details */}
        <View style={styles.details}>
          <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: 'bold' }}>
            {note.name || "Untitled Note"}
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
            Amount: ₹{note.amount.toLocaleString()}
          </Text>
          
          <View style={styles.dueRow}>
            <MaterialCommunityIcons name="calendar-blank-outline" size={14} color={theme.colors.onSurfaceVariant} />
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginLeft: 4 }}>
              Due: {end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </Text>
          </View>
          
          {note.isGiven ? (
            <View style={[
              styles.pill, 
              { backgroundColor: 'rgba(34, 197, 94, 0.15)' }
            ]}>
              <Text style={[
                styles.pillText, 
                { color: '#22C55E' }
              ]}>
                Settled / Given
              </Text>
            </View>
          ) : (
            <View style={[
              styles.pill, 
              { backgroundColor: isOverdue ? 'rgba(239, 68, 68, 0.15)' : 'rgba(124, 58, 237, 0.15)' }
            ]}>
              <Text style={[
                styles.pillText, 
                { color: isOverdue ? '#EF4444' : theme.colors.primary }
              ]}>
                {isOverdue ? `${Math.abs(diffDays)} days overdue` : `${diffDays} days remaining`}
              </Text>
            </View>
          )}
        </View>

        {/* Right Actions */}
        {!selectionMode && (
          <View style={styles.actions}>
            {onEdit && (
              <IconButton
                icon="pencil"
                size={20}
                iconColor={theme.colors.onSurfaceVariant}
                style={[styles.iconBtn, { backgroundColor: 'rgba(255, 255, 255, 0.05)' }]}
                onPress={() => onEdit(note.id)}
              />
            )}
            <IconButton
              icon="calculator"
              size={20}
              iconColor={theme.colors.primary}
              style={[styles.iconBtn, { backgroundColor: 'rgba(124, 58, 237, 0.1)' }]}
              onPress={() => {
                 router.push({
                   pathname: '/note-calculator',
                   params: { noteId: note.id }
                 } as any);
              }}
            />
            {onDelete && (
              <IconButton
                icon="delete-outline"
                size={20}
                iconColor="#EF4444"
                style={[styles.iconBtn, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}
                onPress={() => onDelete(note.id)}
              />
            )}
          </View>
        )}
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
  dueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  pill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  pillText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: -4, // Reduce gap between action icons
  },
  iconBtn: {
    margin: 0, // Override default paper margins
  }
});
