import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../config/supabase';
import * as ImagePicker from 'expo-image-picker';

const EditProfileScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [coverImage, setCoverImage] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUserProfile();
  }, []);

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
          setName(data.full_name || '');
          setUsername(data.username || '');
          setBio(data.bio || '');
          setProfileImage(data.avatar_url);
          setCoverImage(data.cover_url);
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const pickImage = async (type) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: type === 'profile' ? [1, 1] : [16, 9],
      quality: 0.8,
    });

    if (!result.canceled) {
      if (type === 'profile') {
        setProfileImage(result.assets[0].uri);
      } else {
        setCoverImage(result.assets[0].uri);
      }
    }
  };

  const handleSave = async () => {
    if (!name || !username) {
      Alert.alert('Error', 'Name and username are required');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Upload images if changed
      let avatar_url = profileImage;
      let cover_url = coverImage;

      if (profileImage && profileImage.startsWith('file')) {
        const { data, error } = await uploadImage(profileImage, 'avatars');
        if (data) avatar_url = data.publicUrl;
      }

      if (coverImage && coverImage.startsWith('file')) {
        const { data, error } = await uploadImage(coverImage, 'covers');
        if (data) cover_url = data.publicUrl;
      }

      // Update profile
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: name,
          username,
          bio,
          avatar_url,
          cover_url,
          updated_at: new Date(),
        });

      if (error) throw error;
      
      Alert.alert('Success', 'Profile updated successfully');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const uploadImage = async (uri, folder) => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const filename = `${folder}/${Date.now()}.jpg`;
      
      const { data, error } = await supabase.storage
        .from('user-content')
        .upload(filename, blob);

      if (error) throw error;
      
      const { data: { publicUrl } } = supabase.storage
        .from('user-content')
        .getPublicUrl(filename);

      return { publicUrl };
    } catch (error) {
      console.error('Error uploading image:', error);
      return { error };
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#ff00ff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity onPress={handleSave} disabled={loading}>
          <Text style={[styles.saveButton, loading && styles.saveButtonDisabled]}>
            {loading ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={() => pickImage('cover')} style={styles.coverPhotoContainer}>
        <Image
          source={coverImage ? { uri: coverImage } : require('../assets/default-cover.jpg')}
          style={styles.coverPhoto}
        />
        <View style={styles.editCoverButton}>
          <Ionicons name="camera" size={24} color="white" />
        </View>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => pickImage('profile')} style={styles.profileImageContainer}>
        <Image
          source={profileImage ? { uri: profileImage } : require('../assets/default-avatar.jpg')}
          style={styles.profileImage}
        />
        <View style={styles.editProfileButton}>
          <Ionicons name="camera" size={20} color="white" />
        </View>
      </TouchableOpacity>

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Enter your name"
            placeholderTextColor="#666"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Username</Text>
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            placeholder="Enter username"
            placeholderTextColor="#666"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Bio</Text>
          <TextInput
            style={[styles.input, styles.bioInput]}
            value={bio}
            onChangeText={setBio}
            placeholder="Write something about yourself"
            placeholderTextColor="#666"
            multiline
            numberOfLines={4}
          />
        </View>
      </View>
    </ScrollView>
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
  },
  headerTitle: {
    color: '#ff00ff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  saveButton: {
    color: '#ff00ff',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  coverPhotoContainer: {
    width: '100%',
    height: 200,
    position: 'relative',
  },
  coverPhoto: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  editCoverButton: {
    position: 'absolute',
    right: 15,
    bottom: 15,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
    borderRadius: 20,
  },
  profileImageContainer: {
    alignSelf: 'center',
    marginTop: -50,
    position: 'relative',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#000',
  },
  editProfileButton: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: '#ff00ff',
    padding: 8,
    borderRadius: 15,
  },
  form: {
    padding: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    color: '#ff00ff',
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    padding: 12,
    color: 'white',
    fontSize: 16,
  },
  bioInput: {
    height: 100,
    textAlignVertical: 'top',
  },
});

export default EditProfileScreen;