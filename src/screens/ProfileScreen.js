import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Sidebar from '../components/Sidebar';
import AccountSwitcher from '../components/AccountSwitcher';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../config/supabase';

// Add useEffect to fetch profile data
const ProfileScreen = () => {
  const [isSidebarVisible, setSidebarVisible] = useState(false);
  const [isAccountSwitcherVisible, setAccountSwitcherVisible] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [showFullBio, setShowFullBio] = useState(false);
  const navigation = useNavigation();

  // Add this function to handle bio display
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

  // Replace the existing useEffect with useFocusEffect
  useFocusEffect(
    React.useCallback(() => {
      loadUserProfile();
    }, [])
  );

  const loadUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (data) {
          setUserProfile(data);
          setShowFullBio(false); // Reset bio expansion state
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
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
          <Ionicons name="settings-outline" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <AccountSwitcher 
        isVisible={isAccountSwitcherVisible}
        onClose={() => setAccountSwitcherVisible(false)}
      />
//cover photo section
      {}
      <ScrollView>
        {/* Update the profile section to use userProfile data */}
        <View style={styles.profileSection}>
          <View style={styles.coverPhotoContainer}>
            <Image
              style={styles.coverPhoto}
              source={{ uri: 'https://via.placeholder.com/800x300' }}
            />
          </View>
          <Image
            style={styles.profileImage}
            source={{ uri: 'https://via.placeholder.com/150' }}
          />
          <Text style={styles.name}>{userProfile?.full_name || 'No name set'}</Text>
          <Text style={styles.username}>@{userProfile?.username || 'username'}</Text>
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
              <Text style={styles.statNumber}>10k</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>64</Text>
              <Text style={styles.statLabel}>Following</Text>
            </View>
          </View>
        </View>

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
        </View>
      </ScrollView>
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
    padding: 16,
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
    marginBottom: -50, // Overlap with profile picture
    borderRadius: 15,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#1DA1F2',
  },
  coverPhoto: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
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
});

export default ProfileScreen;