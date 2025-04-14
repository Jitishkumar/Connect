import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Alert, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Sidebar from '../components/Sidebar';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { supabase } from '../config/supabase';
import { useAccounts } from '../context/AccountContext';


// Define AccountSwitcherModal component outside of the main component
const AccountSwitcherModal = ({ visible, onClose, loadUserProfile }) => {
  const { accounts, addAccount } = useAccounts();
  const navigation = useNavigation();
  const [currentUser, setCurrentUser] = useState(null);
  const [refreshedAccounts, setRefreshedAccounts] = useState([]);

  // Get current user and refresh accounts when modal opens
  useEffect(() => {
    if (visible) {
      getCurrentUser();
      refreshAccountData();
    }
  }, [visible]);

  const getCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUser(user.id);
      }
    } catch (error) {
      console.error("Error getting current user:", error);
    }
  };

  // Fetch the latest profile data for all accounts
  const refreshAccountData = async () => {
    try {
      const uniqueIds = {};
      
      // Get the most recent account for each ID
      accounts.forEach(account => {
        uniqueIds[account.id] = account;
      });
      
      // Convert to array
      const uniqueAccounts = Object.values(uniqueIds);
      
      // Refresh each account's data
      const refreshed = await Promise.all(
        uniqueAccounts.map(async (account) => {
          try {
            const { data, error } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', account.id)
              .single();
  
            if (error) throw error;
  
            if (data) {
              // Update the account in context
              const updatedAccount = {
                ...account,
                username: data.username,
                avatar_url: data.avatar_url
              };
              
              // Update in context
              addAccount(updatedAccount);
              
              return updatedAccount;
            }
            return account;
          } catch (e) {
            console.error("Error refreshing account:", e);
            return account;
          }
        })
      );
      
      setRefreshedAccounts(refreshed);
    } catch (error) {
      console.error("Error refreshing accounts:", error);
    }
  };

  // Use refreshed accounts if available, otherwise use the filtered accounts from context
  const displayAccounts = refreshedAccounts.length > 0 ? refreshedAccounts : 
    Object.values(accounts.reduce((acc, account) => {
      acc[account.id] = account;
      return acc;
    }, {}));

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Switch Account</Text>
          
          {displayAccounts.map((account, index) => (
            <TouchableOpacity 
              key={index}
              style={[
                styles.accountItem, 
                currentUser === account.id && styles.currentAccountItem
              ]}
              onPress={async () => {  // Make sure this is an async function
                try {
                  // Only switch if it's not the current account
                  if (currentUser !== account.id) {
                    onClose(); // Close modal first
                    
                    // Try to sign in with the stored credentials
                    const { data, error } = await supabase.auth.signInWithPassword({
                      email: account.email,
                      password: account.stored_password || '' // This will likely fail without password
                    });
                    
                    if (error) {
                      // If direct sign-in fails, try session refresh if available
                      if (account.session_token) {
                        const { data: sessionData, error: sessionError } = await supabase.auth.refreshSession({
                          refresh_token: account.session_token
                        });
                        
                        if (sessionError) {
                          // If session refresh fails, navigate to login
                          Alert.alert(
                            "Session Expired", 
                            "Please log in again to access this account.",
                            [
                              { 
                                text: "OK", 
                                onPress: () => navigation.navigate('Login', { email: account.email })
                              }
                            ]
                          );
                          return;
                        }
                        
                        // If session refresh worked, force reload the profile
                        await loadUserProfile();
                        
                        // Navigate to Main to refresh the UI
                        // In the AccountSwitcherModal component, update both navigation reset calls
                        
                        // Around line 130-140, change this:
                        navigation.reset({
                          index: 0,
                          routes: [{ name: 'Main' }],
                        });
                        
                        // To this:
                        navigation.reset({
                          index: 0,
                          routes: [{ name: 'MainApp' }],
                        });
                        return;
                      } else {
                        // No session token, navigate to login
                        Alert.alert(
                          "Login Required", 
                          "Please log in to access this account.",
                          [
                            { 
                              text: "OK", 
                              onPress: () => navigation.navigate('Login', { email: account.email })
                            }
                          ]
                        );
                        return;
                      }
                    }
                    
                    // If direct sign-in worked, force reload the profile
                    await loadUserProfile();
                    
                    // Navigate to Main to refresh the UI
                    // In the AccountSwitcherModal component, update both navigation reset calls
                    
                    // Change this:
                    navigation.reset({
                      index: 0,
                      routes: [{ name: 'Main' }],
                    });
                    
                    // To this:
                    navigation.reset({
                      index: 0,
                      routes: [{ name: 'MainApp' }],
                    });
                    
                    // Second instance around line 156
                    // Change this:
                    navigation.reset({
                      index: 0,
                      routes: [{ name: 'Main' }],
                    });
                    
                    // To this:
                    navigation.reset({
                      index: 0,
                      routes: [{ name: 'Profile' }],
                    });
                  } else {
                    // Just close the modal if it's the current account
                    onClose();
                  }
                } catch (error) {
                  console.error("Error switching account:", error);
                  Alert.alert("Error", "Failed to switch account. Please try logging in manually.");
                  onClose();
                }
              }}
            >
              <Image 
                source={{ uri: account.avatar_url || 'https://via.placeholder.com/150' }}
                style={styles.accountAvatar}
              />
              <Text style={styles.accountUsername}>{account.username}</Text>
              {currentUser === account.id && (
                <View style={styles.currentAccountBadge}>
                  <Ionicons name="checkmark-circle" size={20} color="#ff00ff" />
                </View>
              )}
            </TouchableOpacity>
          ))}

          <TouchableOpacity 
            style={styles.addAccountButton}
            onPress={() => {
              onClose();
              navigation.navigate('Login');
            }}
          >
            <Ionicons name="add-circle-outline" size={24} color="#ff00ff" />
            <Text style={styles.addAccountText}>Add Account</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.closeButton}
            onPress={onClose}
          >
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// Main ProfileScreen component
const ProfileScreen = () => {
  const { accounts, addAccount } = useAccounts();
  const [isSidebarVisible, setSidebarVisible] = useState(false);
  const [isAccountSwitcherVisible, setAccountSwitcherVisible] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [showFullBio, setShowFullBio] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  // Add new state for followers/following modal
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [loadingConnections, setLoadingConnections] = useState(false);
  const navigation = useNavigation();

  // Remove the navigation reset from useFocusEffect
// Remove the duplicate code block (the one that starts with "if (currentUser !== account.id)")
  // Keep only the implementation inside the AccountSwitcherModal's onPress handler

  // In the ProfileScreen component, remove the entire standalone code block
  useFocusEffect(
    React.useCallback(() => {
      const loadProfile = async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data, error } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', user.id)
              .single();
      
            if (data) {
              console.log('Raw Profile Data:', data);
              setUserProfile(data);
            }
          }
        } catch (error) {
          console.error('Error loading profile:', error);
        }
      };
      
      loadProfile();
      fetchFollowersCount();
      fetchFollowingCount();
    }, [])
  );

  // Remove everything between useFocusEffect and loadUserProfile
  // Delete the entire standalone block that starts with:
  // if (currentUser !== account.id) {
  // and ends with:
  // } catch (error) {
  // ...
  // });

  const loadUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // First get the old profile data to compare
      const { data: oldData } = await supabase
        .from('profiles')
        .select('avatar_url, cover_url')
        .eq('id', user.id)
        .single();

      const { data: newData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error loading user profile:', error);
        setUserProfile(null);
      } else {
        // Remove old files if they're different from new ones
        if (oldData?.avatar_url && oldData.avatar_url !== newData.avatar_url) {
          const oldAvatarPath = oldData.avatar_url.includes('/media/') 
            ? oldData.avatar_url.split('/media/')[1] 
            : oldData.avatar_url;
            
          console.log('Attempting to remove old avatar:', oldAvatarPath);
          const { error: removeError } = await supabase.storage
            .from('media')
            .remove([oldAvatarPath]);
            
          if (removeError) {
            console.log('Error removing old avatar:', removeError.message);
          } else {
            console.log('Successfully removed old avatar');
          }
        }

        if (oldData?.cover_url && oldData.cover_url !== newData.cover_url) {
          const oldCoverPath = oldData.cover_url.includes('/media/') 
            ? oldData.cover_url.split('/media/')[1] 
            : oldData.cover_url;
            
          console.log('Attempting to remove old cover:', oldCoverPath);
          const { error: removeError } = await supabase.storage
            .from('media')
            .remove([oldCoverPath]);
            
          if (removeError) {
            console.log('Error removing old cover:', removeError.message);
          } else {
            console.log('Successfully removed old cover');
          }
        }

        // Get direct URLs from Supabase storage
        const avatarUrl = newData.avatar_url ? 
          supabase.storage.from('media').getPublicUrl(newData.avatar_url).data.publicUrl : 
          null;
        
        const coverUrl = newData.cover_url ? 
          supabase.storage.from('media').getPublicUrl(newData.cover_url).data.publicUrl : 
          null;

        setUserProfile({
          ...newData,
          avatar_url: avatarUrl,
          cover_url: coverUrl
        });
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      setUserProfile(null);
    }
  };

  const fetchFollowersCount = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { count, error } = await supabase
        .from('follows')
        .select('*', { count: 'exact' })
        .eq('following_id', user.id);

      if (error) {
        console.error('Error fetching followers count:', error);
      } else {
        setFollowersCount(count);
      }
    } catch (error) {
      console.error('Error fetching followers count:', error);
    }
  };

  const fetchFollowingCount = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { count, error } = await supabase
        .from('follows')
        .select('*', { count: 'exact' })
        .eq('follower_id', user.id);

      if (error) {
        console.error('Error fetching following count:', error);
      } else {
        setFollowingCount(count);
      }
    } catch (error) {
      console.error('Error fetching following count:', error);
    }
  };

  const renderBio = () => {
    if (!userProfile?.bio) return null;
    
    const shouldTruncate = userProfile.bio.length > 50 && !showFullBio;
    const displayBio = shouldTruncate 
      ? userProfile.bio.substring(0, 50) + '...' 
      : userProfile.bio;

    return (
      <View style={styles.bioContainer}>
        <Text style={styles.bioText}>
          {displayBio}
          {shouldTruncate && (
            <Text 
              style={styles.moreText}
              onPress={() => setShowFullBio(true)}
            > more</Text>
          )}
        </Text>
      </View>
    );
  };

  // Add new functions to fetch followers and following details
  const fetchFollowers = async () => {
    try {
      setLoadingConnections(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get all followers
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

      // Process the data to get clean user objects
      const followersList = data.map(item => {
        const profile = item.profiles;
        // Fix avatar URL if needed
        let avatarUrl = null;
        if (profile.avatar_url) {
          let avatarPath = profile.avatar_url;
          if (avatarPath.includes('media/media/') || avatarPath.includes('storage/v1/object/public/media/')) {
            const match = avatarPath.match(/([a-f0-9-]+\/avatar_[0-9]+\.jpg)/);
            if (match && match[1]) {
              avatarPath = match[1];
            } else {
              avatarPath = avatarPath.split('media/').pop();
            }
          }
          avatarUrl = `https://lckhaysswueoyinhfzyz.supabase.co/storage/v1/object/public/media/${avatarPath}`;
        }
        
        return {
          ...profile,
          avatar_url: avatarUrl
        };
      });

      setFollowers(followersList);
      setShowFollowersModal(true);
    } catch (error) {
      console.error('Error fetching followers:', error);
    } finally {
      setLoadingConnections(false);
    }
  };

  const fetchFollowing = async () => {
    try {
      setLoadingConnections(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get all following
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

      // Process the data to get clean user objects
      const followingList = data.map(item => {
        const profile = item.profiles;
        // Fix avatar URL if needed
        let avatarUrl = null;
        if (profile.avatar_url) {
          let avatarPath = profile.avatar_url;
          if (avatarPath.includes('media/media/') || avatarPath.includes('storage/v1/object/public/media/')) {
            const match = avatarPath.match(/([a-f0-9-]+\/avatar_[0-9]+\.jpg)/);
            if (match && match[1]) {
              avatarPath = match[1];
            } else {
              avatarPath = avatarPath.split('media/').pop();
            }
          }
          avatarUrl = `https://lckhaysswueoyinhfzyz.supabase.co/storage/v1/object/public/media/${avatarPath}`;
        }
        
        return {
          ...profile,
          avatar_url: avatarUrl
        };
      });

      setFollowing(followingList);
      setShowFollowingModal(true);
    } catch (error) {
      console.error('Error fetching following:', error);
    } finally {
      setLoadingConnections(false);
    }
  };

  // Add ConnectionsModal component
  const ConnectionsModal = ({ visible, onClose, title, connections, isLoading }) => {
    return (
      <Modal
        visible={visible}
        transparent={true}
        animationType="slide"
        onRequestClose={onClose}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{title}</Text>
            
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#ff00ff" />
              </View>
            ) : connections.length > 0 ? (
              <ScrollView style={styles.connectionsList}>
                {connections.map((connection, index) => (
                  <TouchableOpacity 
                    key={index}
                    style={styles.connectionItem}
                    onPress={() => {
                      onClose();
                      navigation.navigate('UserProfile', { userId: connection.id });
                    }}
                  >
                    <Image 
                      source={{ uri: connection.avatar_url || 'https://via.placeholder.com/150' }}
                      style={styles.connectionAvatar}
                    />
                    <View style={styles.connectionInfo}>
                      <Text style={styles.connectionName}>{connection.full_name || 'No name'}</Text>
                      <Text style={styles.connectionUsername}>@{connection.username || 'username'}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="people-outline" size={50} color="#666" />
                <Text style={styles.emptyText}>No {title.toLowerCase()} yet</Text>
              </View>
            )}

            <TouchableOpacity 
              style={styles.closeButton}
              onPress={onClose}
            >
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      <Sidebar 
        isVisible={isSidebarVisible} 
        onClose={() => setSidebarVisible(false)}
      />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setSidebarVisible(true)}>
          <Ionicons name="menu" size={24} color="#ff00ff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setAccountSwitcherVisible(true)}>
          <Ionicons name="add-circle-outline" size={24} color="#ff00ff" />
        </TouchableOpacity>
      </View>

      <AccountSwitcherModal 
        visible={isAccountSwitcherVisible}
        onClose={() => setAccountSwitcherVisible(false)}
        loadUserProfile={loadUserProfile}
      />
      
      {/* Add the new modals */}
      <ConnectionsModal
        visible={showFollowersModal}
        onClose={() => setShowFollowersModal(false)}
        title="Followers"
        connections={followers}
        isLoading={loadingConnections}
      />
      
      <ConnectionsModal
        visible={showFollowingModal}
        onClose={() => setShowFollowingModal(false)}
        title="Following"
        connections={following}
        isLoading={loadingConnections}
      />
      
      <ScrollView>
        <View style={styles.profileSection}>
          {/* Cover Photo */}
          <View style={styles.coverPhotoContainer}>
            <Image
              style={styles.coverPhoto}
              source={userProfile?.cover_url 
                ? { 
                    uri: userProfile.cover_url,
                    cache: 'reload'
                  } 
                : require('../../assets/default-cover.png')
              }
              onLoadStart={() => console.log('Cover photo loading started')}
              onLoadEnd={() => console.log('Cover photo loading ended')}
              onError={(e) => console.log('Cover photo error:', e.nativeEvent.error)}
            />
          </View>
          
          <Image
            style={styles.profileImage}
            source={userProfile?.avatar_url 
              ? { 
                  uri: userProfile.avatar_url,
                  cache: 'reload'
                } 
              : require('../../assets/default-avatar.png')
            }
            onLoadStart={() => console.log('Avatar loading started')}
            onLoadEnd={() => console.log('Avatar loading ended')}
            onError={(e) => console.log('Avatar error:', e.nativeEvent.error)}
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
          {renderBio()}
          
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Text style={styles.editButtonText}>EDIT PROFILE</Text>
          </TouchableOpacity>

          <View style={styles.statsContainer}>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>100</Text>
              <Text style={styles.statLabel}>Post</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>20</Text>
              <Text style={styles.statLabel}>Shorts</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{followersCount}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{followingCount}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </View>
          </View>
        </View>

        {/* Rest of the profile content */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity style={styles.tabButton}>
            <Text style={styles.tabButtonText}>Post</Text>
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
            <Ionicons name="briefcase-outline" size={24} color="#e3a6be" />
            <View style={styles.detailContent}>
              <Text style={styles.detailTitle}>Work Experience</Text>
              <Text style={styles.detailText}>Google UX/UI Designer</Text>
            </View>
          </View>

          <View style={styles.detailItem}>
            <Ionicons name="trophy-outline" size={24} color="#FFD700" />
            <View style={styles.detailContent}>
              <Text style={styles.detailTitle}>Member Rank</Text>
              <Text style={styles.detailText}>
                {userProfile?.rank 
                  ? `You are member #${userProfile.rank} on Flexx`
                  : 'Rank not assigned yet'}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

// Add these styles to your StyleSheet
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
  profileSection: {
    alignItems: 'center',
    padding: 20,
    paddingTop: 0, // Remove top padding to accommodate cover photo
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#e3a6be',
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
  bio: {
    fontSize: 14,
    color: '#faf7f8',
    marginTop: 5,
  },
  editButton: {
    backgroundColor: 'pink',
    paddingHorizontal: 30,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 15,
  },
  editButtonText: {
    color: 'white',
    fontWeight: '600',
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
    justifyContent: 'space-around', // Changed from paddingHorizontal
    paddingHorizontal: 40, // Added padding to keep tabs from edges
    marginTop: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  tabButton: {
    marginRight: 30,
    paddingBottom: 10,
    flex: 1,  // Added to make buttons take equal space
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
  
  bottomNav: null,
  navItem: null,
  navProfilePic: null,
  coverPhotoContainer: {
    width: '100%',
    height: 200,
    marginBottom: -50,
    borderRadius: 15,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a', // Add background color
  },
  coverPhoto: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    backgroundColor: '#1a1a1a', // Add this line
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#e3a6be',
    backgroundColor: '#1a1a1a', // Add background color
    marginTop: 10, // Add margin to separate from cover photo
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
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    marginVertical: 5,
  },
  accountAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
    borderWidth: 2,
    borderColor: '#ff00ff',
  },
  accountUsername: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '500',
  },
  addAccountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    marginTop: 20,
    backgroundColor: '#330033',
    borderRadius: 10,
  },
  addAccountText: {
    color: '#ff00ff',
    fontSize: 18,
    marginLeft: 15,
    fontWeight: '500',
  },
  closeButton: {
    alignItems: 'center',
    padding: 15,
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  closeText: {
    color: '#999',
    fontSize: 16,
    fontWeight: '500',
  },
  // Add to your existing styles
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