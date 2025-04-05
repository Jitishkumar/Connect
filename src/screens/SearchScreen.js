import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Image, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const SearchScreen = () => {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const renderRecentSearches = () => (
    <View style={styles.content}>
      <Text style={styles.sectionTitle}>Recent Searches</Text>
      {['John Doe', 'Jane Smith', 'Mike Johnson'].map((name, index) => (
        <TouchableOpacity key={index} style={styles.searchItem}>
          <Image
            style={styles.avatar}
            source={{ uri: 'https://via.placeholder.com/40' }}
          />
          <View style={styles.searchItemInfo}>
            <Text style={styles.searchItemName}>{name}</Text>
            <Text style={styles.searchItemUsername}>@{name.toLowerCase().replace(' ', '_')}</Text>
          </View>
          <Ionicons name="time-outline" size={20} color="#e3a6d0" />
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderStories = () => (
    <View style={styles.storiesSection}>
      <Text style={styles.sectionTitle}>Stories</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <TouchableOpacity style={styles.storyItem}>
          <View style={styles.addStoryButton}>
            <Ionicons name="add-circle" size={24} color="#ff00ff" />
          </View>
          <Text style={styles.storyText}>Add Story</Text>
        </TouchableOpacity>
        {[1, 2, 3, 4, 5].map((item) => (
          <TouchableOpacity key={item} style={styles.storyItem}>
            <Image
              style={styles.storyImage}
              source={{ uri: `https://picsum.photos/100/100?random=${item}` }}
            />
            <Text style={styles.storyText}>User {item}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderGridSection = (title) => (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.gridWrapper}>
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <TouchableOpacity key={item} style={styles.gridItem}>
            <Image
              style={styles.gridImage}
              source={{ uri: `https://picsum.photos/200/200?random=${item}` }}
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderGridPosts = () => {
    const posts = Array(15).fill(0); // Create 15 sample posts
    return (
      <View style={styles.gridContainer}>
        {posts.map((_, index) => (
          <TouchableOpacity key={index} style={styles.gridPost}>
            <Image
              style={styles.postImage}
              source={{ uri: `https://picsum.photos/300/300?random=${index}` }}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#ff00ff" />
        </TouchableOpacity>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#ff00ff" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search people, posts..."
            placeholderTextColor="#e3a6d0"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#ff00ff" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {isFocused && !searchQuery ? (
        renderRecentSearches()
      ) : (
        <ScrollView style={styles.mainContent}>
          {renderStories()}
          {renderGridSection('Recommended Posts')}
          {renderGridSection('Shorts')}
          {renderGridSection('Trending')}
        </ScrollView>
      )}
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
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 15,
    paddingBottom: 15,
  },
  backButton: {
    padding: 5,
    marginRight: 10,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4d0026',
    borderRadius: 20,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#ff00ff',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
    color: '#ff00ff',
    fontSize: 16,
  },
  content: {
    flex: 1,
    padding: 15,
  },
  sectionTitle: {
    color: '#ff00ff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  searchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#800060',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 15,
  },
  searchItemInfo: {
    flex: 1,
  },
  searchItemName: {
    color: '#ff00ff',
    fontSize: 16,
    fontWeight: '500',
  },
  searchItemUsername: {
    color: '#e3a6d0',
    fontSize: 14,
  },
  storiesSection: {
    marginBottom: 20,
    paddingHorizontal: 15,
  },
  storyItem: {
    alignItems: 'center',
    marginRight: 15,
  },
  storyImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#ff00ff',
  },
  storyText: {
    color: '#ff00ff',
    marginTop: 5,
    fontSize: 12,
  },
  addStoryButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4d0026',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ff00ff',
    borderStyle: 'dashed',
  },
  contentSection: {
    marginBottom: 20,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
  },
  gridPost: {
    width: Dimensions.get('window').width / 3,
    height: Dimensions.get('window').width / 3,
    padding: 1,
  },
  postImage: {
    width: '100%',
    height: '100%',
  },
  storiesSection: {
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: '#ff00ff',
    marginBottom: 2,
  },
  storyItem: {
    marginHorizontal: 8,
    alignItems: 'center',
  },
  storyImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: '#ff00ff',
  },
  addStoryButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#4d0026',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ff00ff',
    borderStyle: 'dashed',
  },
  storyText: {
    color: '#ff00ff',
    fontSize: 12,
    marginTop: 5,
  },
});

export default SearchScreen;