import { supabase } from '../config/supabase';
import { uploadToCloudinary, deleteFromCloudinary } from '../config/cloudinary';

export class PostsService {
  // Create a new post
  static async createPost(uri = null, caption = '', type = 'text') {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      // Allow empty caption if media is provided, and vice versa
      if (!uri && !caption.trim()) {
        throw new Error('Please add some text or media to your post');
      }
      
      // Determine post type based on URI presence
      const finalType = uri ? type : 'text';
      
      let postData = {
        user_id: user.id,
        caption: caption.trim() || '',  // Allow empty caption
        type: finalType
      };
      
      // Handle media upload if URI is provided
      if (uri) {
        try {
          const cloudinaryResponse = await uploadToCloudinary(uri, finalType);
          if (!cloudinaryResponse || !cloudinaryResponse.url) {
            throw new Error('Failed to upload media');
          }
          postData = {
            ...postData,
            media_url: cloudinaryResponse.url,
            cloudinary_public_id: cloudinaryResponse.publicId
          };
        } catch (uploadError) {
          console.error('Error uploading to Cloudinary:', uploadError);
          if (uploadError.publicId) {
            await deleteFromCloudinary(uploadError.publicId, finalType).catch(console.error);
          }
          throw new Error('Failed to upload media. Please try again.');
        }
      }
      
      // Save post to Supabase
      const { data, error } = await supabase
        .from('posts')
        .insert(postData)
        .select(`
          *,
          profiles:user_id (id, username, avatar_url)
        `)
        .single();
      
      if (error) {
        console.error('Supabase error:', error);
        // Clean up Cloudinary upload if Supabase insert fails
        if (postData.cloudinary_public_id) {
          await deleteFromCloudinary(postData.cloudinary_public_id, postData.type).catch(console.error);
        }
        throw new Error(error.message || 'Failed to create post. Please try again.');
      }
      
      return data;
      
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  }
  
  // Get all posts with likes and comments count
  static async getAllPosts() {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:user_id (id, username, avatar_url),
          likes:post_likes (count),
          comments:post_comments (count)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
      
    } catch (error) {
      console.error('Error fetching posts:', error);
      throw error;
    }
  }
  
  // Get posts for a specific user
  static async getUserPosts(userId) {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          likes:post_likes (count),
          comments:post_comments (count)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
      
    } catch (error) {
      console.error('Error fetching user posts:', error);
      throw error;
    }
  }
  
  // Like/Unlike a post
  static async toggleLike(postId) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      // Check if user already liked the post
      const { data: existingLike } = await supabase
        .from('post_likes')
        .select()
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .single();
      
      if (existingLike) {
        // Unlike
        const { error } = await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);
          
        if (error) throw error;
        return false; // Indicates unliked
      } else {
        // Like
        const { error } = await supabase
          .from('post_likes')
          .insert({
            post_id: postId,
            user_id: user.id
          });
          
        if (error) throw error;
        return true; // Indicates liked
      }
      
    } catch (error) {
      console.error('Error toggling like:', error);
      throw error;
    }
  }
  
  // Add a comment
  static async addComment(postId, content) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('post_comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          content
        })
        .select(`
          *,
          profiles:user_id (username, avatar_url)
        `)
        .single();
      
      if (error) throw error;
      return data;
      
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  }
  
  // Get comments for a post
  static async getComments(postId) {
    try {
      const { data, error } = await supabase
        .from('post_comments')
        .select(`
          *,
          profiles:user_id (username, avatar_url)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data;
      
    } catch (error) {
      console.error('Error fetching comments:', error);
      throw error;
    }
  }
  
  // Delete a post
  static async deletePost(postId) {
    try {
      // First get the post to get Cloudinary public_id
      const { data: post, error: fetchError } = await supabase
        .from('posts')
        .select('cloudinary_public_id, type')
        .eq('id', postId)
        .single();
      
      if (fetchError) throw fetchError;
      
      // Delete from Cloudinary
      await deleteFromCloudinary(post.cloudinary_public_id, post.type);
      
      // Delete from Supabase (this will cascade delete likes and comments)
      const { error: deleteError } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);
      
      if (deleteError) throw deleteError;
      
    } catch (error) {
      console.error('Error deleting post:', error);
      throw error;
    }
  }
}