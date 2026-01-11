import React from 'react';
import { View, Text, StyleSheet, Linking, TouchableOpacity } from 'react-native';
import { SearchResults } from '../../types';
import { colors } from '../../constants';

interface ResearchInsightsProps {
  searchResults?: SearchResults;
}

export function ResearchInsights({ searchResults }: ResearchInsightsProps) {
  if (!searchResults || searchResults.results.length === 0) {
    return null;
  }

  const handleUrlPress = (url: string) => {
    Linking.openURL(url).catch((err) => console.error('Failed to open URL:', err));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Research Insights</Text>
      <Text style={styles.subtitle}>
        Found {searchResults.resultCount} results for "{searchResults.query}"
      </Text>

      {searchResults.results.slice(0, 3).map((result, index) => (
        <TouchableOpacity
          key={index}
          style={styles.resultCard}
          onPress={() => handleUrlPress(result.url)}
          activeOpacity={0.7}
        >
          <Text style={styles.resultTitle} numberOfLines={2}>
            {result.title}
          </Text>
          <Text style={styles.resultContent} numberOfLines={3}>
            {result.content}
          </Text>
          <Text style={styles.resultUrl} numberOfLines={1}>
            {result.url}
          </Text>
          <View style={styles.scoreContainer}>
            <Text style={styles.scoreLabel}>Relevance: </Text>
            <Text style={styles.scoreValue}>{(result.score * 100).toFixed(0)}%</Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 8,
  },
  resultCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  resultContent: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  resultUrl: {
    fontSize: 12,
    color: colors.primary,
    marginTop: 4,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  scoreLabel: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  scoreValue: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
});
