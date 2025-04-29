import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';
import { AccountProvider } from './src/context/AccountContext';
import { VideoProvider } from './src/context/VideoContext';
import { supabase } from './src/config/supabase';
import OneSignal from 'react-native-onesignal';
import Constants from 'expo-constants';


export default function App() {
  useEffect(() => {
    // Check if running in Expo Go
    const isExpoGo = process.env.EXPO_RUNTIME_VERSION === undefined;
    
    if (isExpoGo && __DEV__) {
      console.log('Running in Expo Go - Push notifications are not supported');
      return;
    }

    // Initialize OneSignal
    OneSignal.setAppId(Constants.expoConfig.extra.oneSignalAppId);
    
    // Prompt for push notification permissions
    OneSignal.promptForPushNotificationsWithUserResponse();

    // Set notification handlers
    OneSignal.setNotificationWillShowInForegroundHandler(notificationReceivedEvent => {
      console.log("OneSignal: notification will show in foreground:", notificationReceivedEvent);
      notificationReceivedEvent.complete(notificationReceivedEvent.getNotification());
    });

    OneSignal.setNotificationOpenedHandler(notification => {
      console.log("OneSignal: notification opened:", notification);
    });

    // Set external user ID when user is logged in
    const setupExternalUserId = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await OneSignal.setExternalUserId(user.id);
        }
      } catch (error) {
        console.error('Error setting up external user ID:', error);
      }
    };
    
    setupExternalUserId();
  }, []);


  return (
    <SafeAreaProvider>
      <AccountProvider>
        <VideoProvider>
          <NavigationContainer>
            <AppNavigator />
          </NavigationContainer>
        </VideoProvider>
      </AccountProvider>
    </SafeAreaProvider>
  );
}