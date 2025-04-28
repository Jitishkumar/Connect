

import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, TextInput, Image, Modal, ActivityIndicator, Alert, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as ImagePicker from 'expo-image-picker';
import { StoriesService } from '../services/StoriesService';
import { PostsService } from '../services/PostsService';
import { Video } from 'expo-av';
import PostItem from '../components/PostItem';

const HomeScreen = () => {
  const navigation = useNavigation();
  const [stories, setStories] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedStory, setSelectedStory] = useState(null);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [postText, setPostText] = useState('');
  const [showPostInput, setShowPostInput] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [showPostOptions, setShowPostOptions] = useState(false);
  
  let [fontsLoaded] = useFonts({
    Poppins_700Bold,
  });

  useEffect(() => {
    loadStories();
    loadPosts();

    // Add listener for navigation focus
    const unsubscribe = navigation.addListener('focus', () => {
      const params = navigation.getState().routes.find(route => route.name === 'Home')?.params;
      if (params?.refresh) {
        if (params.updatedPosts) {
          setPosts(params.updatedPosts);
        } else {
          loadPosts();
        }
        // Reset the refresh parameter
        navigation.setParams({ refresh: undefined, updatedPosts: undefined });
      }
    });

    return unsubscribe;
  }, [navigation]);

  const loadPosts = async () => {
    try {
      const data = await PostsService.getAllPosts();
      setPosts(data);
    } catch (error) {
      console.error('Error loading posts:', error);
      Alert.alert('Error', 'Failed to load posts');
    }
  };

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

  const [selectedMedia, setSelectedMedia] = useState(null);

  const handleCreatePost = () => {
    navigation.navigate('CreatePost');
  };

  const handleDeletePost = async (post) => {
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await PostsService.deletePost(post.id);
              await loadPosts();
              Alert.alert('Success', 'Post deleted successfully');
            } catch (error) {
              console.error('Error deleting post:', error);
              Alert.alert('Error', 'Failed to delete post');
            }
          }
        }
      ]
    );
  };

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={styles.container}>
      {}
      <LinearGradient
        colors={['#0a0a2a', '#1a1a3a']}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={styles.header}
      >
        <Text style={styles.logo}>Flexx</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={() => navigation.navigate('Trending')}
          >
            <LinearGradient
              colors={['#ff00ff', '#9900ff']}
              style={styles.iconBackground}
            >
              <Ionicons name="trending-up" size={22} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.iconButton} 
            onPress={() => navigation.navigate('Search')}
          >
            <LinearGradient
              colors={['#00ffff', '#0099ff']}
              style={styles.iconBackground}
            >
              <Ionicons name="search-outline" size={22} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <LinearGradient
              colors={['#ff66cc', '#ff3399']}
              style={styles.iconBackground}
            >
              <Ionicons name="notifications-outline" size={22} color="#fff" />
            </LinearGradient>
            <View style={styles.notificationBadge} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView>
        {/* Add categories before stories */}
   

        {/* Update create post section */}
        <LinearGradient
          colors={['#1a1a3a', '#0d0d2a']}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
          style={styles.createPost}
        >
          <View style={styles.postInputContainer}>
            <LinearGradient
              colors={['#ff00ff', '#00ffff']}
              style={styles.avatarBorder}
            >
              <Image
                style={styles.userAvatar}
                source={{ uri: 'https://via.placeholder.com/40' }}
              />
            </LinearGradient>
            <TouchableOpacity 
              style={styles.postInputButton}
              onPress={handleCreatePost}
            >
              <Text style={styles.postInputPlaceholder}>What's happening?</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.postOptions}>
            <TouchableOpacity 
              style={styles.postOption}
              onPress={handleCreatePost}
            >
              <LinearGradient
                colors={['#ff00ff', '#9900ff']}
                style={styles.createPostButton}
              >
                <Ionicons name="create" size={18} color="#fff" />
                <Text style={styles.createPostText}>Create Post</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <LinearGradient
          colors={['#0a0a2a', '#151540']}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
          style={styles.stories}
        >
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity style={styles.storyItem} onPress={handleAddStory} disabled={uploading}>
              <LinearGradient
                colors={['#1a1a3a', '#0d0d2a']}
                style={styles.addStoryButton}
              >
                {uploading ? (
                  <ActivityIndicator size="small" color="#ff00ff" />
                ) : (
                  <Ionicons name="add" size={24} color="#ff00ff" />
                )}
              </LinearGradient>
              <Text style={styles.storyText}>Your story</Text>
            </TouchableOpacity>
            {stories.map((story) => (
              <TouchableOpacity 
                key={story.id} 
                style={styles.storyItem} 
                onPress={() => handleStoryPress(story)}
              >
                <LinearGradient
                  colors={story.has_unviewed ? ['#ff00ff', '#00ffff', '#ff00ff'] : ['#888888', '#aaaaaa', '#888888']}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 1}}
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
        </LinearGradient>

        {/* Post Input Modal */}
        <Modal
          visible={showPostInput}
          transparent={true}
          animationType="slide"
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <TouchableOpacity 
                  onPress={() => {
                    setShowPostInput(false);
                    setSelectedMedia(null);
                    setPostText('');
                  }}
                >
                  <Ionicons name="close" size={24} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.postButton, (!selectedMedia && !postText.trim()) && styles.disabledButton]}
                  onPress={handleCreatePost}
                  disabled={!selectedMedia && !postText.trim()}
                >
                  <Text style={styles.postButtonText}>Post</Text>
                </TouchableOpacity>
              </View>

              {selectedMedia && (
                <View style={styles.mediaPreview}>
                  {selectedMedia.type === 'video' ? (
                    <Video
                      source={{ uri: selectedMedia.uri }}
                      style={styles.previewMedia}
                      resizeMode="cover"
                      shouldPlay={false}
                      useNativeControls
                    />
                  ) : (
                    <Image
                      source={{ uri: selectedMedia.uri }}
                      style={styles.previewMedia}
                      resizeMode="cover"
                    />
                  )}
                </View>
              )}

              <TextInput
                style={[styles.postInput, selectedMedia && styles.postInputWithMedia]}
                placeholder="Write a caption..."
                placeholderTextColor="#888"
                multiline
                value={postText}
                onChangeText={setPostText}
                color="#ffffff"
                autoFocus={selectedMedia ? true : false}
              />
            </View>
          </View>
        </Modal>

        {/* Post Options Modal */}
        <Modal
          visible={showPostOptions}
          transparent={true}
          animationType="slide"
        >
          <TouchableOpacity 
            style={styles.modalOverlay}
            onPress={() => setShowPostOptions(false)}
          >
            <View style={styles.optionsModal}>
              <TouchableOpacity 
                style={styles.optionItem}
                onPress={() => {
                  setShowPostOptions(false);
                  handleDeletePost(selectedPost);
                }}
              >
                <Ionicons name="trash-outline" size={24} color="#ff0000" />
                <Text style={[styles.optionText, { color: '#ff0000' }]}>Delete Post</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

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
          {posts.map((post) => (
            <PostItem 
              key={post.id} 
              post={post} 
              onOptionsPress={() => {
                setSelectedPost(post);
                setShowPostOptions(true);
              }}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

// Update the stories section styles
const styles = StyleSheet.create({
  postInput: {
    color: '#ffffff',
    fontSize: 16,
    padding: 15,
    textAlignVertical: 'top',
    minHeight: 100,
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    marginTop: 15,
    flex: 1,
    borderWidth: 1,
    borderColor: '#333333',
  },

  postInputWithMedia: {
    minHeight: 80,
    marginTop: 10,
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    color: '#ffffff',
    borderWidth: 1,
    borderColor: '#ff00ff',
    padding: 15,
  },
  container: {
    flex: 1,
    backgroundColor: '#050520',
    paddingTop: 20,
  },

  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },

  modalContent: {
    backgroundColor: '#121212',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    minHeight: 200,
    maxHeight: '90%',
  },

  modalContentScroll: {
    flex: 1,
    width: '100%',
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },

  postButton: {
    backgroundColor: '#ff00ff',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },

  disabledButton: {
    backgroundColor: '#666',
  },

  mediaPreview: {
    width: '100%',
    height: 300,
    marginBottom: 15,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
  },

  previewMedia: {
    width: '100%',
    height: '100%',
  },
  postButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },

  postInput: {
    color: '#ffffff',
    fontSize: 16,
    minHeight: 100,
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    padding: 15,
    marginTop: 10,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },

  optionsModal: {
    backgroundColor: '#121212',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },

  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    paddingTop: 12, // Added top padding for notch/camera area
    paddingLeft: 20,
    paddingRight: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 0, 255, 0.2)',
  },
  logo: {
    fontSize: 30,
    fontFamily: 'Poppins_700Bold',
    color: '#ff00ff',
    letterSpacing: 1,
    textShadowColor: 'rgba(255, 0, 255, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconButton: {
    padding: 6,
  },
  iconBackground: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  notificationBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff00ff',
    borderWidth: 1,
    borderColor: '#fff',
  },
  createPost: {
    margin: 15,
    borderRadius: 16,
    padding: 15,
    shadowColor: '#6600cc',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 0, 255, 0.2)',
  },
  postInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarBorder: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    borderColor: '#0d0d2a',
  },
  postInputButton: {
    flex: 1,
    height: 46,
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 23,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 0, 255, 0.3)',
  },
  postInputPlaceholder: {
    color: '#b8b8ff',
    fontSize: 15,
  },
  postOptions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 15,
  },
  postOption: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  createPostButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  createPostText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  stories: {
    padding: 14,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 0, 255, 0.2)',
  },
  storyItem: {
    alignItems: 'center',
    marginRight: 16,
  },
  addStoryButton: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ff00ff',
    shadowColor: '#ff00ff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  storyRing: {
    width: 74,
    height: 74,
    borderRadius: 37,
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#ff00ff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 8,
  },
  storyAvatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2,
    borderColor: '#0d0d2a',
  },
  storyText: {
    marginTop: 8,
    fontSize: 12,
    color: '#e0e0ff',
    textAlign: 'center',
    maxWidth: 70,
    fontWeight: '500',
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
    backgroundColor: '#660033',
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

  postHeaderInfo: {
    flex: 1,
  },

  postOptionsButton: {
    padding: 5,
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
  postMedia: {
    width: '100%',
    height: 300,
    borderRadius: 10,
    marginVertical: 10,
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

