import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../config/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LoginScreen = ({ route }) => {
  const navigation = useNavigation();
  const [email, setEmail] = useState(route?.params?.prefilledEmail || '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState([]);

  useEffect(() => {
    loadSavedAccounts();
  }, []);

  useEffect(() => {
    if (route?.params?.prefilledEmail) {
      setEmail(route.params.prefilledEmail);
    }
  }, [route?.params?.prefilledEmail]);

  const loadSavedAccounts = async () => {
    try {
      const savedAccounts = await AsyncStorage.getItem('savedAccounts');
      if (savedAccounts) {
        setAccounts(JSON.parse(savedAccounts));
      }
    } catch (error) {
      console.error('Error loading accounts:', error);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (error) {
        Alert.alert('Error', error.message);
      } else if (data?.session) {
        // Save account info, but first remove any duplicate entries
        const newAccount = { email: email.trim(), userId: data.session.user.id };
        const existingAccounts = await AsyncStorage.getItem('savedAccounts');
        let updatedAccounts = [];
        
        if (existingAccounts) {
          const parsedAccounts = JSON.parse(existingAccounts);
          // Remove any existing entries with the same email
          updatedAccounts = parsedAccounts.filter(account => account.email !== email.trim());
        }
        
        // Add the new account
        updatedAccounts.push(newAccount);
        await AsyncStorage.setItem('savedAccounts', JSON.stringify(updatedAccounts));
        navigation.replace('MainApp');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Login</Text>
      </View>

      <View style={styles.content}>
        <TextInput 
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#e3a6d0"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput 
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#e3a6d0"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
        />
        <TouchableOpacity 
          style={[styles.loginButton, loading && styles.loginButtonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.loginButtonText}>
            {loading ? 'Logging in...' : 'Login'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.signupButton}
          onPress={() => navigation.navigate('Signup')}
        >
          <Text style={styles.signupButtonText}>
            Don't have an account? Sign up
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 15,
    paddingBottom: 15,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    color: '#ff00ff',
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 15,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  input: {
    backgroundColor: '#4d0026',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    color: '#ff00ff',
    borderWidth: 1,
    borderColor: '#ff00ff',
  },
  loginButton: {
    backgroundColor: '#ff00ff',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  signupButton: {
    marginTop: 15,
    alignItems: 'center',
  },
  signupButtonText: {
    color: '#ff00ff',
    fontSize: 14,
  },
});

export default LoginScreen;