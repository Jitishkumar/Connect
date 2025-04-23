


import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, TextInput, Image, Modal, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as ImagePicker from 'expo-image-picker';
import { StoriesService } from '../services/StoriesService';
import { Video } from 'expo-av';

const HomeScreen = () => {
  const navigation = useNavigation();
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedStory, setSelectedStory] = useState(null);
  const [viewerVisible, setViewerVisible] = useState(false);
  
  let [fontsLoaded] = useFonts({
    Poppins_700Bold,
  });

  useEffect(() => {
    loadStories();
  }, []);

  const loadStories = async () => {
    try {
      const data = await StoriesService.getActiveStories();
      // Format stories data to match the expected structure
      const formattedStories = data.map(group => ({
        ...group.stories[0],
        profiles: group.user,
        groupedStories: group.stories,
        story_group_id: group.stories[0].story_group_id,
        has_unviewed: group.has_unviewed // Add the unviewed status flag
      }));
      setStories(formattedStories);
    } catch (error) {
      console.error('Error loading stories:', error);
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
        await loadStories();
        
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
    // Navigate to the StoriesScreen instead of showing the modal
    navigation.navigate('Stories', {
      storyGroupId: story.story_group_id,
      userId: story.user_id,
      initialStoryIndex: 0
    });
  };

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={styles.container}>
      {}
      <LinearGradient
        colors={['#050505', '#050505 ']}
        style={styles.header}
      >
        <Text style={styles.logo}>Flexx</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="trending-up" size={24} color="#ff00ff" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.iconButton} 
            onPress={() => navigation.navigate('Search')}
          >
            <Ionicons name="search-outline" size={24} color="#ff00ff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="notifications-outline" size={24} color="pink" />
            <View style={styles.notificationBadge} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView>
        {/* Add categories before stories */}
   

        {/* Update create post section */}
        <View style={styles.createPost}>
          <View style={styles.postInputContainer}>
            <Image
              style={styles.userAvatar}
              source={{ uri: 'https://via.placeholder.com/40' }}
            />
            <TouchableOpacity style={styles.postInputButton}>
              <Text style={styles.postInputPlaceholder}>What's happening?</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.postOptions}>
            <TouchableOpacity style={styles.postOption}>
              <Ionicons name="images" size={20} color="#800060" />
              <Text style={styles.optionText}>Gallery</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.postOption}>
              <Ionicons name="videocam" size={20} color="#800060" />
              <Text style={styles.optionText}>Live</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.postOption}>
              <Ionicons name="mic" size={20} color="#800060" />
              <Text style={styles.optionText}>Voice</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.postOption}>
              <Ionicons name="game-controller" size={20} color="#800060" />
              <Text style={styles.optionText}>Gaming</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.stories}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity style={styles.storyItem} onPress={handleAddStory} disabled={uploading}>
              <View style={styles.addStoryButton}>
                {uploading ? (
                  <ActivityIndicator size="small" color="#ff00ff" />
                ) : (
                  <Ionicons name="add" size={24} color="#ff00ff" />
                )}
              </View>
              <Text style={styles.storyText}>Share Story</Text>
            </TouchableOpacity>
            {stories.map((story) => (
              <TouchableOpacity 
                key={story.id} 
                style={styles.storyItem} 
                onPress={() => handleStoryPress(story)}
              >
                <LinearGradient
                  colors={story.has_unviewed ? ['#ff00ff', '#00ff00', '#ff00ff'] : ['#888888', '#aaaaaa', '#888888']}
                  style={styles.storyRing}
                >
                  <Image
                    style={styles.storyAvatar}
                    source={{ uri: story.profiles.avatar_url || 'https://via.placeholder.com/60' }}
                  />
                </LinearGradient>
                <Text style={styles.storyText}>{story.profiles.username}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Story Viewer Modal */}
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

        <View style={styles.feed}>
          {/* Sample Post */}
          <View style={styles.postContainer}>
            <View style={styles.post}>
              <View style={styles.postHeader}>
                <Image
                  style={styles.postUserAvatar}
                  source={{ uri: 'https://via.placeholder.com/40' }}
                />
                <View>
                  <Text style={styles.postUsername}>Kriston Watshon</Text>
                  <Text style={styles.postTime}>08:39 am</Text>
                </View>
              </View>
              <Text style={styles.postText}>
                Lorem ipsum Dolor Sit Amet, Consectetur Adipiscing Elit. Fringilla Natoque Id Aenean.
              </Text>
              <Image
                style={styles.postImage}
                source={{ uri: 'https://via.placeholder.com/400' }}
              />
             
              <View style={styles.postActions}>
                <View style={styles.actionGroup}>
                  <Ionicons name="heart-outline" size={24} color="pink" />
                  <Text style={{ color: '#e3a6d0' }}>1,964</Text>
                </View>
                <View style={styles.actionGroup}>
                  <Ionicons name="chatbubble-outline" size={24} color="pink" />
                  <Text style={{ color: '#e3a6d0' }}>135</Text>
                </View>
                <Ionicons name="share-outline" size={24} color="pink" />
                <Ionicons name="bookmark-outline" size={24} color="pink" />
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

// Update the stories section styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050505',
    paddingTop: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 2,
    paddingTop: 3, // Added top padding for notch/camera area
    backgroundColor: '#000033',
  },
  logo: {
    fontSize: 28,
    fontFamily: 'Poppins_700Bold',
    color: '#1DA1F2',
    letterSpacing: 1,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  iconButton: {
    padding: 8,
  },
  createPost: {
    backgroundColor: '#fff',
    margin: 15,
    borderRadius: 15,
    padding: 15,
    borderWidth: 1,
    borderColor: '#1a1a1a',
  },
  postInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  postInput: {
    flex: 1,
    height: 40,
    padding: 10,
    backgroundColor: '#000000',
    borderRadius: 20,
    color: '#000',
  },
  postOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 15,
  },
  postOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  optionText: {
    color: '#800060',
  },
  stories: {
    padding: 15,
    marginHorizontal: 15,
    backgroundColor: '#000',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#1a1a1a',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  storyItem: {
    alignItems: 'center',
    marginRight: 15,
    padding: 10,
  },
  addStoryButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#1DA1F2',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  storyText: {
    marginTop: 5,
    fontSize: 12,
    color: '#000', // Changed to black since background is now white
  },
  storyAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#1DA1F2', // Changed to match the theme
  },
  storyRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#000',
  },
  storyText: {
    marginTop: 5,
    fontSize: 12,
    color: '#ff00ff',
  },
  viewerContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
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
  feed: {
    padding: 15,
  },
  postContainer: {
    backgroundColor:'#660033',
    borderRadius: 15,
    marginHorizontal: 15,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#1a1a1a',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  post: {
    padding: 15,
    marginBottom: 20,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  postUserAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  postUsername: {
    fontWeight: 'bold',
    color: 'pink', // added pink color
  },
  
  postTime: {
    fontSize: 12,
    color: 'pink',
  },
  postText: {
    marginBottom: 10,
    color: '#e3a6d0',
  },
  postImage: {
    width: '100%',
    height: 300,
    borderRadius: 10,
   
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingHorizontal: 10,
  },
  actionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    
  },
  actionText: {
    color: '#800060',
    marginLeft: 5,
  },
});

export default HomeScreen;
