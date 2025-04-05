import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import MessagesScreen from '../screens/MessagesScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SignupScreen from '../screens/SignupScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import SearchScreen from '../screens/SearchScreen';           // Add this import
import ConfessionScreen from '../screens/ConfessionScreen';  // Add this import

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TabNavigator = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarStyle: {
        backgroundColor: '#000033',
        borderTopWidth: 0,
        height: 60,
        paddingBottom: 5,
      },
      tabBarActiveTintColor: '#3399ff',
      tabBarInactiveTintColor: '#666666',
    }}
  >
    <Tab.Screen 
      name="Home" 
      component={HomeScreen}
      options={{
        tabBarIcon: ({ color }) => (
          <Ionicons name="home-outline" size={24} color={color} />
        ),
      }}
    />
    <Tab.Screen 
      name="Messages" 
      component={MessagesScreen}
      options={{
        tabBarIcon: ({ color }) => (
          <Ionicons name="chatbubble-outline" size={24} color={color} />
        ),
      }}
    />
    <Tab.Screen 
      name="Notifications" 
      component={NotificationsScreen}
      options={{
        tabBarIcon: ({ color }) => (
          <Ionicons name="notifications-outline" size={24} color={color} />
        ),
      }}
    />
    <Tab.Screen 
      name="Profile" 
      component={ProfileScreen}
      options={{
        tabBarIcon: ({ color }) => (
          <Ionicons name="person-outline" size={24} color={color} />
        ),
      }}
    />
  </Tab.Navigator>
);

export const AppNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen name="MainApp" component={TabNavigator} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="Search" component={SearchScreen} />
      <Stack.Screen name="Confession" component={ConfessionScreen} />
    </Stack.Navigator>
  );
};