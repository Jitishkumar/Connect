
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  FlatList, 
  Image, 
  Modal,
  ScrollView,
  Switch,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { WebView } from 'react-native-webview';
import { supabase } from '../config/supabase';
import * as Location from 'expo-location';

const ConfessionScreen = () => {
  const navigation = useNavigation();
  const [mode, setMode] = useState('select'); // 'select', 'write', or 'view'
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const [confessions, setConfessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showNewConfessionModal, setShowNewConfessionModal] = useState(false);
  const [newConfession, setNewConfession] = useState('');
  const [media, setMedia] = useState([]);
  const [remainAnonymous, setRemainAnonymous] = useState(true);
  const [mapRegion, setMapRegion] = useState({
    latitude: 37.78825,
    longitude: -122.4324,
  });
  const [userLocation, setUserLocation] = useState(null);
  const [locationPermission, setLocationPermission] = useState(null);
  const [searchError, setSearchError] = useState(null);

  // Request location permission and get current location
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status);
      
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        setUserLocation(location);
        setMapRegion({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      }
    })();
  }, []);

  const getMapUrl = () => {
    const lat = mapRegion.latitude;
    const lon = mapRegion.longitude;
    let url = `https://www.openstreetmap.org/export/embed.html?bbox=${lon-0.05},${lat-0.05},${lon+0.05},${lat+0.05}&layer=mapnik`;
    
    if (selectedLocation) {
      url += `&marker=${selectedLocation.lat},${selectedLocation.lon}`;
    }
    if (userLocation) {
      url += `&marker=${userLocation.coords.latitude},${userLocation.coords.longitude}`;
    }
    return url;
  };

  const searchLocations = async (query) => {
    if (query.length < 3) return;
    
    setSearchError(null);
    try {
      let searchUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=10`;
      
      if (userLocation) {
        searchUrl += `&viewbox=${userLocation.coords.longitude-0.1},${userLocation.coords.latitude-0.1},${userLocation.coords.longitude+0.1},${userLocation.coords.latitude+0.1}`;
      }
      
      const response = await fetch(searchUrl, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'FlexxApp/1.0'
        }
      });
      
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error('Error searching locations:', error);
      setSearchError(error.message);
      setSearchResults([]);
      
      if (__DEV__) {
        setSearchResults([
          {
            place_id: '1',
            display_name: 'New York, USA',
            lat: '40.7128',
            lon: '-74.0060'
          },
          {
            place_id: '2',
            display_name: 'London, UK',
            lat: '51.5074',
            lon: '-0.1278'
          }
        ]);
      }
    }
  };

  const selectLocation = (location) => {
    setSelectedLocation(location);
    setSearchResults([]);
    setMapRegion({
      latitude: parseFloat(location.lat),
      longitude: parseFloat(location.lon),
    });
    loadConfessions(location.place_id);
  };

  // Mode state is already declared at the top of the component
  
  const loadConfessions = async (locationId) => {
    setLoading(true);
    try {
      // First get confessions
      const { data: confessionsData, error: confessionsError } = await supabase
        .from('confessions')
        .select('*')
        .eq('location_id', locationId)
        .order('created_at', { ascending: false });
        
      if (confessionsError) throw confessionsError;
      
      // For non-anonymous confessions, fetch user profiles
      const confessionsWithProfiles = await Promise.all(
        (confessionsData || []).map(async (confession) => {
          if (!confession.is_anonymous && confession.user_id) {
            // Fetch user profile
            const { data: profileData } = await supabase
              .from('profiles')
              .select('username, full_name, avatar_url')
              .eq('id', confession.user_id)
              .single();
              
            if (profileData) {
              return {
                ...confession,
                username: profileData.username || profileData.full_name,
                avatar_url: profileData.avatar_url
              };
            }
          }
          return confession;
        })
      );
      
      setConfessions(confessionsWithProfiles || []);
    } catch (error) {
      console.error('Error loading confessions:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Update pickImage function to use new MediaType
  const pickImage = async () => {
  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      const fileType = asset.type === 'video' ? 'video/mp4' : 'image/jpeg';
      
      setMedia([...media, { 
        uri: asset.uri,
        type: fileType,
        name: `${Math.random().toString(36).substring(2)}.${fileType === 'video/mp4' ? 'mp4' : 'jpg'}`
      }]);
    }
  } catch (error) {
    console.error('Error picking media:', error);
    alert('Failed to select media. Please try again.');
  }
};
  
  // Update postConfession function's media upload
  const postConfession = async () => {
  if (!newConfession.trim() && media.length === 0) return;
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert('You must be logged in to post a confession');
      return;
    }
    
    const mediaUrls = [];
    for (const item of media) {
      if (item.uri) {
        try {
          const response = await fetch(item.uri);
          const blob = await response.blob();
          const filePath = `confessions/${item.name}`;
          
          const { error: uploadError } = await supabase.storage
            .from('media')
            .upload(filePath, blob, {
              contentType: item.type,
              cacheControl: '3600'
            });
            
          if (uploadError) throw uploadError;
          
          const { data: { publicUrl } } = supabase.storage
            .from('media')
            .getPublicUrl(filePath);
            
          mediaUrls.push({
            url: publicUrl,
            type: item.type
          });
        } catch (mediaError) {
          console.error('Media upload error:', mediaError);
          throw new Error('Failed to upload media');
        }
      }
    }
    
    const confessionData = {
      user_id: remainAnonymous ? null : user.id,
      location_id: selectedLocation.place_id,
      location_name: selectedLocation.display_name,
      content: newConfession.trim(),
      media: mediaUrls,
      is_anonymous: remainAnonymous,
      created_at: new Date().toISOString()
    };

    const { error: confessionError } = await supabase
      .from('confessions')
      .insert([confessionData]);
      
    if (confessionError) throw confessionError;
    
    setNewConfession('');
    setMedia([]);
    setShowNewConfessionModal(false);
    loadConfessions(selectedLocation.place_id);
    
  } catch (error) {
    console.error('Error posting confession:', error);
    alert(error.message || 'Failed to post confession. Please try again.');
  }
};

  const goToUserLocation = () => {
    if (userLocation) {
      setMapRegion({
        latitude: userLocation.coords.latitude,
        longitude: userLocation.coords.longitude,
      });
    }
  };

  const renderConfessionItem = ({ item }) => {
    // Format the date
    const formattedDate = item.created_at 
      ? new Date(item.created_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        }) + ' at ' + new Date(item.created_at).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit'
        })
      : '';
      
    return (
      <View style={styles.confessionCard}>
        <View style={styles.confessionHeader}>
          <Image 
            source={{ uri: item.is_anonymous 
              ? 'https://via.placeholder.com/40' 
              : (item.avatar_url || 'https://via.placeholder.com/40') 
            }}
            style={styles.avatar}
          />
          <View style={styles.userInfoContainer}>
            <Text style={[
              styles.username,
              !item.is_anonymous && { color: '#ff00ff' }
            ]}>
              {item.is_anonymous ? 'Anonymous' : (item.username || 'User')}
            </Text>
            <Text style={styles.dateText}>{formattedDate}</Text>
          </View>
        </View>
        
        <Text style={styles.confessionContent}>{item.content}</Text>
        
        {item.media && item.media.length > 0 && (
          <ScrollView horizontal style={styles.mediaContainer}>
            {item.media.map((mediaItem, index) => (
              mediaItem.type === 'image' ? (
                <Image 
                  key={index}
                  source={{ uri: mediaItem.url }}
                  style={styles.mediaItem}
                />
              ) : (
                <View key={index} style={styles.videoContainer}>
                  <Ionicons name="play-circle" size={40} color="#fff" />
                </View>
              )
            ))}
          </ScrollView>
        )}
        
        <View style={styles.actionBar}>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="heart-outline" size={24} color="#ff00ff" />
            <Text style={styles.actionText}>{item.likes_count || 0}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="chatbubble-outline" size={22} color="#ff00ff" />
            <Text style={styles.actionText}>{item.comments_count || 0}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="share-social-outline" size={24} color="#ff00ff" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Add mode selection component
  const renderModeSelection = () => (
    <View style={styles.modeContainer}>
      <TouchableOpacity 
        style={[styles.modeButton, mode === 'write' && styles.modeButtonActive]}
        onPress={() => setMode('write')}
      >
        <Ionicons name="create" size={24} color={mode === 'write' ? '#fff' : '#ff00ff'} />
        <Text style={[styles.modeButtonText, mode === 'write' && styles.modeButtonTextActive]}>Write Confession</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.modeButton, mode === 'view' && styles.modeButtonActive]}
        onPress={() => setMode('view')}
      >
        <Ionicons name="eye" size={24} color={mode === 'view' ? '#fff' : '#ff00ff'} />
        <Text style={[styles.modeButtonText, mode === 'view' && styles.modeButtonTextActive]}>View Confessions</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#ff00ff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Confessions</Text>
      </View>

      {mode === 'select' ? (
        renderModeSelection()
      ) : (
        <>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search for a place, institution, company..."
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                if (text.length >= 3) {
                  searchLocations(text);
                }
              }}
            />
            <TouchableOpacity 
              style={styles.mapButton}
              onPress={() => setShowMap(!showMap)}
            >
              <Ionicons name="map" size={24} color="#ff00ff" />
            </TouchableOpacity>
          </View>
          {searchError && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>
                {searchError.includes('Network request failed') 
                  ? 'Network error. Check your connection.' 
                  : 'Error searching locations. Try again.'}
              </Text>
            </View>
          )}
          
          {searchResults.length > 0 && (
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.place_id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.searchResultItem}
                  onPress={() => selectLocation(item)}
                >
                  <Ionicons name="location" size={20} color="#ff00ff" />
                  <Text style={styles.searchResultText}>{item.display_name}</Text>
                </TouchableOpacity>
              )}
              style={styles.searchResultsList}
            />
          )}
          
          {showMap && (
            <View style={styles.mapContainer}>
              <WebView
                style={styles.map}
                source={{ uri: getMapUrl() }}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                onError={(e) => console.error('WebView error:', e.nativeEvent)}
                renderLoading={() => (
                  <View style={[styles.loadingContainer, StyleSheet.absoluteFill]}>
                    <ActivityIndicator size="large" color="#ff00ff" />
                  </View>
                )}
                startInLoadingState={true}
              />
              <View style={styles.mapControls}>
                <TouchableOpacity 
                  style={styles.closeMapButton}
                  onPress={() => setShowMap(false)}
                >
                  <Ionicons name="close-circle" size={30} color="#ff00ff" />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.locationButton}
                  onPress={goToUserLocation}
                >
                  <Ionicons name="locate" size={24} color="#ff00ff" />
                </TouchableOpacity>
              </View>
            </View>
          )}
          
          {selectedLocation && (
            <View style={styles.locationHeader}>
              <Text style={styles.locationName}>{selectedLocation.display_name}</Text>
            </View>
          )}
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#ff00ff" />
            </View>
          ) : selectedLocation ? (
            confessions.length > 0 ? (
              <FlatList
                data={confessions}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderConfessionItem}
                contentContainerStyle={styles.confessionsList}
              />
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="chatbubbles-outline" size={60} color="#ff00ff" />
                <Text style={styles.emptyText}>No confessions yet. Be the first to share!</Text>
              </View>
            )
          ) : (
            <View style={styles.instructionContainer}>
              <Ionicons name="search" size={60} color="#ff00ff" />
              <Text style={styles.instructionText}>
                Search for a place or select a location on the map to see confessions
              </Text>
            </View>
          )}
          
          {selectedLocation && (
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => setShowNewConfessionModal(true)}
            >
              <Ionicons name="add" size={30} color="#fff" />
            </TouchableOpacity>
          )}
          
          <Modal
            visible={showNewConfessionModal}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowNewConfessionModal(false)}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>New Confession</Text>
                  <TouchableOpacity onPress={() => setShowNewConfessionModal(false)}>
                    <Ionicons name="close" size={24} color="#ff00ff" />
                  </TouchableOpacity>
                </View>
                
                <TextInput
                  style={styles.confessionInput}
                  placeholder="What's your confession about this place?"
                  placeholderTextColor="#999"
                  multiline
                  value={newConfession}
                  onChangeText={setNewConfession}
                />
                
                {media.length > 0 && (
                  <ScrollView horizontal style={styles.selectedMediaContainer}>
                    {media.map((item, index) => (
                      <View key={index} style={styles.selectedMediaItem}>
                        <Image source={{ uri: item.uri }} style={styles.selectedMediaPreview} />
                        <TouchableOpacity 
                          style={styles.removeMediaButton}
                          onPress={() => setMedia(media.filter((_, i) => i !== index))}
                        >
                          <Ionicons name="close-circle" size={20} color="#ff00ff" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </ScrollView>
                )}
                
                <View style={styles.mediaButtons}>
                  <TouchableOpacity style={styles.mediaButton} onPress={pickImage}>
                    <Ionicons name="image" size={24} color="#ff00ff" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.mediaButton} onPress={pickImage}>
                    <Ionicons name="videocam" size={24} color="#ff00ff" />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.anonymousOption}>
                  <Text style={styles.anonymousText}>Remain anonymous</Text>
                  <Switch
                    value={remainAnonymous}
                    onValueChange={setRemainAnonymous}
                    trackColor={{ false: "#767577", true: "#ff00ff" }}
                    thumbColor={remainAnonymous ? "#f4f3f4" : "#f4f3f4"}
                  />
                </View>
                
                <TouchableOpacity 
                  style={styles.postButton}
                  onPress={postConfession}
                >
                  <Text style={styles.postButtonText}>Post Confession</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  modeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    backgroundColor: '#550033',
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#330022',
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 10,
  },
  modeButtonActive: {
    backgroundColor: '#ff00ff',
  },
  modeButtonText: {
    color: '#ff00ff',
    marginLeft: 10,
    fontSize: 16,
    fontWeight: 'bold',
  },
  modeButtonTextActive: {
    color: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: '#660033',
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
  },
  headerTitle: {
    color: '#ff00ff',
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 15,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#550033',
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#330022',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    color: '#fff',
    marginRight: 10,
  },
  mapButton: {
    backgroundColor: '#330022',
    borderRadius: 20,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchResultsList: {
    backgroundColor: '#330022',
    maxHeight: 200,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#550033',
  },
  searchResultText: {
    color: '#fff',
    marginLeft: 10,
    flex: 1,
  },
  mapContainer: {
    height: 300,
    position: 'relative',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapControls: {
    position: 'absolute',
    top: 10,
    right: 10,
    gap: 10,
  },
  closeMapButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 5,
  },
  locationButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
  },
  locationHeader: {
    padding: 15,
    backgroundColor: '#550033',
  },
  locationName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confessionsList: {
    padding: 10,
  },
  confessionCard: {
    backgroundColor: '#330022',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  confessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
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
  confessionContent: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 10,
  },
  mediaContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  mediaItem: {
    width: 150,
    height: 150,
    borderRadius: 10,
    marginRight: 10,
  },
  videoContainer: {
    width: 150,
    height: 150,
    borderRadius: 10,
    marginRight: 10,
    backgroundColor: '#220011',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#550033',
    paddingTop: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  actionText: {
    color: '#ff00ff',
    marginLeft: 5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    color: '#ff00ff',
    textAlign: 'center',
    marginTop: 10,
    fontSize: 16,
  },
  instructionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  instructionText: {
    color: '#ff00ff',
    textAlign: 'center',
    marginTop: 10,
    fontSize: 16,
  },
  addButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#ff00ff',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#330022',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    minHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    color: '#ff00ff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  confessionInput: {
    backgroundColor: '#220011',
    borderRadius: 10,
    padding: 15,
    color: '#fff',
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 15,
  },
  selectedMediaContainer: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  selectedMediaItem: {
    position: 'relative',
    marginRight: 10,
  },
  selectedMediaPreview: {
    width: 80,
    height: 80,
    borderRadius: 5,
  },
  removeMediaButton: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#330022',
    borderRadius: 10,
  },
  mediaButtons: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  mediaButton: {
    backgroundColor: '#220011',
    borderRadius: 10,
    padding: 10,
    marginRight: 10,
  },
  anonymousOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  anonymousText: {
    color: '#fff',
    fontSize: 16,
  },
  postButton: {
    backgroundColor: '#ff00ff',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
  },
  postButtonText: {
    color: '#550033',
    fontWeight: 'bold',
    fontSize: 16,
  },
  errorContainer: {
    padding: 15,
    backgroundColor: '#550033',
  },
  errorText: {
    color: '#ff0000',
    textAlign: 'center',
  },
});

export default ConfessionScreen;

