// ... existing imports ...
import { sendLikeNotification } from '../utils/notificationService';

// ... existing code ...

const handleLike = async (postId) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    // Your existing like logic
    const { data, error } = await supabase
      .from('likes')
      .insert({
        post_id: postId,
        user_id: user.id
      });
      
    if (error) throw error;
    
    // Get post owner to send notification
    const { data: postData } = await supabase
      .from('posts')
      .select('user_id')
      .eq('id', postId)
      .single();
      
    if (postData) {
      // Send notification to post owner
      await sendLikeNotification(postId, user.id, postData.user_id);
    }
    
    // Update UI or state as needed
  } catch (error) {
    console.error('Error liking post:', error);
  }
};

// ... rest of your code ...