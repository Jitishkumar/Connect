import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ConfessionScreen from '../screens/ConfessionScreen';
import SearchScreen from '../screens/SearchScreen';
import AddAccountScreen from '../screens/AddAccountScreen';
import LoginScreen from '../screens/LoginScreen'; // You'll need to create this

const Stack = createStackNavigator();

const AppNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={HomeTabs} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Confession" component={ConfessionScreen} />
      <Stack.Screen name="Search" component={SearchScreen} />
      <Stack.Screen name="AddAccount" component={AddAccountScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
  );
};

export default AppNavigator;