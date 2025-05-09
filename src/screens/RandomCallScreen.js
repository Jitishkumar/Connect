import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../config/supabase';

const RandomCallScreen = () => {
  const navigation = useNavigation();
  const [status, setStatus] = useState('waiting'); // waiting, connecting, connected
  const [matchedUser, setMatchedUser] = useState(null);

  useEffect(() => {
    startMatching();
    return () => {
      // Cleanup: Remove user from waiting list when component unmounts
      removeFromWaitingList();
    };
  }, []);

  const startMatching = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigation.navigate('Auth');
        return;
      }

      // Add user to waiting list
      // Get user's profile to include gender information
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('gender')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      // Set a default gender if it's null
      const userGender = profile?.gender || 'unspecified';

      const { data, error } = await supabase
        .from('users_waiting')
        .insert([{
          user_id: user.id,
          status: 'waiting',
          timestamp: new Date().toISOString(),
          gender: userGender // Use default gender if not specified
        }]);


      if (error) throw error;

      // Start listening for matches
      const subscription = supabase
        .channel('waiting_match')
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'users_waiting',
          filter: `user_id=eq.${user.id}`,
        }, (payload) => {
          if (payload.new.status === 'matched') {
            handleMatch(payload.new.matched_with);
          }
        })
        .subscribe();

      // Look for available users
      findMatch(user.id);
    } catch (error) {
      console.error('Error starting match:', error);
      setStatus('error');
    }
  };

  const findMatch = async (userId) => {
    try {
      // Find another waiting user
      const { data: waitingUsers, error } = await supabase
        .from('users_waiting')
        .select('user_id')
        .neq('user_id', userId)
        .eq('status', 'waiting')
        .order('timestamp', { ascending: true })
        .limit(1);

      if(error) throw error;

      if (waitingUsers && waitingUsers.length > 0) {
        const matchedUserId = waitingUsers[0].user_id;

        // Update both users' status to matched
        await supabase
          .from('users_waiting')
          .update({
            status: 'matched',
            matched_with: matchedUserId
          })
          .eq('user_id', userId);

        await supabase
          .from('users_waiting')
          .update({
            status: 'matched',
            matched_with: userId
          })
          .eq('user_id', matchedUserId);

        //Create a call record
        const { data: call, error: callError } = await supabase
          .from('calls')
          .insert([{
            from_user: userId,
            to_user: matchedUserId,
            status: 'pending'
          }])
          .select()
          .single();

        if (callError) throw callError;

        // Navigate to video call screen
        navigation.replace('VideoCall', {
          callId: call.id,
          isInitiator: true,
          remoteUserId: matchedUserId
        });
      } else {
        // No match found, try again in 3 seconds
        setTimeout(() => findMatch(userId), 3000);
      }
    } catch (error) {
      console.error('Error finding match:', error);
      setStatus('error');
    }
  };

  const handleMatch = async (matchedUserId) => {
    setStatus('connecting');
    setMatchedUser(matchedUserId);

    // Get the call details
    const { data: call, error } = await supabase
      .from('calls')
      .select('*')
      .or(`from_user.eq.${matchedUserId},to_user.eq.${matchedUserId}`)
      .eq('status', 'pending')
      .single();

    if (error) {
      console.error('Error getting call details:', error);
      setStatus('error');
      return;
    }

    // Navigate to video call screen
    navigation.replace('VideoCall', {
      callId: call.id,
      isInitiator: false,
      remoteUserId: matchedUserId
    });
  };

  const removeFromWaitingList = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('users_waiting')
          .delete()
          .eq('user_id', user.id);
      }
    } catch (error) {
      console.error('Error removing from waiting list:', error);
    }
  };

  const handleCancel = async () => {
    await removeFromWaitingList();
    navigation.goBack();
  };

  return (
    <LinearGradient
      colors={['#0a0a2a', '#1a1a3a']}
      style={styles.container}
    >
      <TouchableOpacity
        style={styles.closeButton}
        onPress={handleCancel}
      >
        <Ionicons name="close" size={24} color="#fff" />
      </TouchableOpacity>

      <View style={styles.content}>
        <LinearGradient
          colors={['#ff00ff', '#00ffff']}
          style={styles.iconContainer}
        >
          <Ionicons name="videocam" size={40} color="#fff" />
        </LinearGradient>

        <Text style={styles.statusText}>
          {status === 'waiting' && 'Looking for someone to talk to...'}
          {status === 'connecting' && 'Connecting to your match...'}
          {status === 'error' && 'Something went wrong. Please try again.'}
        </Text>

        {(status === 'waiting' || status === 'connecting') && (
          <ActivityIndicator size="large" color="#ff00ff" style={styles.loader} />
        )}

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={handleCancel}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050520',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 1,
    padding: 10,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  statusText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  loader: {
    marginVertical: 20,
  },
  cancelButton: {
    marginTop: 20,
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: '#ff00ff',
  },
  cancelText: {
    color: '#ff00ff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default RandomCallScreen;