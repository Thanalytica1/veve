import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DashboardFilters, getDateRanges } from '../utils/analytics';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';

interface FiltersBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  filters: DashboardFilters;
  onApply: (filters: DashboardFilters) => void;
  availableTags: string[];
  resultCount?: number;
}

interface FilterChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

const FilterChip: React.FC<FilterChipProps> = ({ label, selected, onPress }) => {
  const colorScheme = useColorScheme();

  const styles = StyleSheet.create({
    chip: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: selected ? Colors[colorScheme ?? 'light'].tint : Colors[colorScheme ?? 'light'].tabIconDefault + '40',
      backgroundColor: selected
        ? Colors[colorScheme ?? 'light'].tint + '20'
        : 'transparent',
      marginRight: 8,
      marginBottom: 8,
    },
    chipText: {
      fontSize: 14,
      fontWeight: selected ? '600' : '500',
      color: selected
        ? Colors[colorScheme ?? 'light'].tint
        : Colors[colorScheme ?? 'light'].text,
    },
  });

  return (
    <TouchableOpacity
      style={styles.chip}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      <Text style={styles.chipText}>{label}</Text>
    </TouchableOpacity>
  );
};

export default function FiltersBottomSheet({
  visible,
  onClose,
  filters,
  onApply,
  availableTags,
  resultCount
}: FiltersBottomSheetProps) {
  const colorScheme = useColorScheme();
  const [localFilters, setLocalFilters] = useState<DashboardFilters>(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const dateRanges = getDateRanges();
  const { height } = Dimensions.get('window');

  const handleDateRangeChange = (rangeKey: string) => {
    setLocalFilters(prev => ({
      ...prev,
      dateRange: dateRanges[rangeKey]
    }));
  };

  const handleTagToggle = (tag: string) => {
    setLocalFilters(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  const handleStatusChange = (status: 'all' | 'active' | 'paused' | 'archived') => {
    setLocalFilters(prev => ({
      ...prev,
      status
    }));
  };

  const handleRiskLevelChange = (riskLevel: 'all' | 'at-risk' | 'inactive' | 'unprojectable') => {
    setLocalFilters(prev => ({
      ...prev,
      riskLevel
    }));
  };

  const handleReset = () => {
    const resetFilters: DashboardFilters = {
      dateRange: dateRanges['7d'],
      tags: [],
      status: 'all',
      riskLevel: 'all'
    };
    setLocalFilters(resetFilters);
  };

  const handleApply = () => {
    onApply(localFilters);
    onClose();
  };

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    container: {
      backgroundColor: Colors[colorScheme ?? 'light'].background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: height * 0.8,
      paddingBottom: 34, // Safe area
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: Colors[colorScheme ?? 'light'].tabIconDefault + '20',
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: Colors[colorScheme ?? 'light'].text,
    },
    closeButton: {
      padding: 4,
    },
    content: {
      paddingHorizontal: 20,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: Colors[colorScheme ?? 'light'].text,
      marginBottom: 12,
    },
    chipContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    footer: {
      flexDirection: 'row',
      padding: 20,
      gap: 12,
      borderTopWidth: 1,
      borderTopColor: Colors[colorScheme ?? 'light'].tabIconDefault + '20',
    },
    button: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
    },
    primaryButton: {
      backgroundColor: Colors[colorScheme ?? 'light'].tint,
    },
    secondaryButton: {
      backgroundColor: Colors[colorScheme ?? 'light'].tabIconDefault + '20',
    },
    buttonText: {
      fontSize: 16,
      fontWeight: '600',
    },
    primaryButtonText: {
      color: '#fff',
    },
    secondaryButtonText: {
      color: Colors[colorScheme ?? 'light'].text,
    },
    resultCount: {
      fontSize: 14,
      color: Colors[colorScheme ?? 'light'].tabIconDefault,
      marginTop: 4,
    },
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.overlay} onPress={onClose} activeOpacity={1}>
        <TouchableOpacity style={styles.container} activeOpacity={1}>
          <View style={styles.header}>
            <Text style={styles.title}>Filters</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons
                name="close"
                size={24}
                color={Colors[colorScheme ?? 'light'].tabIconDefault}
              />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Date Range</Text>
              <View style={styles.chipContainer}>
                {Object.entries(dateRanges).map(([key, range]) => (
                  <FilterChip
                    key={key}
                    label={range.label}
                    selected={localFilters.dateRange.label === range.label}
                    onPress={() => handleDateRangeChange(key)}
                  />
                ))}
              </View>
            </View>

            {availableTags.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Tags</Text>
                <View style={styles.chipContainer}>
                  {availableTags.map(tag => (
                    <FilterChip
                      key={tag}
                      label={tag}
                      selected={localFilters.tags.includes(tag)}
                      onPress={() => handleTagToggle(tag)}
                    />
                  ))}
                </View>
              </View>
            )}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Status</Text>
              <View style={styles.chipContainer}>
                {[
                  { key: 'all', label: 'All' },
                  { key: 'active', label: 'Active' },
                  { key: 'paused', label: 'Paused' },
                  { key: 'archived', label: 'Archived' }
                ].map(item => (
                  <FilterChip
                    key={item.key}
                    label={item.label}
                    selected={localFilters.status === item.key}
                    onPress={() => handleStatusChange(item.key as any)}
                  />
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Risk Level</Text>
              <View style={styles.chipContainer}>
                {[
                  { key: 'all', label: 'All' },
                  { key: 'at-risk', label: 'At-risk renewals' },
                  { key: 'inactive', label: 'Inactive 14+ days' },
                  { key: 'unprojectable', label: 'Unprojectable' }
                ].map(item => (
                  <FilterChip
                    key={item.key}
                    label={item.label}
                    selected={localFilters.riskLevel === item.key}
                    onPress={() => handleRiskLevelChange(item.key as any)}
                  />
                ))}
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={handleReset}
            >
              <Text style={[styles.buttonText, styles.secondaryButtonText]}>
                Reset
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={handleApply}
            >
              <Text style={[styles.buttonText, styles.primaryButtonText]}>
                Apply
                {resultCount !== undefined && (
                  <Text style={styles.resultCount}> ({resultCount})</Text>
                )}
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}