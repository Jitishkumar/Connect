import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';
import { AccountProvider } from './src/context/AccountContext';

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
