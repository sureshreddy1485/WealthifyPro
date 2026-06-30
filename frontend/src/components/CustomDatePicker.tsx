import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { Text, useTheme, Portal, Modal, Button } from 'react-native-paper';

interface CustomDatePickerProps {
  visible: boolean;
  onDismiss: () => void;
  date: Date;
  onConfirm: (params: { date: Date }) => void;
  startYear?: number;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function CustomDatePicker({ visible, onDismiss, date, onConfirm, startYear = 2020 }: CustomDatePickerProps) {
  const theme = useTheme();
  const [view, setView] = useState<'days' | 'months' | 'years'>('days');
  const [activeDate, setActiveDate] = useState(date || new Date());
  
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (visible) {
      setActiveDate(date || new Date());
      setView('days');
    }
  }, [visible, date]);

  useEffect(() => {
    if (view === 'years' && scrollViewRef.current) {
      const yearIndex = activeDate.getFullYear() - startYear;
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: Math.max(0, Math.floor(yearIndex / 3) * 60), animated: false });
      }, 100);
    }
  }, [view]);

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const handleYearSelect = (year: number) => {
    const newDate = new Date(activeDate);
    newDate.setFullYear(year);
    setActiveDate(newDate);
    setView('months');
  };

  const handleMonthSelect = (monthIndex: number) => {
    const newDate = new Date(activeDate);
    newDate.setMonth(monthIndex);
    setActiveDate(newDate);
    setView('days');
  };

  const handleDaySelect = (day: number) => {
    const newDate = new Date(activeDate);
    newDate.setDate(day);
    setActiveDate(newDate);
  };

  const changeMonthBy = (delta: number) => {
    const newDate = new Date(activeDate);
    newDate.setMonth(newDate.getMonth() + delta);
    setActiveDate(newDate);
  };

  const renderYears = () => {
    const years = Array.from({ length: 50 }, (_, i) => startYear + i);
    return (
      <ScrollView ref={scrollViewRef} style={styles.scrollContainer}>
        <View style={styles.grid}>
          {years.map(y => (
            <TouchableOpacity 
              key={y} 
              style={[styles.gridItem, activeDate.getFullYear() === y && { backgroundColor: theme.colors.primary }]}
              onPress={() => handleYearSelect(y)}
            >
              <Text style={[styles.gridText, activeDate.getFullYear() === y && { color: theme.colors.onPrimary }]}>{y}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    );
  };

  const renderMonths = () => {
    return (
      <View style={[styles.scrollContainer, { justifyContent: 'center' }]}>
        <View style={styles.grid}>
          {MONTHS.map((m, i) => (
            <TouchableOpacity 
              key={m} 
              style={[styles.gridItem, activeDate.getMonth() === i && { backgroundColor: theme.colors.primary }]}
              onPress={() => handleMonthSelect(i)}
            >
              <Text style={[styles.gridText, activeDate.getMonth() === i && { color: theme.colors.onPrimary }]}>{m}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderDays = () => {
    const year = activeDate.getFullYear();
    const month = activeDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    
    const blanks = Array.from({ length: firstDay }, (_, i) => <View key={`blank-${i}`} style={styles.dayCell} />);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => (
      <TouchableOpacity 
        key={d} 
        style={[styles.dayCell, activeDate.getDate() === d && { backgroundColor: theme.colors.primary, borderRadius: 20 }]}
        onPress={() => handleDaySelect(d)}
      >
        <Text style={[styles.dayText, activeDate.getDate() === d && { color: theme.colors.onPrimary }]}>{d}</Text>
      </TouchableOpacity>
    ));

    return (
      <View style={styles.daysContainer}>
        <View style={styles.daysHeaderRow}>
          <TouchableOpacity onPress={() => changeMonthBy(-1)} style={styles.arrowBtn}><Text style={{fontSize: 20, color: theme.colors.onSurface}}>‹</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => setView('months')}>
            <Text style={{ fontWeight: 'bold', fontSize: 16, color: theme.colors.onSurface }}>
              {MONTHS[activeDate.getMonth()]} {activeDate.getFullYear()}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => changeMonthBy(1)} style={styles.arrowBtn}><Text style={{fontSize: 20, color: theme.colors.onSurface}}>›</Text></TouchableOpacity>
        </View>
        
        <View style={styles.weekDaysRow}>
          {DAYS.map((d, i) => <Text key={i} style={[styles.weekDayText, { color: theme.colors.onSurfaceVariant }]}>{d}</Text>)}
        </View>
        
        <View style={styles.daysGrid}>
          {blanks}
          {days}
        </View>
      </View>
    );
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
        <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
          <TouchableOpacity onPress={() => setView('years')}>
            <Text style={[styles.yearText, view === 'years' && styles.activeText, { color: theme.colors.onPrimary }]}>
              {activeDate.getFullYear()}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setView('days')}>
            <Text style={[styles.dateText, view !== 'years' && styles.activeText, { color: theme.colors.onPrimary }]}>
              {activeDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.body}>
          {view === 'years' && renderYears()}
          {view === 'months' && renderMonths()}
          {view === 'days' && renderDays()}
        </View>
        
        <View style={styles.footer}>
          <Button onPress={onDismiss} textColor={theme.colors.primary}>CANCEL</Button>
          <Button onPress={() => onConfirm({ date: activeDate })} textColor={theme.colors.primary}>OK</Button>
        </View>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modalContent: {
    margin: 24,
    borderRadius: 16,
    overflow: 'hidden',
    height: 480,
  },
  header: {
    padding: 24,
  },
  yearText: {
    fontSize: 16,
    opacity: 0.7,
  },
  dateText: {
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 4,
    opacity: 0.7,
  },
  activeText: {
    opacity: 1,
  },
  body: {
    flex: 1,
    padding: 16,
  },
  scrollContainer: {
    flex: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  gridItem: {
    width: '30%',
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    margin: '1.5%',
    borderRadius: 24,
  },
  gridText: {
    fontSize: 16,
  },
  daysContainer: {
    flex: 1,
  },
  daysHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  arrowBtn: {
    paddingHorizontal: 16,
  },
  weekDaysRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekDayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayText: {
    fontSize: 14,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 8,
    gap: 8,
  },
});
