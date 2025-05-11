import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, AppState } from 'react-native';
import { supabase } from '../config/supabase';
import {
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
  RTCView,
  mediaDevices,
} from 'react-native-webrtc';
import { Ionicons } from '@expo/vector-icons';
import { v4 as uuidv4 } from 'uuid'; // Ensure react-native-get-random-values is imported in App.js

const STUN_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    // For better reliability, especially across different networks, a TURN server would be needed.
    // However, free TURN servers are rare and often unreliable.
  ],
};

const VideoCallScreen = ({ navigation }) => {
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentUserGender, setCurrentUserGender] = useState(null);
  
  const [screenStatus, setScreenStatus] = useState('INITIALIZING'); // INITIALIZING, SEARCHING, CONNECTING, IN_CALL, ERROR
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  
  const peerConnection = useRef(null);
  const callIdRef = useRef(null); 
  const remoteUserIdRef = useRef(null);
  const isInitiatorRef = useRef(false);
  const waitingSubscriptionRef = useRef(null);
  const callChannelRef = useRef(null);

  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          Alert.alert("Authentication Error", "Please login to use video call.");
          navigation.goBack();
          return;
        }
        setCurrentUserId(user.id);

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('gender')
          .eq('id', user.id)
          .single();

        if (profileError || !profile) {
          Alert.alert("Profile Error", "Could not fetch your profile gender. Please ensure your gender is set in your profile.");
          setScreenStatus('ERROR');
          // navigation.goBack(); // Keep them on error screen
          return;
        }
        setCurrentUserGender(profile.gender);
        setScreenStatus('SEARCHING');
      } catch (e) {
        console.error("Initialization error:", e);
        setScreenStatus('ERROR');
      }
    };
    initialize();

    const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      cleanup(); // This will be called when the component unmounts
      appStateSubscription.remove();
    };
  }, []);

  useEffect(() => {
    if (screenStatus === 'SEARCHING' && currentUserId && currentUserGender) {
      findMatchOrWait();
    }
  }, [screenStatus, currentUserId, currentUserGender]);

  const handleAppStateChange = (nextAppState) => {
    if (nextAppState === 'background' || nextAppState === 'inactive') {
        if(screenStatus === 'IN_CALL' || screenStatus === 'SEARCHING' || screenStatus === 'CONNECTING') {
            console.log("App backgrounded/inactive, cleaning up call/matching.");
            endCallLogic(false); // Pass false to not navigate back immediately if not desired
        }
    } else if (nextAppState === 'active') {
        // App has come to the foreground
        // If we were in a call and streams were paused, re-enable them if needed
        // For simplicity, we're not pausing/resuming streams here, but this is where you might.
    }
  };

  const getTargetGender = () => {
    if (currentUserGender === 'male') return 'female';
    if (currentUserGender === 'female') return 'male';
    if (currentUserGender === 'third') return 'third';
    Alert.alert("Matching Error", `Your gender (${currentUserGender}) is not configured for matching.`);
    return null; 
  };

  const findMatchOrWait = async () => {
    if (!currentUserId || !currentUserGender) return;
    const targetGender = getTargetGender();
    if (!targetGender) {
        setScreenStatus('ERROR');
        return;
    }

    console.log(`User ${currentUserId} (${currentUserGender}) searching for ${targetGender}`);

    try {
      const { data: potentialMatches, error: findError } = await supabase
        .from('users_waiting')
        .select('*')
        .eq('status', 'waiting')
        .eq('gender', targetGender) // Match with someone of the target gender
        .eq('preferred_gender', currentUserGender) // Who prefers my gender
        .neq('user_id', currentUserId) // Not myself
        .order('created_at', { ascending: true })
        .limit(1);

      if (findError) throw findError;

      if (potentialMatches && potentialMatches.length > 0) {
        const matchedUser = potentialMatches[0];
        remoteUserIdRef.current = matchedUser.user_id;
        isInitiatorRef.current = true;
        callIdRef.current = uuidv4(); // Initiator creates the call ID

        setScreenStatus('CONNECTING');
        console.log(`Match found with ${matchedUser.user_id}. I am initiator. Call ID: ${callIdRef.current}`);

        // Atomically update both users to 'in-call' using a Supabase function is ideal.
        // For now, sequential updates:
        const { error: updateMatchedUserError } = await supabase.from('users_waiting').update({
            status: 'in-call',
            current_call_id: callIdRef.current,
            matched_with_user_id: currentUserId
        }).eq('user_id', matchedUser.user_id);

        if (updateMatchedUserError) throw updateMatchedUserError;
        
        const { error: upsertCurrentUserError } = await supabase.from('users_waiting').upsert({
            user_id: currentUserId,
            gender: currentUserGender,
            preferred_gender: targetGender,
            status: 'in-call',
            current_call_id: callIdRef.current,
            matched_with_user_id: matchedUser.user_id,
            created_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

        if (upsertCurrentUserError) throw upsertCurrentUserError;
        
        setupWebRTC();

      } else {
        console.log("No match found, I will wait.");
        const { error: waitError } = await supabase.from('users_waiting').upsert({
            user_id: currentUserId,
            gender: currentUserGender,
            preferred_gender: targetGender,
            status: 'waiting',
            current_call_id: null, // Clear any previous call ID
            matched_with_user_id: null,
            created_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

        if (waitError) throw waitError;

        if (waitingSubscriptionRef.current) await waitingSubscriptionRef.current.unsubscribe();
        waitingSubscriptionRef.current = supabase
          .channel(`user_waiting:${currentUserId}`)
          .on('postgres_changes', {
            event: 'UPDATE',
            schema: 'public',
            table: 'users_waiting',
            filter: `user_id=eq.${currentUserId}`,
          }, async (payload) => {
            const updatedRecord = payload.new;
            if (updatedRecord.status === 'in-call' && updatedRecord.current_call_id && updatedRecord.matched_with_user_id) {
              console.log("I've been matched by someone else!");
              if (waitingSubscriptionRef.current) {
                await waitingSubscriptionRef.current.unsubscribe();
                waitingSubscriptionRef.current = null;
              }
              
              remoteUserIdRef.current = updatedRecord.matched_with_user_id;
              isInitiatorRef.current = false; // I am the receiver
              callIdRef.current = updatedRecord.current_call_id;
              setScreenStatus('CONNECTING');
              console.log(`Matched by ${remoteUserIdRef.current}. I am receiver. Call ID: ${callIdRef.current}`);
              setupWebRTC();
            }
          })
          .subscribe((status, err) => {
            if (status === 'SUBSCRIBED') console.log('Subscribed to my waiting status');
            if (err) console.error('Subscription error to my waiting status', err);
          });
      }
    } catch (error) {
      console.error("Error in findMatchOrWait:", error);
      Alert.alert("Matching Error", `Could not find or wait for a match: ${error.message}`);
      setScreenStatus('ERROR');
    }
  };

  const setupWebRTC = async () => {
    if (!callIdRef.current) {
        console.error("Call ID is not set for WebRTC setup.");
        setScreenStatus('ERROR');
        return;
    }
    console.log(`Setting up WebRTC for call ID: ${callIdRef.current}, Initiator: ${isInitiatorRef.current}`);

    peerConnection.current = new RTCPeerConnection(STUN_SERVERS);

    try {
      const stream = await mediaDevices.getUserMedia({
        audio: true,
        video: { width: 640, height: 480, frameRate: 30, facingMode: 'user' },
      });
      setLocalStream(stream);
      stream.getTracks().forEach(track => peerConnection.current.addTrack(track, stream));
    } catch (e) {
      console.error("Error getting media stream:", e);
      Alert.alert("Media Error", "Could not access camera/microphone. Please check permissions.");
      setScreenStatus('ERROR');
      return;
    }
    
    peerConnection.current.onicecandidate = ({ candidate }) => {
      if (candidate && callChannelRef.current) {
        console.log("Sending ICE candidate to peer");
        callChannelRef.current.send({
          type: 'broadcast',
          event: 'ice-candidate',
          payload: { candidate, sender_id: currentUserId }, // Good to include sender_id
        });
      }
    };

    peerConnection.current.ontrack = (event) => {
      console.log("Remote track received");
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
        setScreenStatus('IN_CALL'); 
      }
    };

    peerConnection.current.oniceconnectionstatechange = () => {
        const state = peerConnection.current?.iceConnectionState;
        console.log('ICE Connection State:', state);
        if (state === 'failed' || state === 'disconnected' || state === 'closed') {
            if (screenStatus === 'IN_CALL' || screenStatus === 'CONNECTING') {
                 Alert.alert("Connection Issue", "The connection was lost or failed to establish.");
                 endCallLogic();
            }
        }
    };
    
    if (callChannelRef.current) await callChannelRef.current.unsubscribe();
    callChannelRef.current = supabase.channel(`call:${callIdRef.current}`, {
        config: {
            broadcast: {
                ack: true, // Request acknowledgment for sent messages
            },
        },
    });

    callChannelRef.current
      .on('broadcast', { event: 'offer' }, async ({ payload }) => {
        if (!isInitiatorRef.current && payload.sender_id !== currentUserId) { // Ensure not processing own offer
          console.log("Received offer from:", payload.sender_id);
          await peerConnection.current.setRemoteDescription(new RTCSessionDescription(payload.offer));
          const answer = await peerConnection.current.createAnswer();
          await peerConnection.current.setLocalDescription(answer);
          callChannelRef.current.send({ type: 'broadcast', event: 'answer', payload: { answer, sender_id: currentUserId } });
          console.log("Sent answer");
        }
      })
      .on('broadcast', { event: 'answer' }, async ({ payload }) => {
        if (isInitiatorRef.current && payload.sender_id !== currentUserId) { // Ensure not processing own answer
          console.log("Received answer from:", payload.sender_id);
          await peerConnection.current.setRemoteDescription(new RTCSessionDescription(payload.answer));
        }
      })
      .on('broadcast', { event: 'ice-candidate' }, async ({ payload }) => {
        if (payload.sender_id !== currentUserId) { // Ignore own candidates
            console.log("Received ICE candidate from:", payload.sender_id);
            try {
                await peerConnection.current.addIceCandidate(new RTCIceCandidate(payload.candidate));
            } catch (e) {
                console.error("Error adding received ICE candidate:", e);
            }
        }
      })
      .on('broadcast', { event: 'call-ended' }, ({payload}) => {
        if (payload.sender_id !== currentUserId) {
            console.log("Remote user ended the call.");
            Alert.alert("Call Ended", "The other user has ended the call.");
            endCallLogic(true); // Navigate back
        }
      })
      .subscribe(async (status, err) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Subscribed to call channel: call:${callIdRef.current}`);
          if (isInitiatorRef.current) {
            const offer = await peerConnection.current.createOffer();
            await peerConnection.current.setLocalDescription(offer);
            callChannelRef.current.send({ type: 'broadcast', event: 'offer', payload: { offer, sender_id: currentUserId } });
            console.log("Sent offer");
          }
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || err) {
            console.error(`Call channel (call:${callIdRef.current}) subscription error:`, status, err);
            Alert.alert("Connection Error", "Could not connect to the call channel.");
            setScreenStatus('ERROR');
            endCallLogic();
        }
      });
  };

  const cleanup = async (isCallEnding = false) => {
    console.log("Cleaning up resources...");
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    setRemoteStream(null); // Clear remote stream

    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    if (waitingSubscriptionRef.current) {
      try { await waitingSubscriptionRef.current.unsubscribe(); } catch (e) { console.warn("Error unsubscribing waiting:", e); }
      waitingSubscriptionRef.current = null;
    }
    if (callChannelRef.current) {
      try { await callChannelRef.current.unsubscribe(); } catch (e) { console.warn("Error unsubscribing call channel:", e); }
      callChannelRef.current = null;
    }
    
    if (currentUserId && (screenStatus === 'SEARCHING' || screenStatus === 'CONNECTING' || screenStatus === 'IN_CALL' || isCallEnding)) {
        try {
            // Delete the user's record from users_waiting
            const { error } = await supabase.from('users_waiting').delete().eq('user_id', currentUserId);
            if (error) console.error("Error removing user from users_waiting:", error);
            else console.log("Removed user from users_waiting table.");
        } catch (error) {
            console.error("Exception removing user from users_waiting:", error);
        }
    }
    // Reset states
    setIsMuted(false);
    setIsCameraOff(false);
    isInitiatorRef.current = false;
    remoteUserIdRef.current = null;
    callIdRef.current = null;
  };

  const endCallLogic = async (shouldNavigateBack = true) => {
    console.log("endCallLogic initiated.");
    if (callChannelRef.current && callIdRef.current) { // Ensure channel and callId exist
        try {
            await callChannelRef.current.send({ type: 'broadcast', event: 'call-ended', payload: {sender_id: currentUserId} });
            console.log("Sent call-ended event.");
        } catch (e) {
            console.error("Error sending call-ended event:", e);
        }
    }
    await cleanup(true); // Pass true to indicate it's a call ending scenario for cleanup
    
    if (shouldNavigateBack) {
        navigation.goBack();
    } else {
        setScreenStatus('SEARCHING'); // Or some other appropriate state if not navigating
    }
  };

  const toggleMute = async () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => track.enabled = !track.enabled);
      setIsMuted(!isMuted);
    }
  };

  const toggleCamera = async () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
          track.enabled = !track.enabled;
      });
      setIsCameraOff(!isCameraOff);
    }
  };

  // Render logic based on screenStatus
  if (screenStatus === 'INITIALIZING') {
    return <View style={styles.centerContainer}><ActivityIndicator size="large" color="#007AFF" /><Text style={styles.statusText}>Initializing...</Text></View>;
  }
  if (screenStatus === 'SEARCHING') {
    return <View style={styles.centerContainer}><ActivityIndicator size="large" color="#007AFF" /><Text style={styles.statusText}>Searching for a match...</Text><TouchableOpacity style={styles.cancelButton} onPress={() => endCallLogic(true)}><Text style={styles.cancelButtonText}>Cancel Search</Text></TouchableOpacity></View>;
  }
  if (screenStatus === 'CONNECTING') {
    return <View style={styles.centerContainer}><ActivityIndicator size="large" color="#007AFF" /><Text style={styles.statusText}>Connecting...</Text></View>;
  }
  if (screenStatus === 'ERROR') {
    return <View style={styles.centerContainer}><Ionicons name="alert-circle-outline" size={50} color="red" /><Text style={styles.statusText}>An error occurred. Please try again.</Text><TouchableOpacity style={[styles.buttonBase, styles.errorButton]} onPress={() => navigation.goBack()}><Text style={styles.buttonText}>Go Back</Text></TouchableOpacity></View>;
  }

  // IN_CALL status
  return (
    <View style={styles.container}>
      {remoteStream ? (
        <RTCView streamURL={remoteStream.toURL()} style={styles.remoteVideo} objectFit="cover" />
      ) : (
        <View style={styles.remoteVideoPlaceholder}>
            <ActivityIndicator size="large" color="#FFF" />
            <Text style={styles.statusTextWhite}>Waiting for remote video...</Text>
        </View>
      )}
      {localStream && (
        <RTCView streamURL={localStream.toURL()} style={styles.localVideo} objectFit="cover" mirror={true} />
      )}
      <View style={styles.controlsContainer}>
        <TouchableOpacity style={styles.controlButton} onPress={toggleMute}>
          <Ionicons name={isMuted ? "mic-off-circle" : "mic-circle-outline"} size={40} color="white" />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.controlButton, styles.endCallButton]} onPress={() => endCallLogic(true)}>
          <Ionicons name="call" size={35} color="white" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlButton} onPress={toggleCamera}>
          <Ionicons name={isCameraOff ? "videocam-off-outline" : "videocam-outline"} size={40} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#1c1c1e',
  },
  statusText: {
    marginTop: 20,
    fontSize: 18,
    color: '#E5E5EA',
    textAlign: 'center',
  },
  statusTextWhite: {
    marginTop: 20,
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  remoteVideo: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  remoteVideoPlaceholder: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2c2c2e',
  },
  localVideo: {
    position: 'absolute',
    width: 120,
    height: 180,
    top: 40,
    right: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#007AFF',
    overflow: 'hidden', // Important for borderRadius on RTCView
    zIndex: 1, // Ensure it's above remote video
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingVertical: 10,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  controlButton: {
    padding: 15,
    borderRadius: 50, // Make them circular
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  endCallButton: {
    backgroundColor: '#FF3B30', // Red for end call
    paddingHorizontal: 25, // Make it slightly wider
  },
  buttonBase: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  errorButton: {
    backgroundColor: '#007AFF',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    marginTop: 30,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#555',
    borderRadius: 20,
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
  }
});

export default VideoCallScreen;