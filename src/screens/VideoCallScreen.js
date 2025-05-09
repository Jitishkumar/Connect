import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { RTCPeerConnection, RTCView, mediaDevices } from 'react-native-webrtc';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../config/supabase';

const configuration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

const VideoCallScreen = ({ route, navigation }) => {
  const { callId, isInitiator, remoteUserId } = route.params;
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [callStatus, setCallStatus] = useState('pending');
  const peerConnection = useRef(null);

  useEffect(() => {
    setupWebRTC();
    return () => cleanupWebRTC();
  }, []);

  const setupWebRTC = async () => {
    try {
      // Get local stream
      const stream = await mediaDevices.getUserMedia({
        audio: true,
        video: {
          facingMode: 'user',
          width: 640,
          height: 480
        }
      });
      setLocalStream(stream);

      // Create and setup peer connection
      peerConnection.current = new RTCPeerConnection(configuration);

      // Add local stream tracks to peer connection
      stream.getTracks().forEach(track => {
        peerConnection.current.addTrack(track, stream);
      });

      // Handle incoming stream
      peerConnection.current.ontrack = (event) => {
        setRemoteStream(event.streams[0]);
      };

      // Setup signaling
      setupSignaling();

      // Start the call if initiator
      if (isInitiator) {
        createAndSendOffer();
      }
    } catch (err) {
      console.error('Error setting up WebRTC:', err);
    }
  };

  const setupSignaling = () => {
    // Subscribe to signaling channel
    const subscription = supabase
      .channel(`call:${callId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'calls',
        filter: `id=eq.${callId}`,
      }, handleSignalingMessage)
      .subscribe();

    return () => subscription.unsubscribe();
  };

  const handleSignalingMessage = async (payload) => {
    const { type, sdp, candidate } = payload.new;

    try {
      if (type === 'offer' && !isInitiator) {
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(sdp));
        const answer = await peerConnection.current.createAnswer();
        await peerConnection.current.setLocalDescription(answer);
        sendSignalingMessage('answer', answer);
      } else if (type === 'answer' && isInitiator) {
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(sdp));
      } else if (type === 'candidate') {
        await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
      }
    } catch (err) {
      console.error('Error handling signaling message:', err);
    }
  };

  const createAndSendOffer = async () => {
    try {
      const offer = await peerConnection.current.createOffer();
      await peerConnection.current.setLocalDescription(offer);
      sendSignalingMessage('offer', offer);
    } catch (err) {
      console.error('Error creating offer:', err);
    }
  };

  const sendSignalingMessage = async (type, payload) => {
    try {
      await supabase.from('calls').insert([{
        id: callId,
        from_user: isInitiator ? supabase.auth.user().id : remoteUserId,
        to_user: isInitiator ? remoteUserId : supabase.auth.user().id,
        type,
        status: type === 'offer' ? 'pending' : type === 'answer' ? 'active' : callStatus,
        sdp: type === 'offer' || type === 'answer' ? payload : null,
        candidate: type === 'candidate' ? payload : null
      }]);
    } catch (err) {
      console.error('Error sending signaling message:', err);
    }
  };

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleCamera = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsCameraOff(!isCameraOff);
    }
  };

  const endCall = async () => {
    try {
      await supabase.from('calls').update({ status: 'ended' }).eq('id', callId);
      cleanupWebRTC();
      navigation.goBack();
    } catch (err) {
      console.error('Error ending call:', err);
      navigation.goBack();
    } // Added missing closing brace
  };

  const cleanupWebRTC = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    if (peerConnection.current) {
      peerConnection.current.close();
    }
  };

  return (
    <LinearGradient
      colors={['#0a0a2a', '#1a1a3a']}
      style={styles.container}
    >
      {remoteStream && (
        <RTCView
          streamURL={remoteStream.toURL()}
          style={styles.remoteStream}
          objectFit="cover"
        />
      )}
      {localStream && (
        <RTCView
          streamURL={localStream.toURL()}
          style={styles.localStream}
          objectFit="cover"
          zOrder={1}
        />
      )}
      
      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlButton} onPress={toggleMute}>
          <Ionicons name={isMuted ? 'mic-off' : 'mic'} size={24} color="#fff" />
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.controlButton, styles.endCallButton]} onPress={endCall}>
          <Ionicons name="call" size={24} color="#fff" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.controlButton} onPress={toggleCamera}>
          <Ionicons name={isCameraOff ? 'videocam-off' : 'videocam'} size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  remoteStream: {
    flex: 1,
  },
  localStream: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 100,
    height: 150,
    backgroundColor: '#444',
    borderRadius: 10,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
  },
  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  endCallButton: {
    backgroundColor: '#ff4444',
    transform: [{ rotate: '135deg' }],
  },
});

export default VideoCallScreen;