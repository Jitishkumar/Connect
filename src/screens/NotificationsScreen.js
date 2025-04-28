import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Alert, Modal, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { supabase } from '../config/supabase';
import { useAccounts } from '../context/AccountContext';
import AccountSwitcherModal from '../components/AccountSwitcherModal';

const ProfileScreen = () => {
  const { accounts, addAccount } = useAccounts();
 
  const [isAccountSwitcherVisible, setAccountSwitcherVisible] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [showFullBio, setShowFullBio] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [loadingConnections, setLoadingConnections] = useState(false);
  const navigation = useNavigation();

  const loadUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        if (data) setUserProfile(data);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const fetchFollowersCount = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { count, error } = await supabase
          .from('follows')
          .select('*', { count: 'exact' })
          .eq('following_id', user.id);

        if (error) throw error;
        setFollowersCount(count || 0);
      }
    } catch (error) {
      console.error('Error fetching followers count:', error);
    }
  };

  const fetchFollowingCount = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { count, error } = await supabase
          .from('follows')
          .select('*', { count: 'exact' })
          .eq('follower_id', user.id);

        if (error) throw error;
        setFollowingCount(count || 0);
      }
    } catch (error) {
      console.error('Error fetching following count:', error);
    }
  };

  const fetchFollowers = async () => {
    try {
      setLoadingConnections(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('follows')
        .select(`
          follower_id,
          profiles!follows_follower_id_fkey (
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        .eq('following_id', user.id);

      if (error) {
        console.error('Error fetching followers:', error);
        return;
      }

      const followersList = data.map(item => ({
        ...item.profiles,
        avatar_url: item.profiles.avatar_url
      }));

      setFollowers(followersList);
      setShowFollowersModal(true);
    } catch (error) {
      console.error('Error fetching followers:', error);
      Alert.alert('Error', 'Failed to load followers');
    } finally {
      setLoadingConnections(false);
    }
  };

  const fetchFollowing = async () => {
    try {
      setLoadingConnections(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('follows')
        .select(`
          following_id,
          profiles!follows_following_id_fkey (
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        .eq('follower_id', user.id);

      if (error) {
        console.error('Error fetching following:', error);
        return;
      }

      const followingList = data.map(item => ({
        ...item.profiles,
        avatar_url: item.profiles.avatar_url
      }));

      setFollowing(followingList);
      setShowFollowingModal(true);
    } catch (error) {
      console.error('Error fetching following:', error);
      Alert.alert('Error', 'Failed to load following');
    } finally {
      setLoadingConnections(false);
    }
  };

  const renderBio = () => {
    if (!userProfile?.bio) return null;

    const bioText = userProfile.bio;
    const shouldTruncate = bioText.length > 100;
    const displayText = shouldTruncate && !showFullBio
      ? `${bioText.substring(0, 100)}...`
      : bioText;

    return (
      <View style={styles.bioContainer}>
        <Text style={styles.bioText}>
          {displayText}
          {shouldTruncate && (
            <Text
              style={styles.moreText}
              onPress={() => setShowFullBio(!showFullBio)}
            >
              {showFullBio ? ' Show less' : ' Show more'}
            </Text>
          )}
        </Text>
      </View>
    );
  };

  useEffect(() => {
    loadUserProfile();
    fetchFollowersCount();
    fetchFollowingCount();
  }, []);

  return (
    <View style={styles.container}>
      
      <LinearGradient
        colors={['#0a0a2a', '#1a1a3a']}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={styles.headerIcons}>
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={() => setAccountSwitcherVisible(true)}
            >
              <LinearGradient
                colors={['#ff00ff', '#9900ff']}
                style={styles.iconBackground}
              >
                <Ionicons name="people-outline" size={22} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      <ScrollView>
        <View style={styles.profileSection}>
          {/* Cover Photo */}
          <View style={styles.coverPhotoContainer}>
            <Image
              style={styles.coverPhoto}
              source={userProfile?.cover_url 
                ? { uri: userProfile.cover_url } 
                : require('../../assets/default-cover.png')}
            />
          </View>
          
          <Image
            style={styles.profileImage}
            source={userProfile?.avatar_url 
              ? { uri: userProfile.avatar_url } 
              : require('../../assets/default-avatar.png')}
          />
          <Text style={styles.name}>{userProfile?.full_name || 'No name set'}</Text>
          <Text style={styles.username}>@{userProfile?.username || 'username'}</Text>
          
          <View style={styles.rankBadge}>
            <Ionicons name="trophy-outline" size={16} color="#FFD700" />
            <Text style={styles.rankNumber}>
              {userProfile?.rank 
                ? `Rank #${userProfile.rank} ${userProfile.rank === 1 ? '(First Member!)' : ''}`
                : 'Rank not assigned'}
            </Text>
          </View>

          <TouchableOpacity 
            style={styles.editProfileButton}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <LinearGradient
              colors={['#ff00ff', '#9900ff']}
              style={styles.editProfileGradient}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 0}}
            >
              <Text style={styles.editProfileText}>Edit Profile</Text>
            </LinearGradient>
          </TouchableOpacity>
          
          {renderBio()}

          <View style={styles.statsContainer}>
            <TouchableOpacity style={styles.stat}>
              <Text style={styles.statNumber}>100</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.stat}>
              <Text style={styles.statNumber}>20</Text>
              <Text style={styles.statLabel}>Shorts</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.stat}
              onPress={fetchFollowers}
            >
              <Text style={styles.statNumber}>{followersCount}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.stat}
              onPress={fetchFollowing}
            >
              <Text style={styles.statNumber}>{followingCount}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.tabsContainer}>
          <TouchableOpacity style={styles.tabButton}>
            <Text style={styles.tabButtonText}>Posts</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tabButton}>
            <Text style={styles.tabButtonText}>Shorts</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tabButton, styles.activeTab]}>
            <Text style={[styles.tabButtonText, styles.activeTabText]}>Details</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.detailsSection}>
          <View style={styles.detailItem}>
            <Ionicons name="person-outline" size={24} color="#666" />
            <View style={styles.detailContent}>
              <Text style={styles.detailTitle}>About me</Text>
              <Text style={styles.detailText}>
                {userProfile?.bio || 'No bio added yet'}
              </Text>
            </View>
          </View>

          <View style={styles.detailItem}>
            <Ionicons name="trophy-outline" size={24} color="#FFD700" />
            <View style={styles.detailContent}>
              <Text style={styles.detailTitle}>Member Rank</Text>
              <Text style={styles.detailText}>
                {userProfile?.rank 
                  ? `Member #${userProfile.rank} on Flexx`
                  : 'Rank not assigned yet'}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <AccountSwitcherModal
        visible={isAccountSwitcherVisible}
        onClose={() => setAccountSwitcherVisible(false)}
        loadUserProfile={loadUserProfile}
      />
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
    padding: 18,
    paddingTop: 50,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    marginLeft: 15,
  },
  iconBackground: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileSection: {
    alignItems: 'center',
    padding: 20,
    paddingTop: 0,
  },
  coverPhotoContainer: {
    width: '100%',
    height: 200,
    marginBottom: -50,
    borderRadius: 15,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
  },
  coverPhoto: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    backgroundColor: '#1a1a1a',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#e3a6be',
    backgroundColor: '#1a1a1a',
    marginTop: 10,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 10,
  },
  username: {
    fontSize: 16,
    color: '#faf7f8',
    marginTop: 5,
  },
  bioContainer: {
    marginTop: 10,
    paddingHorizontal: 20,
    width: '100%',
  },
  bioText: {
    color: '#faf7f8',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  moreText: {
    color: '#ff00ff',
    fontWeight: '600',
  },
  rankBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 15,
    marginTop: 5,
  },
  rankNumber: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#1a1a1a',
  },
  stat: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 40,
    marginTop: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  tabButton: {
    marginRight: 30,
    paddingBottom: 10,
    flex: 1,
    alignItems: 'center',
  },
  tabButtonText: {
    color: '#faf7f8',
    fontSize: 16,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#faf7f8',
  },
  activeTabText: {
    color: '#1DA1F2',
  },
  detailsSection: {
    padding: 20,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  detailContent: {
    marginLeft: 15,
    flex: 1,
  },
  detailTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  detailText: {
    color: '#faf7f8',
    fontSize: 14,
  },
  editProfileButton: {
    width: '80%',
    marginTop: 15,
    marginBottom: 10,
    borderRadius: 25,
    overflow: 'hidden',
  },
  editProfileGradient: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editProfileText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingTop: 30,
    minHeight: '40%',
  },
  modalTitle: {
    color: '#ff00ff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 25,
    textAlign: 'center',
  },
  connectionsList: {
    maxHeight: 400,
  },
  connectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  connectionAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
    borderWidth: 1,
    borderColor: '#ff00ff',
  },
  connectionInfo: {
    flex: 1,
  },
  connectionName: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  connectionUsername: {
    color: '#999',
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
    marginTop: 10,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  currentAccountItem: {
    backgroundColor: 'rgba(255, 0, 255, 0.1)',
    borderWidth: 1,
    borderColor: '#ff00ff',
    borderRadius: 10,
  },
  currentAccountBadge: {
    marginLeft: 'auto',
  },
  connectionsList: {
    maxHeight: 400,
  },
  connectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  connectionAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
    borderWidth: 1,
    borderColor: '#ff00ff',
  },
  connectionInfo: {
    flex: 1,
  },
  connectionName: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  connectionUsername: {
    color: '#999',
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
    marginTop: 10,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  }
});
export default ProfileScreen;

const renderBio = () => {
  if (!userProfile?.bio) return null;

  const bioText = userProfile.bio;
  const shouldTruncate = bioText.length > 100;
  const displayText = shouldTruncate && !showFullBio
    ? `${bioText.substring(0, 100)}...`
    : bioText;

  return (
    <View style={styles.bioContainer}>
      <Text style={styles.bioText}>
        {displayText}
        {shouldTruncate && (
          <Text
            style={styles.moreText}
            onPress={() => setShowFullBio(!showFullBio)}
          >
            {showFullBio ? ' Show less' : ' Show more'}
          </Text>
        )}
      </Text>
    </View>
  );
};