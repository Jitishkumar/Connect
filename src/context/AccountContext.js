import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../config/supabase';

const AccountContext = createContext();

export const AccountProvider = ({ children }) => {
  const [accounts, setAccounts] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);

  // Load accounts from storage on app start
  useEffect(() => {
    loadAccounts();
    
    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session) {
          setCurrentSession(session);
          // Update or add the current account
          updateAccountWithSession(session);
        }
      }
    );

    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  const loadAccounts = async () => {
    try {
      const storedAccounts = await AsyncStorage.getItem('userAccounts');
      if (storedAccounts) {
        setAccounts(JSON.parse(storedAccounts));
      }
    } catch (error) {
      console.error('Error loading accounts:', error);
    }
  };

  const saveAccounts = async (updatedAccounts) => {
    try {
      await AsyncStorage.setItem('userAccounts', JSON.stringify(updatedAccounts));
    } catch (error) {
      console.error('Error saving accounts:', error);
    }
  };

  const updateAccountWithSession = async (session) => {
    try {
      // Get user profile data
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error) {
        // If profile doesn't exist, create one with basic information
        if (error.code === 'PGRST116') {
          // Create a basic profile for the user
          // Get the current highest rank to assign the next rank number
          const { data: rankData, error: rankError } = await supabase
            .from('profiles')
            .select('rank')
            .order('rank', { ascending: false })
            .limit(1);
          
          const nextRank = rankData && rankData.length > 0 && rankData[0].rank 
            ? rankData[0].rank + 1 
            : 1; // Start with 1 if no profiles exist

          // Insert the profile first without trying to return it
          const { error: insertError } = await supabase
            .from('profiles')
            .insert([
              { 
                id: session.user.id,
                username: `user_${session.user.id.substring(0, 8)}`,
                created_at: new Date().toISOString(),
                rank: nextRank
              }
            ]);
            
          if (insertError) throw insertError;
          
          // Then fetch the profile separately to ensure we get it
          const { data: newProfile, error: fetchError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
            
          if (fetchError) throw fetchError;
          
          // Use the newly created profile
          const updatedAccount = {
            id: session.user.id,
            username: newProfile.username,
            avatar_url: null,
            email: session.user.email,
            session_token: session.refresh_token,
          };
          
          addAccount(updatedAccount);
          return;
        } else {
          throw error;
        }
      }

      // Update or add account with existing profile
      const updatedAccount = {
        id: session.user.id,
        username: profile.username,
        avatar_url: profile.avatar_url,
        email: session.user.email,
        session_token: session.refresh_token, // Store refresh token for later use
      };

      addAccount(updatedAccount);
    } catch (error) {
      console.error('Error updating account with session:', error);
    }
  };

  const addAccount = (account) => {
    setAccounts(prev => {
      // Check if account already exists
      const existingIndex = prev.findIndex(acc => acc.id === account.id);
      
      let updatedAccounts;
      if (existingIndex >= 0) {
        // Update existing account
        updatedAccounts = [...prev];
        updatedAccounts[existingIndex] = account;
      } else {
        // Add new account
        updatedAccounts = [...prev, account];
      }
      
      // Save to AsyncStorage
      saveAccounts(updatedAccounts);
      
      return updatedAccounts;
    });
  };

  const removeAccount = (accountId) => {
    setAccounts(prev => {
      const updatedAccounts = prev.filter(acc => acc.id !== accountId);
      saveAccounts(updatedAccounts);
      return updatedAccounts;
    });
  };

  const switchToAccount = async (accountId) => {
    try {
      const account = accounts.find(acc => acc.id === accountId);
      if (!account || !account.session_token) {
        return { success: false, error: 'Account not found or session expired' };
      }

      // Try to use the refresh token to get a new session
      const { data, error } = await supabase.auth.refreshSession({
        refresh_token: account.session_token,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, session: data.session };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  return (
    <AccountContext.Provider value={{ 
      accounts, 
      addAccount, 
      removeAccount, 
      currentSession,
      switchToAccount 
    }}>
      {children}
    </AccountContext.Provider>
  );
};

export const useAccounts = () => {
  const context = useContext(AccountContext);
  if (context === undefined) {
    throw new Error('useAccounts must be used within an AccountProvider');
  }
  return context;
};