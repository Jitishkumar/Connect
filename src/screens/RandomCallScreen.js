import React, { useEffect, useRef, useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { RTCPeerConnection, RTCView, mediaDevices, RTCSessionDescription, RTCIceCandidate } from 'react-native-webrtc';
import { supabase } from '../config/supabase'; // Using your existing Supabase setup

const RandomCallScreen = () => {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isCalling, setIsCalling] = useState(false);
  const [callStatus, setCallStatus] = useState('Idle'); // Idle, Searching, Connecting, Connected, Failed
  const peerConnection = useRef(null);
  const roomId = useRef(null);
  const supabaseChannel = useRef(null);

  const configuration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      // You might need a TURN server for users behind restrictive NATs
    ]
  };

  useEffect(() => {
    // Request permissions first
    const requestPermissions = async () => {
      try {
        const stream = await mediaDevices.getUserMedia({ audio: true, video: true });
        // We got permissions, but we'll set up WebRTC when user clicks "start call"
        // or when joining a call. For now, stop the tracks if not needed immediately.
        stream.getTracks().forEach(track => track.stop());
      } catch (err) {
        Alert.alert("Permissions Error", "Camera and microphone permissions are required for video calls.");
        console.error("Permissions error:", err);
      }
    };
    requestPermissions();

    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      if (peerConnection.current) {
        peerConnection.current.close();
      }
      if (supabaseChannel.current) {
        supabase.removeChannel(supabaseChannel.current);
        supabaseChannel.current = null;
      }
    };
  }, []);

  const setupWebRTC = async () => {
    try {
      setCallStatus('Initializing');
      const stream = await mediaDevices.getUserMedia({
        audio: true,
        video: {
          facingMode: 'user',
        }
      });
      setLocalStream(stream);

      peerConnection.current = new RTCPeerConnection(configuration);

      stream.getTracks().forEach(track => {
        peerConnection.current.addTrack(track, stream);
      });

      peerConnection.current.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          setRemoteStream(event.streams[0]);
          setCallStatus('Connected');
        }
      };

      peerConnection.current.onicecandidate = (event) => {
        if (event.candidate) {
          sendICECandidate(event.candidate);
        }
      };

      peerConnection.current.oniceconnectionstatechange = () => {
        console.log('ICE Connection State:', peerConnection.current?.iceConnectionState);
        if (peerConnection.current?.iceConnectionState === 'failed' ||
            peerConnection.current?.iceConnectionState === 'disconnected' ||
            peerConnection.current?.iceConnectionState === 'closed') {
          // Handle call failure or disconnection
          setCallStatus('Failed/Disconnected');
          // Potentially cleanup and allow user to try again
        }
      };

    } catch (err) {
      console.error('Error setting up WebRTC:', err);
      setCallStatus('Failed');
      Alert.alert("WebRTC Error", "Failed to initialize video call components.");
    }
  };

  const sendICECandidate = async (candidate) => {
    if (roomId.current && candidate) {
      try {
        // Assuming your table is 'video_calls' and has 'room_id', 'type', 'candidate' columns
        await supabase.from('video_calls').insert({
          room_id: roomId.current,
          type: 'candidate_signal', // To identify this record as an ICE candidate
          candidate: candidate,
        });
      } catch (error) {
        console.error('Error sending ICE candidate:', error);
      }
    }
  };

  const startCall = async () => {
    if (isCalling) return;

    setIsCalling(true);
    setCallStatus('Searching');
    await setupWebRTC(); // Ensure WebRTC is set up before creating offer

    if (!peerConnection.current) {
        Alert.alert("Error", "WebRTC not initialized. Cannot start call.");
        setIsCalling(false);
        setCallStatus('Failed');
        return;
    }

    roomId.current = `call_${Math.random().toString(36).substring(2, 9)}`;
    
    try {
      const offer = await peerConnection.current.createOffer();
      await peerConnection.current.setLocalDescription(new RTCSessionDescription(offer));
      
      // Store the offer in Supabase
      // Assuming 'video_calls' table has 'room_id', 'type', 'offer', 'status'
      const { error } = await supabase.from('video_calls').insert({
        room_id: roomId.current,
        type: 'call_offer', // To identify this record as a call offer
        offer: offer,
        status: 'waiting' // For other users to find this waiting call
      });

      if (error) {
        throw error;
      }
      
      setCallStatus('Waiting for peer');
      subscribeToSignals(roomId.current);
    } catch (err) {
      console.error('Error starting call:', err);
      Alert.alert("Call Error", `Failed to start call: ${err.message}`);
      setIsCalling(false);
      setCallStatus('Failed');
    }
  };

  const subscribeToSignals = (currentRoomId) => {
    if (supabaseChannel.current) {
      supabase.removeChannel(supabaseChannel.current);
    }

    supabaseChannel.current = supabase.channel(`room:${currentRoomId}`);
    supabaseChannel.current
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'video_calls', 
        filter: `room_id=eq.${currentRoomId}` 
      }, async (payload) => {
        const newRecord = payload.new;
        if (!peerConnection.current) return;

        if (newRecord.type === 'answer_signal' && newRecord.answer) {
          setCallStatus('Connecting');
          try {
            await peerConnection.current.setRemoteDescription(new RTCSessionDescription(newRecord.answer));
          } catch (e) {
            console.error("Error setting remote description for answer:", e);
            setCallStatus('Failed');
          }
        } else if (newRecord.type === 'candidate_signal' && newRecord.candidate) {
          try {
            await peerConnection.current.addIceCandidate(new RTCIceCandidate(newRecord.candidate));
          } catch (e) {
            console.error("Error adding ICE candidate:", e);
          }
        }
      })
      .subscribe((status, err) => {
        if (err) {
          console.error(`Subscription error for room ${currentRoomId}:`, err);
          setCallStatus('Failed');
        }
      });
  };

  const endCall = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    if (remoteStream) {
        remoteStream.getTracks().forEach(track => track.stop());
        setRemoteStream(null);
    }
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    if (supabaseChannel.current) {
      supabase.removeChannel(supabaseChannel.current);
      supabaseChannel.current = null;
    }
    if (roomId.current) {
      // Optionally update call status in Supabase to 'ended'
      // supabase.from('video_calls').update({ status: 'ended' }).eq('room_id', roomId.current).eq('type', 'call_offer');
      roomId.current = null;
    }
    setIsCalling(false);
    setCallStatus('Idle');
  };


  return (
    <View style={styles.container}>
      <Text style={styles.statusText}>Status: {callStatus}</Text>
      {localStream && (
        <RTCView
          streamURL={localStream.toURL()}
          style={styles.localStream}
          objectFit={'cover'}
          mirror={true}
        />
      )}
      {remoteStream && (
        <RTCView
          streamURL={remoteStream.toURL()}
          style={styles.remoteStream}
          objectFit={'cover'}
        />
      )}
      {!isCalling && callStatus !== 'Connected' && (
        <TouchableOpacity
          style={styles.button}
          onPress={startCall}
          disabled={isCalling}
        >
          <Text style={styles.buttonText}>
            {isCalling ? 'Connecting...' : 'Start Random Call'}
          </Text>
        </TouchableOpacity>
      )}
      {(isCalling || callStatus === 'Connected' || remoteStream) && (
         <TouchableOpacity
          style={[styles.button, styles.endCallButton]}
          onPress={endCall}
        >
          <Text style={styles.buttonText}>End Call</Text>
        </TouchableOpacity>
      )}
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
  localStream: {
    position: 'absolute',
    width: 120,
    height: 180,
    top: 20,
    right: 20,
    zIndex: 2,
    borderColor: 'white',
    borderWidth: 1,
  },
  remoteStream: {
    width: '100%',
    height: '100%',
    zIndex: 1,
  },
  button: {
    position: 'absolute',
    bottom: 50,
    width: '60%',
    alignSelf: 'center',
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 25,
  },
  endCallButton: {
    backgroundColor: '#FF3B30',
    bottom: 120, // Position it above the start call button if both were visible
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusText: {
    position: 'absolute',
    top: 50,
    color: 'white',
    fontSize: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 5,
    borderRadius: 5,
    zIndex: 3,
  }
});

export default RandomCallScreen;