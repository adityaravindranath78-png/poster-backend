import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import {useSubscriptionStore} from '../../store/subscriptionStore';
import {SUBSCRIPTION_PLANS} from '../../utils/constants';
import {formatPrice} from '../../utils/helpers';

export default function SubscriptionScreen() {
  const {status} = useSubscriptionStore();

  function handleSubscribe(planId: string) {
    Alert.alert(
      'Coming Soon',
      'Payments will be integrated with Razorpay in the next update.',
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}>
      <Text style={styles.title}>Go Premium</Text>
      <Text style={styles.subtitle}>
        Remove watermarks, unlock all templates, and get premium fonts
      </Text>

      {SUBSCRIPTION_PLANS.map((plan) => {
        const isActive = plan.id === status || (plan.id === 'free' && status === 'free');
        return (
          <View
            key={plan.id}
            style={[
              styles.planCard,
              isActive && styles.planCardActive,
            ]}>
            <View style={styles.planHeader}>
              <Text style={styles.planName}>{plan.name}</Text>
              <Text style={styles.planPrice}>
                {plan.price === 0
                  ? 'Free'
                  : `${formatPrice(plan.price)}/${plan.interval === 'monthly' ? 'mo' : 'yr'}`}
              </Text>
            </View>

            {plan.features.map((feature, i) => (
              <Text key={i} style={styles.feature}>
                {feature}
              </Text>
            ))}

            {plan.id !== 'free' && (
              <TouchableOpacity
                style={[
                  styles.subscribeButton,
                  isActive && styles.subscribeButtonActive,
                ]}
                onPress={() => handleSubscribe(plan.id)}
                disabled={isActive}>
                <Text
                  style={[
                    styles.subscribeButtonText,
                    isActive && styles.subscribeButtonTextActive,
                  ]}>
                  {isActive ? 'Current Plan' : 'Subscribe'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#333',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  planCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#E8E8E8',
  },
  planCardActive: {
    borderColor: '#FF6B35',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  planName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  planPrice: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FF6B35',
  },
  feature: {
    fontSize: 14,
    color: '#555',
    paddingVertical: 3,
    paddingLeft: 8,
  },
  subscribeButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  subscribeButtonActive: {
    backgroundColor: '#E8E8E8',
  },
  subscribeButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
  },
  subscribeButtonTextActive: {
    color: '#999',
  },
});
