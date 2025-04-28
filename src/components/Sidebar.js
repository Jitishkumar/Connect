import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../config/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';



const Sidebar = ({ isVisible, onClose }) => {
  const navigation = useNavigation();

  const handleLogout = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        Alert.alert('Error', 'No user session found');
        return;
      }

      // Store the email before signing out
      const userEmail = user.email;

      // Sign out from Supabase first
      const { error } = await supabase.auth.signOut();
      if (error) {
        Alert.alert('Error', error.message);
        return;
      }

      // Clear all saved accounts from AsyncStorage
      try {
        await AsyncStorage.removeItem('savedAccounts');
        await AsyncStorage.removeItem('accountsLastUpdated');
      } catch (storageError) {
        console.error('Storage error:', storageError);
      }
      
      onClose();
      navigation.replace('Login');
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Error', 'Failed to logout');
    }
  };

  const handleAddAccount = () => {
    onClose();
    navigation.navigate('Signup');
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.sidebar}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#ff00ff" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={() => {
              onClose();
              navigation.navigate('Confession');
            }}
          >
            <Ionicons name="heart" size={24} color="#ff00ff" />
            <Text style={styles.menuText}>Confessions</Text>
          </TouchableOpacity>

         

          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="settings" size={24} color="#ff00ff" />
            <Text style={styles.menuText}>Settings</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleAddAccount}>
            <Ionicons name="person-add" size={24} color="#ff00ff" />
            <Text style={styles.menuText}>Add Account</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
            <Ionicons name="log-out" size={24} color="#ff00ff" />
            <Text style={styles.menuText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sidebar: {
    width: '70%',
    height: '100%',
    backgroundColor: '#330033',
    padding: 20,
    paddingTop: 20,
  },
  closeButton: {
    marginBottom: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#440044',
  },
  menuText: {
    color: '#ff00ff',
    fontSize: 16,
    marginLeft: 15,
  },
});

export default Sidebar;