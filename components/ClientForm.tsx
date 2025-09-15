import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Client, ClientInput } from '../types/client';
import { validateClientForm, normalizePhone, formatPhone, ValidationErrors } from '../utils/validation';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';

interface ClientFormProps {
  client?: Client | null;
  onSave: (input: ClientInput) => Promise<void>;
  onCancel: () => void;
}

export default function ClientForm({ client, onSave, onCancel }: ClientFormProps) {
  const colorScheme = useColorScheme();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});

  const [formData, setFormData] = useState({
    displayName: client?.displayName || '',
    firstName: client?.firstName || '',
    lastName: client?.lastName || '',
    email: client?.email || '',
    phone: client?.phone || '',
    packageName: client?.package.packageName || '',
    totalSessions: client?.package.totalSessions?.toString() || '0',
    sessionsRemaining: client?.package.sessionsRemaining?.toString() || '0',
    pricePerSession: client?.package.pricePerSession?.toString() || '0',
    startDate: client?.dates.startDate || '',
    endDate: client?.dates.endDate || '',
    notes: client?.notes || '',
    tags: client?.tags.join(', ') || '',
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async () => {
    const validationData = {
      ...formData,
      totalSessions: parseInt(formData.totalSessions) || 0,
      sessionsRemaining: parseInt(formData.sessionsRemaining) || 0,
      tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
    };

    const newErrors = validateClientForm(validationData);
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const input: ClientInput = {
        displayName: formData.displayName || null,
        firstName: formData.firstName || null,
        lastName: formData.lastName || null,
        email: formData.email || null,
        phone: formData.phone ? normalizePhone(formData.phone) : null,
        notes: formData.notes || null,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        package: {
          packageName: formData.packageName || null,
          totalSessions: parseInt(formData.totalSessions) || 0,
          sessionsRemaining: parseInt(formData.sessionsRemaining) || 0,
          pricePerSession: parseFloat(formData.pricePerSession) || 0,
        },
        dates: {
          startDate: formData.startDate || null,
          endDate: formData.endDate || null,
        },
      };

      await onSave(input);
    } catch (error) {
      Alert.alert('Error', 'Failed to save client. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors[colorScheme ?? 'light'].background,
    },
    scrollContent: {
      padding: 20,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: Colors[colorScheme ?? 'light'].text,
      marginTop: 20,
      marginBottom: 10,
    },
    inputContainer: {
      marginBottom: 15,
    },
    label: {
      fontSize: 14,
      color: Colors[colorScheme ?? 'light'].text,
      marginBottom: 5,
    },
    input: {
      borderWidth: 1,
      borderColor: Colors[colorScheme ?? 'light'].tabIconDefault,
      borderRadius: 8,
      padding: 10,
      fontSize: 16,
      color: Colors[colorScheme ?? 'light'].text,
      backgroundColor: colorScheme === 'dark' ? '#1c1c1e' : '#fff',
    },
    inputError: {
      borderColor: '#ff3b30',
    },
    errorText: {
      color: '#ff3b30',
      fontSize: 12,
      marginTop: 5,
    },
    row: {
      flexDirection: 'row',
      gap: 10,
    },
    halfWidth: {
      flex: 1,
    },
    buttonContainer: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 30,
      marginBottom: 20,
    },
    button: {
      flex: 1,
      padding: 15,
      borderRadius: 8,
      alignItems: 'center',
    },
    primaryButton: {
      backgroundColor: Colors[colorScheme ?? 'light'].tint,
    },
    secondaryButton: {
      backgroundColor: Colors[colorScheme ?? 'light'].tabIconDefault,
    },
    buttonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
    disabledButton: {
      opacity: 0.5,
    },
  });

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>Client Information</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Display Name</Text>
          <TextInput
            style={[styles.input, errors.name && styles.inputError]}
            value={formData.displayName}
            onChangeText={(value) => handleChange('displayName', value)}
            placeholder="Display name (or use first/last below)"
            placeholderTextColor={Colors[colorScheme ?? 'light'].tabIconDefault}
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.inputContainer, styles.halfWidth]}>
            <Text style={styles.label}>First Name</Text>
            <TextInput
              style={[styles.input, errors.name && styles.inputError]}
              value={formData.firstName}
              onChangeText={(value) => handleChange('firstName', value)}
              placeholder="First name"
              placeholderTextColor={Colors[colorScheme ?? 'light'].tabIconDefault}
            />
          </View>
          <View style={[styles.inputContainer, styles.halfWidth]}>
            <Text style={styles.label}>Last Name</Text>
            <TextInput
              style={[styles.input, errors.name && styles.inputError]}
              value={formData.lastName}
              onChangeText={(value) => handleChange('lastName', value)}
              placeholder="Last name"
              placeholderTextColor={Colors[colorScheme ?? 'light'].tabIconDefault}
            />
          </View>
        </View>
        {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={[styles.input, errors.email && styles.inputError]}
            value={formData.email}
            onChangeText={(value) => handleChange('email', value)}
            placeholder="email@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor={Colors[colorScheme ?? 'light'].tabIconDefault}
          />
          {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Phone</Text>
          <TextInput
            style={[styles.input, errors.phone && styles.inputError]}
            value={formData.phone}
            onChangeText={(value) => handleChange('phone', value)}
            placeholder="(555) 123-4567"
            keyboardType="phone-pad"
            placeholderTextColor={Colors[colorScheme ?? 'light'].tabIconDefault}
          />
          {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
        </View>

        <Text style={styles.sectionTitle}>Package Details</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Package Name</Text>
          <TextInput
            style={styles.input}
            value={formData.packageName}
            onChangeText={(value) => handleChange('packageName', value)}
            placeholder="e.g., Monthly Membership"
            placeholderTextColor={Colors[colorScheme ?? 'light'].tabIconDefault}
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.inputContainer, styles.halfWidth]}>
            <Text style={styles.label}>Total Sessions</Text>
            <TextInput
              style={[styles.input, errors.totalSessions && styles.inputError]}
              value={formData.totalSessions}
              onChangeText={(value) => handleChange('totalSessions', value)}
              placeholder="0"
              keyboardType="numeric"
              placeholderTextColor={Colors[colorScheme ?? 'light'].tabIconDefault}
            />
            {errors.totalSessions && <Text style={styles.errorText}>{errors.totalSessions}</Text>}
          </View>
          <View style={[styles.inputContainer, styles.halfWidth]}>
            <Text style={styles.label}>Sessions Remaining</Text>
            <TextInput
              style={[styles.input, errors.sessionsRemaining && styles.inputError]}
              value={formData.sessionsRemaining}
              onChangeText={(value) => handleChange('sessionsRemaining', value)}
              placeholder="0"
              keyboardType="numeric"
              placeholderTextColor={Colors[colorScheme ?? 'light'].tabIconDefault}
            />
            {errors.sessionsRemaining && <Text style={styles.errorText}>{errors.sessionsRemaining}</Text>}
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Price per Session</Text>
          <TextInput
            style={styles.input}
            value={formData.pricePerSession}
            onChangeText={(value) => handleChange('pricePerSession', value)}
            placeholder="0.00"
            keyboardType="decimal-pad"
            placeholderTextColor={Colors[colorScheme ?? 'light'].tabIconDefault}
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.inputContainer, styles.halfWidth]}>
            <Text style={styles.label}>Start Date</Text>
            <TextInput
              style={styles.input}
              value={formData.startDate}
              onChangeText={(value) => handleChange('startDate', value)}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={Colors[colorScheme ?? 'light'].tabIconDefault}
            />
          </View>
          <View style={[styles.inputContainer, styles.halfWidth]}>
            <Text style={styles.label}>End Date</Text>
            <TextInput
              style={[styles.input, errors.endDate && styles.inputError]}
              value={formData.endDate}
              onChangeText={(value) => handleChange('endDate', value)}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={Colors[colorScheme ?? 'light'].tabIconDefault}
            />
            {errors.endDate && <Text style={styles.errorText}>{errors.endDate}</Text>}
          </View>
        </View>

        <Text style={styles.sectionTitle}>Additional Information</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Tags (comma-separated)</Text>
          <TextInput
            style={[styles.input, errors.tags && styles.inputError]}
            value={formData.tags}
            onChangeText={(value) => handleChange('tags', value)}
            placeholder="yoga, beginner, morning"
            placeholderTextColor={Colors[colorScheme ?? 'light'].tabIconDefault}
          />
          {errors.tags && <Text style={styles.errorText}>{errors.tags}</Text>}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.input, { minHeight: 80 }]}
            value={formData.notes}
            onChangeText={(value) => handleChange('notes', value)}
            placeholder="Additional notes..."
            multiline
            numberOfLines={3}
            placeholderTextColor={Colors[colorScheme ?? 'light'].tabIconDefault}
          />
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={onCancel}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton, loading && styles.disabledButton]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.buttonText}>{loading ? 'Saving...' : 'Save'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}