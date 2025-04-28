import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Video } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const PostItem = ({ post, onLike, onComment, onOptionsPress }) => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [lastTap, setLastTap] = useState(null);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef(null);

  const handleProfilePress = () => {
    navigation.navigate('UserProfile', { userId: post.user_id });
  };

  const handleVideoPress = () => {
    const now = Date.now();
    if (lastTap && (now - lastTap) < 300) {
      setPlaying(false);
      setFullscreen(true);
    } else {
      setPlaying(!playing);
    }
    setLastTap(now);
  };

  const handleFullscreenClose = () => {
    setFullscreen(false);
    setPlaying(false);
  };

  const onPlaybackStatusUpdate = (status) => {
    if (status.isLoaded) {
      setProgress(status.positionMillis / status.durationMillis);
    }
  };

  return (
    <>
      <LinearGradient
        colors={['#1a1a3a', '#0d0d2a']}
        style={styles.container}
      >
        {/* Post Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerLeft} onPress={handleProfilePress}>
            <LinearGradient colors={['#ff00ff', '#00ffff']} style={styles.avatarBorder}>
              <Image
                source={{ uri: post.profiles.avatar_url || 'https://via.placeholder.com/150' }}
                style={styles.avatar}
              />
            </LinearGradient>
            <View style={styles.headerInfo}>
              <Text style={styles.username}>{post.profiles.username}</Text>
              <Text style={styles.timestamp}>
                {new Date(post.created_at).toLocaleDateString()}
              </Text>
            </View>
          </TouchableOpacity>
          {onOptionsPress && (
            <TouchableOpacity style={styles.optionsButton} onPress={() => onOptionsPress(post)}>
              <Ionicons name="ellipsis-vertical" size={20} color="#fff" />
            </TouchableOpacity>
          )}
        </View>

        {/* Post Caption */}
        {post.caption && (
          <View style={styles.captionContainer}>
            <Text style={styles.caption}>{post.caption}</Text>
          </View>
        )}

        {/* Post Media */}
        {post.media_url && (
          <View style={styles.mediaContainer}>
            {post.type === 'video' ? (
              <TouchableOpacity activeOpacity={0.9} onPress={handleVideoPress}>
                <View style={styles.videoContainer}>
                  {loading && (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="large" color="#ff00ff" />
                      <Text style={styles.loadingText}>Loading video...</Text>
                    </View>
                  )}

                  <Video
                    source={{ uri: post.media_url }}
                    style={styles.media}
                    resizeMode="cover"
                    shouldPlay={playing}
                    isLooping
                    onLoadStart={() => setLoading(true)}
                    onLoad={() => setLoading(false)}
                    onPlaybackStatusUpdate={(status) => {
                      if (status.isLoaded) {
                        setProgress(status.positionMillis / status.durationMillis);
                      }
                    }}
                    onError={() => {
                      setLoading(false);
                      setVideoError(true);
                    }}
                  />

                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.7)']}
                    style={styles.videoControls}
                  >
                    <View style={styles.progressContainer}>
                      <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
                    </View>

                    <TouchableOpacity style={styles.playPauseButton} onPress={() => setPlaying(!playing)}>
                      <Ionicons name={playing ? "pause" : "play"} size={24} color="#fff" />
                    </TouchableOpacity>
                  </LinearGradient>

                  {!playing && !loading && (
                    <LinearGradient colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.6)']} style={styles.videoOverlay}>
                      <View style={styles.playButton}>
                        <LinearGradient colors={['#ff00ff', '#9900ff']} style={styles.playButtonGradient}>
                          <Ionicons name="play" size={30} color="#fff" />
                        </LinearGradient>
                      </View>
                    </LinearGradient>
                  )}

                  {videoError && (
                    <View style={styles.errorContainer}>
                      <Ionicons name="alert-circle" size={30} color="#ff00ff" />
                      <Text style={styles.errorText}>Video unavailable</Text>
                      <Text style={styles.errorSubText}>Tap to retry</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ) : (
              <View style={styles.imageContainer}>
                <Image
                  source={{ uri: post.media_url }}
                  style={styles.media}
                  resizeMode="cover"
                  onLoadStart={() => setImageLoaded(false)}
                  onLoad={() => setImageLoaded(true)}
                />
                {!imageLoaded && (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#ff00ff" />
                    <Text style={styles.loadingText}>Loading image...</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        {/* Post Actions */}
        <LinearGradient colors={['rgba(26, 26, 58, 0.8)', 'rgba(13, 13, 42, 0.9)']} style={styles.actions}>
          <TouchableOpacity style={styles.actionButton} onPress={() => onLike(post.id)}>
            <LinearGradient colors={post.is_liked ? ['#ff00ff', '#9900ff'] : ['transparent', 'transparent']} style={post.is_liked ? styles.likedIconBackground : {}}>
              <Ionicons name={post.is_liked ? 'heart' : 'heart-outline'} size={26} color={post.is_liked ? '#fff' : '#e0e0ff'} />
            </LinearGradient>
            <Text style={[styles.actionText, post.is_liked && styles.likedText]}>
              {post.likes && post.likes[0] ? post.likes[0].count : 0}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={() => onComment(post)}>
            <Ionicons name="chatbubble-outline" size={24} color="#e0e0ff" />
            <Text style={styles.actionText}>
              {post.comments && post.comments[0] ? post.comments[0].count : 0}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="share-social-outline" size={24} color="#e0e0ff" />
          </TouchableOpacity>
        </LinearGradient>
      </LinearGradient>

      {/* Fullscreen Video */}
      {fullscreen && (
        <Modal
          visible={fullscreen}
          transparent={false}
          animationType="fade"
          onRequestClose={handleFullscreenClose}
        >
          <View style={styles.fullscreenContainer}>
            <View style={styles.topProgressContainer}>
              <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
            </View>

            <Video
              ref={videoRef}
              source={{ uri: post.media_url }}
              style={styles.fullscreenVideo}
              resizeMode="contain"
              shouldPlay={playing}
              isLooping
              onPlaybackStatusUpdate={onPlaybackStatusUpdate}
            />

            <LinearGradient colors={['transparent', 'rgba(0,0,0,0.7)']} style={styles.fullscreenControls}>
              <View style={styles.videoControlsRow}>
                <TouchableOpacity style={styles.controlButton} onPress={() => videoRef.current && videoRef.current.setPositionAsync(0)}>
                  <Ionicons name="play-skip-back" size={28} color="#fff" />
                </TouchableOpacity>

                <TouchableOpacity style={[styles.controlButton, styles.playPauseButton]} onPress={() => setPlaying(!playing)}>
                  <LinearGradient colors={['#ff00ff', '#9900ff']} style={styles.playButtonGradient}>
                    <Ionicons name={playing ? "pause" : "play"} size={32} color="#fff" />
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity style={styles.controlButton} onPress={() => videoRef.current && videoRef.current.setPositionAsync(0)}>
                  <Ionicons name="play-skip-forward" size={28} color="#fff" />
                </TouchableOpacity>
              </View>
            </LinearGradient>

            <TouchableOpacity style={styles.closeButton} onPress={handleFullscreenClose}>
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
          </View>
        </Modal>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: 20, borderRadius: 10, overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 10, justifyContent: 'space-between' },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  headerInfo: { marginLeft: 10 },
  username: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  timestamp: { fontSize: 12, color: '#aaa' },
  optionsButton: { padding: 5 },
  avatarBorder: { width: 50, height: 50, borderRadius: 25, padding: 2 },
  avatar: { width: 46, height: 46, borderRadius: 23 },
  captionContainer: { padding: 10 },
  caption: { color: '#ddd' },
  mediaContainer: { width: '100%', aspectRatio: 1 },
  media: { width: '100%', height: '100%' },
  videoContainer: { width: '100%', height: '100%' },
  loadingContainer: { ...StyleSheet.absoluteFill, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 5, color: '#ff00ff' },
  actions: { flexDirection: 'row', padding: 10, justifyContent: 'space-around' },
  actionButton: { alignItems: 'center' },
  actionText: { marginTop: 2, color: '#e0e0ff', fontSize: 12 },
  likedIconBackground: { borderRadius: 20, padding: 5 },
  likedText: { color: '#ff00ff' },
  videoControls: { position: 'absolute', bottom: 0, width: '100%', padding: 10 },
  progressContainer: { height: 4, backgroundColor: '#333', borderRadius: 2 },
  progressBar: { height: 4, backgroundColor: '#ff00ff', borderRadius: 2 },
  playPauseButton: { position: 'absolute', right: 10, bottom: 10 },
  videoOverlay: { ...StyleSheet.absoluteFill, justifyContent: 'center', alignItems: 'center' },
  playButton: { width: 60, height: 60, borderRadius: 30, overflow: 'hidden' },
  playButtonGradient: { flex: 1, justifyContent: 'center', alignItems: 'center', borderRadius: 30 },
  errorContainer: { ...StyleSheet.absoluteFill, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)' },
  errorText: { color: '#fff', marginTop: 10 },
  errorSubText: { color: '#ccc', fontSize: 12 },
  fullscreenContainer: { flex: 1, backgroundColor: 'black' },
  fullscreenVideo: { flex: 1 },
  fullscreenControls: { position: 'absolute', bottom: 0, width: '100%', padding: 10 },
  videoControlsRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  controlButton: { padding: 10 },
  closeButton: { position: 'absolute', top: 40, right: 20 },
  topProgressContainer: { height: 4, width: '100%', backgroundColor: '#333' },
});

export default PostItem;
