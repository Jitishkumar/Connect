


import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, TextInput, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { useNavigation } from '@react-navigation/native'; // Add this import

// Add these new imports at the top
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const HomeScreen = () => {
  const navigation = useNavigation(); // Add this line
  let [fontsLoaded] = useFonts({
    Poppins_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={styles.container}>
      {}
      <LinearGradient
        colors={['#660033', '#660033']}
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
            <TouchableOpacity style={styles.storyItem}>
              <View style={styles.addStoryButton}>
                <Ionicons name="add" size={24} color="#800060" />
              </View>
              <Text style={styles.storyText}>Share Story</Text>
            </TouchableOpacity>
            {['Jone', 'Smith', 'Kriston'].map((name) => (
              <TouchableOpacity key={name} style={styles.storyItem}>
                <Image
                  style={styles.storyAvatar}
                  source={{ uri: 'https://via.placeholder.com/60' }}
                />
                <Text style={styles.storyText}>{name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

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
    backgroundColor: '#660033',
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
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
  storyAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#ff00ff',
  },
  storyText: {
    marginTop: 5,
    fontSize: 12,
    color: '#ff00ff',
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
