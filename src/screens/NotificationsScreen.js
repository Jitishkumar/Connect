import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const NotificationsScreen = () => {
  const notifications = [
    {
      id: 1,
      type: 'like',
      user: 'Sarah Parker',
      action: 'liked your post',
      time: '2 min ago',
      avatar: 'https://via.placeholder.com/40',
      isRead: false,
    },
    {
      id: 2,
      type: 'comment',
      user: 'John Smith',
      action: 'commented on your post',
      time: '15 min ago',
      avatar: 'https://via.placeholder.com/40',
      isRead: false,
    },
    {
      id: 3,
      type: 'follow',
      user: 'Emma Wilson',
      action: 'started following you',
      time: '1 hour ago',
      avatar: 'https://via.placeholder.com/40',
      isRead: true,
    },
    {
      id: 4,
      type: 'mention',
      user: 'Mike Johnson',
      action: 'mentioned you in a comment',
      time: '2 hours ago',
      avatar: 'https://via.placeholder.com/40',
      isRead: true,
    },
  ];

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

      <ScrollView style={styles.notificationsList}>
        {notifications.map((notification) => (
          <TouchableOpacity
            key={notification.id}
            style={[
              styles.notificationItem,
              !notification.isRead && styles.unreadNotification,
            ]}
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
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#660033',
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