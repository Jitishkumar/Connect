import { supabase } from '../config/supabase';
import { uploadToCloudinary, deleteFromCloudinary } from '../config/cloudinary';

export class StoriesService {
  // Upload a new story
  static async uploadStory(uri, type = 'image') {
    try {
      // First upload media to Cloudinary
      const cloudinaryResponse = await uploadToCloudinary(uri, type);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      // Save story reference to Supabase
      const { data, error } = await supabase
        .from('stories')
        .insert({
          user_id: user.id,
          media_url: cloudinaryResponse.url,
          cloudinary_public_id: cloudinaryResponse.publicId,
          type: cloudinaryResponse.resourceType
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
      
    } catch (error) {
      console.error('Error uploading story:', error);
      throw error;
    }
  }
  
  // Get all active stories
  static async getActiveStories() {
    try {
      const { data, error } = await supabase
        .from('stories')
        .select(`
          id,
          media_url,
          type,
          created_at,
          profiles:user_id (id, username, avatar_url)
        `)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
      
    } catch (error) {
      console.error('Error fetching stories:', error);
      throw error;
    }
  }
  
  // Get stories for a specific user
  static async getUserStories(userId) {
    try {
      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .eq('user_id', userId)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
      
    } catch (error) {
      console.error('Error fetching user stories:', error);
      throw error;
    }
  }
  
  // Delete a story
  static async deleteStory(storyId) {
    try {
      // First get the story to get Cloudinary public_id
      const { data: story, error: fetchError } = await supabase
        .from('stories')
        .select('cloudinary_public_id, type')
        .eq('id', storyId)
        .single();
      
      if (fetchError) throw fetchError;
      
      // Delete from Cloudinary
      await deleteFromCloudinary(story.cloudinary_public_id, story.type);
      
      // Delete from Supabase
      const { error: deleteError } = await supabase
        .from('stories')
        .delete()
        .eq('id', storyId);
      
      if (deleteError) throw deleteError;
      
    } catch (error) {
      console.error('Error deleting story:', error);
      throw error;
    }
  }
}