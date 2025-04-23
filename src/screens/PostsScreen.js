import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { PostsService } from '../services/PostsService';
import { supabase } from '../config/supabase';

const PostsScreen = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState([]);
  const navigation = useNavigation();

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      const data = await PostsService.getAllPosts();
      setPosts(data);
    } catch (error) {
      console.error('Error loading posts:', error);
      Alert.alert('Error', 'Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPost = async () => {
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
        
        // Prompt for caption
        Alert.prompt(
          'Add Caption',
          'Enter a caption for your post',
          async (caption) => {
            try {
              await PostsService.createPost(uri, caption, type);
              await loadPosts(); // Reload posts after upload
              Alert.alert('Success', 'Post created successfully');
            } catch (error) {
              console.error('Error creating post:', error);
              Alert.alert('Error', 'Failed to create post');
            } finally {
              setUploading(false);
            }
          }
        );
      }
    } catch (error) {
      console.error('Error adding post:', error);
      Alert.alert('Error', 'Failed to upload post');
      setUploading(false);
    }
  };

  const handleLike = async (postId) => {
    try {
      const isLiked = await PostsService.toggleLike(postId);
      setPosts(posts.map(post => {
        if (post.id === postId) {
          const currentLikes = post.likes[0].count;
          return {
            ...post,
            likes: [{ count: isLiked ? currentLikes + 1 : currentLikes - 1 }]
          };
        }
        return post;
      }));
    } catch (error) {
      console.error('Error toggling like:', error);
      Alert.alert('Error', 'Failed to update like');
    }
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;

    try {
      const newComment = await PostsService.addComment(selectedPost.id, commentText.trim());
      setComments([...comments, newComment]);
      setCommentText('');
    } catch (error) {
      console.error('Error adding comment:', error);
      Alert.alert('Error', 'Failed to add comment');
    }
  };

  const loadComments = async (postId) => {
    try {
      const data = await PostsService.getComments(postId);
      setComments(data);
    } catch (error) {
      console.error('Error loading comments:', error);
      Alert.alert('Error', 'Failed to load comments');
    }
  };

  const handleShowComments = (post) => {
    setSelectedPost(post);
    loadComments(post.id);
    setShowComments(true);
  };

  const renderPostItem = ({ item }) => (
    <View style={styles.postContainer}>
      <View style={styles.postHeader}>
        <Image
          source={{ uri: item.profiles.avatar_url || 'https://via.placeholder.com/150' }}
          style={styles.avatar}
        />
        <Text style={styles.username}>{item.profiles.username}</Text>
      </View>

      {item.type === 'video' ? (
        <Video
          source={{ uri: item.media_url }}
          style={styles.postMedia}
          resizeMode="cover"
          shouldPlay={false}
        />
      ) : (
        <Image
          source={{ uri: item.media_url }}
          style={styles.postMedia}
          resizeMode="cover"
        />
      )}

      <View style={styles.postActions}>
        <TouchableOpacity onPress={() => handleLike(item.id)}>
          <Ionicons
            name={item.is_liked ? 'heart' : 'heart-outline'}
            size={24}
            color={item.is_liked ? '#ff00ff' : '#fff'}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleShowComments(item)}>
          <Ionicons name="chatbubble-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.postFooter}>
        <Text style={styles.likes}>{item.likes[0].count} likes</Text>
        {item.caption && (
          <Text style={styles.caption}>
            <Text style={styles.username}>{item.profiles.username}</Text> {item.caption}
          </Text>
        )}
        <TouchableOpacity onPress={() => handleShowComments(item)}>
          <Text style={styles.viewComments}>
            View all {item.comments[0].count} comments
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const CommentsModal = () => (
    <Modal
      visible={showComments}
      animationType="slide"
      transparent={false}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.commentsContainer}
      >
        <View style={styles.commentsHeader}>
          <TouchableOpacity onPress={() => setShowComments(false)}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.commentsTitle}>Comments</Text>
        </View>

        <FlatList
          data={comments}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.commentItem}>
              <Image
                source={{ uri: item.profiles.avatar_url || 'https://via.placeholder.com/150' }}
                style={styles.commentAvatar}
              />
              <View style={styles.commentContent}>
                <Text style={styles.commentUsername}>{item.profiles.username}</Text>
                <Text style={styles.commentText}>{item.content}</Text>
              </View>
            </View>
          )}
        />

        <View style={styles.commentInput}>
          <TextInput
            style={styles.input}
            placeholder="Add a comment..."
            placeholderTextColor="#666"
            value={commentText}
            onChangeText={setCommentText}
          />
          <TouchableOpacity
            onPress={handleComment}
            disabled={!commentText.trim()}
          >
            <Text style={[styles.postButton, !commentText.trim() && styles.postButtonDisabled]}>
              Post
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Feed</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddPost}
          disabled={uploading}
        >
          <Ionicons name="add-circle" size={30} color="#ff00ff" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#ff00ff" style={styles.loader} />
      ) : (
        <FlatList
          data={posts}
          renderItem={renderPostItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No posts available</Text>
          }
        />
      )}

      {uploading && (
        <View style={styles.uploadingContainer}>
          <ActivityIndicator size="small" color="#ff00ff" />
          <Text style={styles.uploadingText}>Creating post...</Text>
        </View>
      )}

      <CommentsModal />
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
  postContainer: {
    marginBottom: 20,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  username: {
    color: '#fff',
    fontWeight: 'bold',
  },
  postMedia: {
    width: '100%',
    height: 400,
  },
  postActions: {
    flexDirection: 'row',
    padding: 10,
    gap: 15,
  },
  postFooter: {
    padding: 10,
  },
  likes: {
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  caption: {
    color: '#fff',
    marginBottom: 5,
  },
  viewComments: {
    color: '#666',
  },
  commentsContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  commentsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 50,
    backgroundColor: '#222',
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 15,
  },
  commentItem: {
    flexDirection: 'row',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  commentAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 10,
  },
  commentContent: {
    flex: 1,
  },
  commentUsername: {
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 2,
  },
  commentText: {
    color: '#fff',
  },
  commentInput: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#222',
    backgroundColor: '#111',
  },
  input: {
    flex: 1,
    color: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  postButton: {
    color: '#ff00ff',
    fontWeight: 'bold',
    marginLeft: 10,
  },
  postButtonDisabled: {
    color: '#666',
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
    marginTop: 50,
  },
  loader: {
    marginTop: 20,
  },
});

export default PostsScreen;