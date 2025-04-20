import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Modal,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { StoriesService } from '../services/StoriesService';
import { supabase } from '../config/supabase';

const StoriesScreen = () => {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedStory, setSelectedStory] = useState(null);
  const [viewerVisible, setViewerVisible] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    loadStories();
  }, []);

  const loadStories = async () => {
    try {
      const data = await StoriesService.getActiveStories();
      setStories(data);
    } catch (error) {
      console.error('Error loading stories:', error);
      Alert.alert('Error', 'Failed to load stories');
    } finally {
      setLoading(false);
    }
  };

  const handleAddStory = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        setUploading(true);
        const uri = result.assets[0].uri;
        const type = uri.endsWith('.mp4') ? 'video' : 'image';
        
        await StoriesService.uploadStory(uri, type);
        await loadStories(); // Reload stories after upload
        
        Alert.alert('Success', 'Story uploaded successfully');
      }
    } catch (error) {
      console.error('Error adding story:', error);
      Alert.alert('Error', 'Failed to upload story');
    } finally {
      setUploading(false);
    }
  };

  const handleStoryPress = (story) => {
    setSelectedStory(story);
    setViewerVisible(true);
  };

  const renderStoryItem = ({ item }) => (
    <TouchableOpacity
      style={styles.storyItem}
      onPress={() => handleStoryPress(item)}
    >
      <View style={styles.storyAvatarContainer}>
        <Image
          source={{ uri: item.profiles.avatar_url || 'https://via.placeholder.com/150' }}
          style={styles.storyAvatar}
        />
        <Text style={styles.storyUsername} numberOfLines={1}>
          {item.profiles.username}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const StoryViewer = () => (
    <Modal
      visible={viewerVisible}
      transparent={false}
      animationType="slide"
    >
      <View style={styles.viewerContainer}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => {
            setViewerVisible(false);
            setSelectedStory(null);
          }}
        >
          <Ionicons name="close" size={30} color="#fff" />
        </TouchableOpacity>

        {selectedStory && (
          <View style={styles.storyContent}>
            {selectedStory.type === 'video' ? (
              <Video
                source={{ uri: selectedStory.media_url }}
                style={styles.storyMedia}
                resizeMode="contain"
                shouldPlay
                isLooping
              />
            ) : (
              <Image
                source={{ uri: selectedStory.media_url }}
                style={styles.storyMedia}
                resizeMode="contain"
              />
            )}
          </View>
        )}
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Stories</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddStory}
          disabled={uploading}
        >
          <Ionicons name="add-circle" size={30} color="#ff00ff" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#ff00ff" style={styles.loader} />
      ) : (
        <FlatList
          data={stories}
          renderItem={renderStoryItem}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.storiesList}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No stories available</Text>
          }
        />
      )}

      {uploading && (
        <View style={styles.uploadingContainer}>
          <ActivityIndicator size="small" color="#ff00ff" />
          <Text style={styles.uploadingText}>Uploading story...</Text>
        </View>
      )}

      <StoryViewer />
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 50,
    backgroundColor: '#222',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  addButton: {
    padding: 8,
  },
  storiesList: {
    padding: 10,
  },
  storyItem: {
    marginRight: 15,
  },
  storyAvatarContainer: {
    alignItems: 'center',
  },
  storyAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
    borderColor: '#ff00ff',
  },
  storyUsername: {
    color: '#fff',
    fontSize: 12,
    marginTop: 5,
    maxWidth: 70,
    textAlign: 'center',
  },
  viewerContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 1,
  },
  storyContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyMedia: {
    width: '100%',
    height: '100%',
  },
  uploadingContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -70 }, { translateY: -40 }],
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 20,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  uploadingText: {
    color: '#fff',
    marginLeft: 10,
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
  },
  loader: {
    marginTop: 20,
  },
});

export default StoriesScreen;