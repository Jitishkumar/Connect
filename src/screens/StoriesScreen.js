import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
  Modal,
  StatusBar,
  Animated,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Video } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { StoriesService } from '../services/StoriesService';
import { useNavigation, useRoute } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

const StoriesScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { storyGroupId, userId, initialStoryIndex = 0 } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [currentUserIndex, setCurrentUserIndex] = useState(0);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(initialStoryIndex);
  const [storyGroups, setStoryGroups] = useState([]);
  const [progress, setProgress] = useState(0);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const videoRef = useRef(null);
  const storyTimeout = useRef(null);
  const [timeRemaining, setTimeRemaining] = useState(5);
  const timerInterval = useRef(null);

  // Duration for image stories
  const STORY_DURATION = 5000; // 5 seconds

  useEffect(() => {
    loadStories();
    return () => {
      // Clear any timeouts when component unmounts
      if (storyTimeout.current) {
        clearTimeout(storyTimeout.current);
      }
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
    };
  }, []);

  useEffect(() => {
    // Reset progress when story changes
    progressAnim.setValue(0);
    setProgress(0);
    startProgress();
  }, [currentUserIndex, currentStoryIndex]);

  const loadStories = async () => {
    try {
      setLoading(true);
      const data = await StoriesService.getActiveStories();
      
      if (data.length === 0) {
        Alert.alert('No Stories', 'There are no active stories to view');
        navigation.goBack();
        return;
      }
      
      setStoryGroups(data);
      
      // If storyGroupId is provided, find the index of that group
      if (storyGroupId) {
        const groupIndex = data.findIndex(group => 
          group.stories.some(story => story.story_group_id === storyGroupId)
        );
        if (groupIndex !== -1) {
          setCurrentUserIndex(groupIndex);
        }
      } else if (userId) {
        // If userId is provided, find the index of that user's stories
        const groupIndex = data.findIndex(group => group.user_id === userId);
        if (groupIndex !== -1) {
          setCurrentUserIndex(groupIndex);
        }
      }
    } catch (error) {
      console.error('Error loading stories:', error);
      Alert.alert('Error', 'Failed to load stories');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const startProgress = () => {
    if (storyGroups.length === 0) return;
    
    const currentStory = storyGroups[currentUserIndex]?.stories[currentStoryIndex];
    if (!currentStory) return;
    
    // Clear any existing timeout and interval
    if (storyTimeout.current) {
      clearTimeout(storyTimeout.current);
    }
    if (timerInterval.current) {
      clearInterval(timerInterval.current);
    }
    
    // Mark the story as viewed
    StoriesService.markStoryAsViewed(currentStory.id);
    
    // Reset timer to 5 seconds for images, or use video duration
    const duration = currentStory.type === 'video' ? 30 : 5; // in seconds
    setTimeRemaining(duration);
    
    // Start animation
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: currentStory.type === 'video' ? 30000 : STORY_DURATION, // Use longer duration for videos as a fallback
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) {
        nextStory();
      }
    });
    
    // For images, use a timeout as backup and start the timer countdown
    if (currentStory.type === 'image') {
      storyTimeout.current = setTimeout(() => {
        nextStory();
      }, STORY_DURATION);
      
      // Update the timer every second
      timerInterval.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timerInterval.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  const nextStory = () => {
    const currentGroup = storyGroups[currentUserIndex];
    if (!currentGroup) return;
    
    if (currentStoryIndex < currentGroup.stories.length - 1) {
      // Move to next story in current user's stories
      setCurrentStoryIndex(currentStoryIndex + 1);
    } else {
      // Move to next user's stories
      if (currentUserIndex < storyGroups.length - 1) {
        setCurrentUserIndex(currentUserIndex + 1);
        setCurrentStoryIndex(0);
      } else {
        // End of all stories, go back
        navigation.goBack();
      }
    }
  };

  const prevStory = () => {
    if (currentStoryIndex > 0) {
      // Move to previous story in current user's stories
      setCurrentStoryIndex(currentStoryIndex - 1);
    } else {
      // Move to previous user's last story
      if (currentUserIndex > 0) {
        const prevUserIndex = currentUserIndex - 1;
        const prevUserStories = storyGroups[prevUserIndex].stories;
        setCurrentUserIndex(prevUserIndex);
        setCurrentStoryIndex(prevUserStories.length - 1);
      }
      // If we're at the first story of the first user, do nothing
    }
  };

  const handlePress = (event) => {
    // Pause the progress
    progressAnim.stopAnimation();
    if (storyTimeout.current) {
      clearTimeout(storyTimeout.current);
    }
    if (timerInterval.current) {
      clearInterval(timerInterval.current);
    }
    
    // Determine if press was on left or right side of screen
    const x = event.nativeEvent.locationX;
    if (x < width / 2) {
      // Left side - go to previous story
      prevStory();
    } else {
      // Right side - go to next story
      nextStory();
    }
  };

  const handleVideoRef = (ref) => {
    videoRef.current = ref;
    if (ref) {
      ref.playAsync();
    }
  };

  const handleVideoPlaybackStatusUpdate = (status) => {
    if (status.isLoaded && status.isPlaying) {
      // Update progress based on video position
      const progress = status.positionMillis / status.durationMillis;
      setProgress(progress);
      
      // When video ends, move to next story
      if (status.didJustFinish) {
        nextStory();
      }
    }
  };

  const renderProgressBars = () => {
    const currentGroup = storyGroups[currentUserIndex];
    if (!currentGroup) return null;
    
    return (
      <View style={styles.progressContainer}>
        {currentGroup.stories.map((story, index) => (
          <View key={story.id} style={styles.progressBarContainer}>
            <Animated.View 
              style={[styles.progressBar, {
                width: index === currentStoryIndex 
                  ? progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%']
                    })
                  : index < currentStoryIndex ? '100%' : '0%'
              }]}
            />
          </View>
        ))}
      </View>
    );
  };
  
  // Render the timer indicator showing seconds remaining
  const renderTimer = () => {
    if (!storyGroups[currentUserIndex]?.stories[currentStoryIndex]) return null;
    
    return (
      <Text style={styles.timerText}>
        {timeRemaining}s
      </Text>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ff00ff" />
      </View>
    );
  }

  if (storyGroups.length === 0) {
    return null; // This will be handled in loadStories with navigation.goBack()
  }

  const currentGroup = storyGroups[currentUserIndex];
  const currentStory = currentGroup?.stories[currentStoryIndex];

  if (!currentStory) {
    return null;
  }

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      
      {/* Progress bars at top */}
      {renderProgressBars()}
      
      {/* User info */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <Image 
            source={{ uri: currentGroup.user.avatar_url || 'https://via.placeholder.com/40' }} 
            style={styles.avatar} 
          />
          <Text style={styles.username}>{currentGroup.user.username}</Text>
          <Text style={styles.timestamp}>
            {new Date(currentStory.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          </Text>
          {renderTimer()}
        </View>
        
        <TouchableOpacity 
          style={styles.closeButton} 
          onPress={() => navigation.goBack()}
          hitSlop={{top: 15, bottom: 15, left: 15, right: 15}}
        >
          <Ionicons name="close-circle" size={36} color="#fff" />
        </TouchableOpacity>
      </View>
      
      {/* Story content */}
      <TouchableOpacity 
        activeOpacity={1} 
        style={styles.storyContainer} 
        onPress={handlePress}
      >
        {currentStory.type === 'video' ? (
          <Video
            ref={handleVideoRef}
            source={{ uri: currentStory.media_url }}
            style={styles.media}
            resizeMode="contain"
            shouldPlay
            isLooping={false}
            onPlaybackStatusUpdate={handleVideoPlaybackStatusUpdate}
          />
        ) : (
          <Image
            source={{ uri: currentStory.media_url }}
            style={styles.media}
            resizeMode="contain"
          />
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingTop: 50, // For status bar
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  progressBarContainer: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 2,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#fff',
  },
  username: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    marginRight: 8,
  },
  timestamp: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
  },
  closeButton: {
    padding: 5,
    zIndex: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  timerText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  timerText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  storyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  media: {
    width: '100%',
    height: '100%',
  },
});

export default StoriesScreen;