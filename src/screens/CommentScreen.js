// ... existing imports ...
import { sendCommentNotification } from '../utils/notificationService';

// ... existing code ...

const handleAddComment = async () => {
  if (!commentText.trim()) return;
  
  try {
    setSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    // Your existing comment logic
    const { data, error } = await supabase
      .from('comments')
      .insert({
        post_id: postId,
        user_id: user.id,
        content: commentText.trim()
      })
      .select();
      
    if (error) throw error;
    
    // Get post owner to send notification
    const { data: postData } = await supabase
      .from('posts')
      .select('user_id')
      .eq('id', postId)
      .single();
      
    if (postData && data && data[0]) {
      // Send notification to post owner
      await sendCommentNotification(postId, data[0].id, user.id, postData.user_id);
    }
    
    // Update UI or state as needed
    setCommentText('');
    // Refresh comments list
  } catch (error) {
    console.error('Error adding comment:', error);
  } finally {
    setSubmitting(false);
  }
};

// ... rest of your code ...