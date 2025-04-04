import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const Sidebar = ({ isVisible, onClose }) => {
  const navigation = useNavigation();

  const handleConfessionPress = () => {
    onClose();
    navigation.navigate('Confession');
  };

  return (
    <Animated.View style={[styles.sidebar, { display: isVisible ? 'flex' : 'none' }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close" size={24} color="#ff00ff" />
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity 
        style={styles.menuItem}
        onPress={handleConfessionPress}
      >
        <Ionicons name="heart-half" size={24} color="#ff00ff" />
        <Text style={styles.menuText}>Confessions</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.menuItem}>
        <Ionicons name="person" size={24} color="#ff00ff" />
        <Text style={styles.menuText}>Profile</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.menuItem}>
        <Ionicons name="settings-outline" size={24} color="#ff00ff" />
        <Text style={styles.menuText}>Settings</Text>
      </TouchableOpacity>

      {/* New Options */}
      <TouchableOpacity 
        style={styles.menuItem}
        onPress={() => {
          onClose();
          navigation.navigate('AddAccount');
        }}
      >
        <Ionicons name="person-add" size={24} color="#ff00ff" />
        <Text style={styles.menuText}>Add Account</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.menuItem}
        onPress={() => {
          onClose();
          console.log('Logout pressed - will implement with backend');
        }}
      >
        <Ionicons name="log-out" size={24} color="#ff00ff" />
        <Text style={styles.menuText}>Logout</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  sidebar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '70%',
    backgroundColor: '#660033',
    padding: 20,
    paddingTop: 50,
    borderRightWidth: 1,
    borderColor: '#ff00ff',
    zIndex: 1000,
  },
  header: {
    marginBottom: 30,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    marginBottom: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ff00ff',
  },
  menuText: {
    color: '#ff00ff',
    fontSize: 16,
    marginLeft: 15,
  },
});

export default Sidebar;