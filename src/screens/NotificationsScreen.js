import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import OneSignal from 'react-native-onesignal';
import { supabase } from '../config/supabase';

const NotificationsScreen = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    initializeOneSignal();
    fetchNotifications();
  }, []);

  const initializeOneSignal = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Initialize OneSignal
      OneSignal.setAppId('YOUR_ONESIGNAL_APP_ID');
      
      // Set external user ID (your Supabase user ID)
      OneSignal.setExternalUserId(user.id);

      // Handle notification opening
      OneSignal.setNotificationOpenedHandler(notification => {
        console.log('Notification opened:', notification);
        // Handle navigation based on notification type
        handleNotificationOpen(notification);
      });

      // Handle notifications received while app is running
      OneSignal.setNotificationWillShowInForegroundHandler(notificationReceivedEvent => {
        const notification = notificationReceivedEvent.getNotification();
        // Update local notifications state
        setNotifications(prev => [formatOneSignalNotification(notification), ...prev]);
      });
    } catch (error) {
      console.error('Error initializing OneSignal:', error);
    }
  };

  const formatOneSignalNotification = (notification) => {
    return {
      id: notification.notificationId,
      type: notification.additionalData?.type || 'default',
      user: notification.additionalData?.senderName || 'Unknown User',
      action: notification.body,
      time: formatTimestamp(new Date(notification.timestamp)),
      avatar: notification.additionalData?.senderAvatar || 'https://via.placeholder.com/40',
      isRead: false,
      reference_id: notification.additionalData?.referenceId
    };
  };

  const fetchNotifications = async () => {
    try {
      // Get notifications history from OneSignal
      const notifications = await OneSignal.getNotifications();
      const formattedNotifications = notifications.map(formatOneSignalNotification);
      setNotifications(formattedNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000); // difference in seconds

    if (diff < 60) return `${diff} sec ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    return `${Math.floor(diff / 86400)} days ago`;
  };

  const handleNotificationPress = async (notification) => {
    try {
      // Mark as read in OneSignal
      await OneSignal.markNotificationAsRead(notification.id);
      
      // Update local state
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notification.id
            ? { ...notif, isRead: true }
            : notif
        )
      );

      // Handle navigation based on notification type
      if (notification.reference_id) {
        // Navigate to specific screen based on notification type
      }
    } catch (error) {
      console.error('Error handling notification:', error);
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchNotifications();
  }, []);

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#1DA1F2" />
      </View>
    );
  }



  const getNotificationIcon = (type) => {
    switch (type) {
      case 'like':
        return 'heart';
      case 'comment':
        return 'chatbubble';
      case 'follow':
        return 'person-add';
      case 'mention':
        return 'at';
      default:
        return 'notifications';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
      </View>

      <ScrollView 
        style={styles.notificationsList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#1DA1F2"
          />
        }
      >
        {notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="notifications-off-outline" size={48} color="#666" />
            <Text style={styles.emptyStateText}>No notifications yet</Text>
          </View>
        ) : (
          notifications.map((notification) => (
            <TouchableOpacity
              key={notification.id}
              style={[
                styles.notificationItem,
                !notification.isRead && styles.unreadNotification,
              ]}
              onPress={() => handleNotificationPress(notification)}
            >
              <Image source={{ uri: notification.avatar }} style={styles.avatar} />
              <View style={styles.notificationContent}>
                <View style={styles.notificationHeader}>
                  <Text style={styles.username}>{notification.user}</Text>
                  <Text style={styles.time}>{notification.time}</Text>
                </View>
                <Text style={styles.actionText}>{notification.action}</Text>
              </View>
              <View style={styles.iconContainer}>
                <Ionicons
                  name={getNotificationIcon(notification.type)}
                  size={20}
                  color="#1DA1F2"
                />
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    color: '#666',
    fontSize: 16,
    marginTop: 10,
  },
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    padding: 15,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  notificationsList: {
    flex: 1,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
    alignItems: 'center',
  },
  unreadNotification: {
    backgroundColor: 'rgba(29, 161, 242, 0.1)',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  notificationContent: {
    flex: 1,
    marginLeft: 15,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  username: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  time: {
    color: '#666',
    fontSize: 12,
  },
  actionText: {
    color: '#999',
    marginTop: 4,
  },
  iconContainer: {
    marginLeft: 10,
    width: 40,
    alignItems: 'center',
  },
});

export default NotificationsScreen;