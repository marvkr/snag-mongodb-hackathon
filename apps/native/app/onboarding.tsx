import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { AnimatedLogo, AnimatedButton } from '../components/onboarding';
import { useOnboardingComplete } from '../hooks';
import { colors } from '../constants/colors';

export default function OnboardingScreen() {
  const router = useRouter();
  const { completeOnboarding } = useOnboardingComplete();

  const handleGetStarted = async () => {
    await completeOnboarding();
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoSection}>
          <AnimatedLogo />

          <Animated.Text
            entering={FadeInDown.delay(200).duration(800)}
            style={styles.title}
          >
            snag
          </Animated.Text>

          <Animated.Text
            entering={FadeInDown.delay(400).duration(800)}
            style={styles.tagline}
          >
            Lemme snag that
          </Animated.Text>
        </View>

        <View style={styles.descriptionSection}>
          <Animated.Text
            entering={FadeInDown.delay(500).duration(800)}
            style={styles.description}
          >
            Screenshot anything.{'\n'}
            We'll figure out what you meant.
          </Animated.Text>

          <Animated.View
            entering={FadeInDown.delay(600).duration(800)}
            style={styles.features}
          >
            <View style={styles.featureRow}>
              <Text style={styles.featureIcon}>📸</Text>
              <Text style={styles.featureText}>Screenshots become intent</Text>
            </View>
            <View style={styles.featureRow}>
              <Text style={styles.featureIcon}>🗺️</Text>
              <Text style={styles.featureText}>Places appear on your map</Text>
            </View>
            <View style={styles.featureRow}>
              <Text style={styles.featureIcon}>🤖</Text>
              <Text style={styles.featureText}>AI agents do the work</Text>
            </View>
          </Animated.View>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <AnimatedButton onPress={handleGetStarted} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: 'center',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 56,
    fontWeight: '800',
    color: colors.text.primary,
    marginTop: 16,
    letterSpacing: -2,
  },
  tagline: {
    fontSize: 18,
    fontWeight: '500',
    color: colors.text.secondary,
    marginTop: 4,
  },
  descriptionSection: {
    alignItems: 'center',
  },
  description: {
    fontSize: 20,
    fontWeight: '500',
    color: colors.text.primary,
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 32,
  },
  features: {
    gap: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureIcon: {
    fontSize: 24,
  },
  featureText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
});
