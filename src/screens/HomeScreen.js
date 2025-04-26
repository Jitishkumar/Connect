


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
  }, []);

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

  const handleMediaPicker = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const uri = result.assets[0].uri;
        if (!uri) {
          Alert.alert('Error', 'Failed to get image/video');
          return;
        }

        setUploading(true);
        const type = uri.endsWith('.mp4') ? 'video' : 'image';
        
        await PostsService.createPost(uri, postText || '', type);
        await loadPosts();
        setShowPostInput(false);
        setPostText('');
        Alert.alert('Success', 'Post created successfully');
      }
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert('Error', error.message || 'Failed to create post');
    } finally {
      setUploading(false);
    }
  };

  const handleCreatePost = async () => {
    if (!postText.trim()) {
      Alert.alert('Error', 'Please enter some text for your post');
      return;
    }

    try {
      setUploading(true);
      // Pass empty string instead of null for media_url
      await PostsService.createPost('', postText.trim(), 'text');
      await loadPosts();
      setShowPostInput(false);
      setPostText('');
      Alert.alert('Success', 'Post created successfully');
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert('Error', 'Failed to create post');
    } finally {
      setUploading(false);
    }
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
            <TouchableOpacity 
              style={styles.postInputButton}
              onPress={() => setShowPostInput(true)}
            >
              <Text style={styles.postInputPlaceholder}>What's happening?</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.postOptions}>
            <TouchableOpacity 
              style={styles.postOption}
              onPress={handleMediaPicker}
            >
              <Ionicons name="images" size={20} color="#ff00ff" />
              <Text style={[styles.optionText, { color: '#fff' }]}>Gallery</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.postOption}
              onPress={() => setShowPostInput(true)}
            >
              <Ionicons name="create" size={20} color="#ff00ff" />
              <Text style={[styles.optionText, { color: '#fff' }]}>Text</Text>
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
              <Text style={styles.storyText}>Your story</Text>
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

        {/* Post Input Modal */}
        <Modal
          visible={showPostInput}
          transparent={true}
          animationType="slide"
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setShowPostInput(false)}>
                  <Ionicons name="close" size={24} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.postButton}
                  onPress={handleCreatePost}
                >
                  <Text style={styles.postButtonText}>Post</Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={styles.postInput}
                placeholder="What's happening?"
                placeholderTextColor="#666"
                multiline
                value={postText}
                onChangeText={setPostText}
                color="#fff"
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
            <View key={post.id} style={styles.postContainer}>
              <View style={styles.post}>
                <View style={styles.postHeader}>
                  <Image
                    style={styles.postUserAvatar}
                    source={{ uri: post.profiles.avatar_url || 'https://via.placeholder.com/40' }}
                  />
                  <View style={styles.postHeaderInfo}>
                    <Text style={styles.postUsername}>{post.profiles.username}</Text>
                    <Text style={styles.postTime}>
                      {new Date(post.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.postOptionsButton}
                    onPress={() => {
                      setSelectedPost(post);
                      setShowPostOptions(true);
                    }}
                  >
                    <Ionicons name="ellipsis-horizontal" size={24} color="#fff" />
                  </TouchableOpacity>
                </View>
                {post.caption && (
                  <Text style={styles.postText}>{post.caption}</Text>
                )}
                {post.type === 'video' ? (
                  <Video
                    source={{ uri: post.media_url }}
                    style={styles.postMedia}
                    resizeMode="cover"
                    shouldPlay={false}
                    isLooping
                    useNativeControls
                  />
                ) : post.media_url && (
                  <Image
                    style={styles.postMedia}
                    source={{ uri: post.media_url }}
                  />
                )}
                <View style={styles.postActions}>
                  <View style={styles.actionGroup}>
                    <Ionicons name="heart-outline" size={24} color="pink" />
                    <Text style={{ color: '#e3a6d0' }}>{post.likes[0]?.count || 0}</Text>
                  </View>
                  <View style={styles.actionGroup}>
                    <Ionicons name="chatbubble-outline" size={24} color="pink" />
                    <Text style={{ color: '#e3a6d0' }}>{post.comments[0]?.count || 0}</Text>
                  </View>
                  <Ionicons name="share-outline" size={24} color="pink" />
                  <Ionicons name="bookmark-outline" size={24} color="pink" />
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

// Update the stories section styles
const styles = StyleSheet.create({
  postInput: {
    color: '#fff',
    fontSize: 16,
    padding: 15,
    textAlignVertical: 'top',
    minHeight: 100,
  },
  container: {
    flex: 1,
    backgroundColor: '#050505',
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
    padding: 2,
    paddingTop: 2, // Added top padding for notch/camera area
    backgroundColor: '#000033',
    paddingLeft:20,
  },
  logo: {
    fontSize: 30,
    fontFamily: 'Poppins_700Bold',
    color: '#1DA1F2',
    letterSpacing: 1,
    marginLeft: 5,
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
    borderWidth: 3,
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
    padding: 10,
    backgroundColor: '#050505',
    borderBottomWidth: 0.5,
    borderBottomColor: '#333',
    marginBottom: 10,
  },
  storyItem: {
    alignItems: 'center',
    marginRight: 15,
  },
  addStoryButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#333',
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
    borderWidth: 0.5,
    borderColor: '#333',
  },
  storyText: {
    marginTop: 5,
    fontSize: 12,
    color: '#fff',
    textAlign: 'center',
    maxWidth: 70,
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
