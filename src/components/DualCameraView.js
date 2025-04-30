import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, Text, Platform } from 'react-native';
import { Camera } from 'expo-camera';
import { MaterialIcons } from '@expo/vector-icons';
import { Video } from 'expo-av';

const DualCameraView = ({ onRecordingComplete }) => {
  const [hasPermission, setHasPermission] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [type, setType] = useState(Camera.Constants.Type.back);
  const frontCamera = useRef(null);
  const backCamera = useRef(null);
  const [frontRecording, setFrontRecording] = useState(null);
  const [backRecording, setBackRecording] = useState(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      const audioStatus = await Camera.requestMicrophonePermissionsAsync();
      setHasPermission(status === 'granted' && audioStatus.status === 'granted');
    })();
  }, []);

  const startRecording = async () => {
    setIsRecording(true);
    
    // Start recording on both cameras
    if (frontCamera.current && backCamera.current) {
      const frontOptions = {
        quality: Camera.Constants.VideoQuality['720p'],
        maxDuration: 60,
        mute: false,
      };

      const backOptions = {
        quality: Camera.Constants.VideoQuality['720p'],
        maxDuration: 60,
        mute: true, // Mute back camera to avoid audio overlap
      };

      try {
        const frontVideo = await frontCamera.current.recordAsync(frontOptions);
        const backVideo = await backCamera.current.recordAsync(backOptions);
        
        setFrontRecording(frontVideo);
        setBackRecording(backVideo);
      } catch (error) {
        console.error('Error recording:', error);
      }
    }
  };

  const stopRecording = async () => {
    setIsRecording(false);
    
    if (frontCamera.current && backCamera.current) {
      try {
        await frontCamera.current.stopRecording();
        await backCamera.current.stopRecording();
        
        // Pass both recordings to parent component
        if (frontRecording && backRecording) {
          onRecordingComplete({
            frontVideo: frontRecording.uri,
            backVideo: backRecording.uri
          });
        }
      } catch (error) {
        console.error('Error stopping recording:', error);
      }
    }
  };

  if (hasPermission === null) {
    return <View />;
  }
  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.cameraContainer}>
        <Camera
          ref={frontCamera}
          style={styles.frontCamera}
          type={Camera.Constants.Type.front}
        />
        <Camera
          ref={backCamera}
          style={styles.backCamera}
          type={Camera.Constants.Type.back}
        />
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.recordButton}
          onPress={isRecording ? stopRecording : startRecording}
        >
          <MaterialIcons
            name={isRecording ? 'stop' : 'fiber-manual-record'}
            size={40}
            color={isRecording ? '#ff0000' : '#ffffff'}
          />
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
  cameraContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  frontCamera: {
    flex: 1,
    borderRadius: 10,
    margin: 5,
    overflow: 'hidden',
  },
  backCamera: {
    flex: 1,
    borderRadius: 10,
    margin: 5,
    overflow: 'hidden',
  },
  controls: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default DualCameraView;