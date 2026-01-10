import { IntentBucket } from '../types';
import { colors } from './colors';

interface BucketConfig {
  label: string;
  color: string;
  icon: string;
  description: string;
}

export const intentBucketConfig: Record<IntentBucket, BucketConfig> = {
  travel: {
    label: 'Travel',
    color: colors.intent.travel,
    icon: 'airplane',
    description: 'Places, destinations, and experiences',
  },
  shopping: {
    label: 'Shopping',
    color: colors.intent.shopping,
    icon: 'cart',
    description: 'Products and items to buy',
  },
  startup: {
    label: 'Startup',
    color: colors.intent.startup,
    icon: 'bulb',
    description: 'Business ideas and opportunities',
  },
  general: {
    label: 'General',
    color: colors.intent.general,
    icon: 'bookmark',
    description: 'Other saved content',
  },
};
