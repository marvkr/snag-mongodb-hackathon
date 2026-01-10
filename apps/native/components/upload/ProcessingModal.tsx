import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants';
import { UploadStatus } from '../../hooks/useUploadScreenshot';
import { ProcessedScreenshot } from '../../types';
import { IntentBadge } from '../feed/IntentBadge';

interface ProcessingModalProps {
  visible: boolean;
  status: UploadStatus;
  progress: string;
  error: Error | null;
  result: ProcessedScreenshot | null;
  onDismiss: () => void;
  onViewResult?: (id: string) => void;
}

export function ProcessingModal({
  visible,
  status,
  progress,
  error,
  result,
  onDismiss,
  onViewResult,
}: ProcessingModalProps) {
  const getStatusIcon = () => {
    switch (status) {
      case 'completed':
        return (
          <Ionicons name="checkmark-circle" size={56} color={colors.success} />
        );
      case 'error':
        return <Ionicons name="alert-circle" size={56} color={colors.error} />;
      default:
        return <ActivityIndicator size="large" color={colors.primary} />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'uploading':
        return 'Uploading screenshot...';
      case 'processing':
        return 'AI is analyzing your screenshot...';
      case 'completed':
        return 'Intent classified!';
      case 'error':
        return error?.message || 'Something went wrong';
      default:
        return '';
    }
  };

  const handleViewResult = () => {
    if (result && onViewResult) {
      onViewResult(result.id);
    }
    onDismiss();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.iconContainer}>{getStatusIcon()}</View>

          <Text style={styles.statusText}>{getStatusText()}</Text>

          {progress && status !== 'completed' && status !== 'error' && (
            <Text style={styles.progressText}>{progress}</Text>
          )}

          {status === 'completed' && result && (
            <View style={styles.resultContainer}>
              <IntentBadge
                bucket={result.intent.primaryBucket}
                confidence={result.intent.confidence}
              />
              <Text style={styles.rationale} numberOfLines={3}>
                {result.intent.rationale}
              </Text>
            </View>
          )}

          {(status === 'completed' || status === 'error') && (
            <View style={styles.buttonContainer}>
              {status === 'completed' && result && onViewResult && (
                <Pressable
                  style={styles.primaryButton}
                  onPress={handleViewResult}
                >
                  <Text style={styles.primaryButtonText}>View Details</Text>
                </Pressable>
              )}
              <Pressable
                style={[
                  styles.secondaryButton,
                  status === 'error' && styles.primaryButton,
                ]}
                onPress={onDismiss}
              >
                <Text
                  style={[
                    styles.secondaryButtonText,
                    status === 'error' && styles.primaryButtonText,
                  ]}
                >
                  {status === 'error' ? 'Try Again' : 'Done'}
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
    gap: 16,
  },
  iconContainer: {
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    textAlign: 'center',
  },
  progressText: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  resultContainer: {
    width: '100%',
    alignItems: 'flex-start',
    gap: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  rationale: {
    fontSize: 15,
    color: colors.text.primary,
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    width: '100%',
  },
  primaryButton: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: colors.text.inverse,
    fontSize: 15,
    fontWeight: '600',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: colors.surface,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: colors.text.primary,
    fontSize: 15,
    fontWeight: '600',
  },
});
