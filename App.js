import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';
import { AccountProvider } from './src/context/AccountContext';

// Add to your imports
import OneSignal from 'react-native-onesignal';

// Initialize OneSignal early in your app
OneSignal.setAppId('YOUR_ONESIGNAL_APP_ID');

export default function App() {
  return (
    <SafeAreaProvider>
      <AccountProvider>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </AccountProvider>
    </SafeAreaProvider>
  );
}
