import { supabase } from '../config/supabase';
import { uploadToCloudinary, deleteFromCloudinary } from '../config/cloudinary';

export class StoriesService {
  // Get all active stories grouped by user
  static async getActiveStories() {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      // Get current timestamp
      const now = new Date();
      
      // Get all active stories (not expired, within 24 hours)
      const { data, error } = await supabase
        .from('stories')
        .select(`
          *,
          user:user_id (id, username, avatar_url)
        `)
        .gte('created_at', new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Get viewed stories for the current user
      const { data: viewedStories, error: viewedError } = await supabase
        .from('story_views')
        .select('story_id')
        .eq('user_id', user.id);
      
      if (viewedError) throw viewedError;
      
      // Create a set of viewed story IDs for faster lookup
      const viewedStoryIds = new Set(viewedStories?.map(view => view.story_id) || []);
      
      // Add viewed status to each story
      const storiesWithViewedStatus = data.map(story => ({
        ...story,
        is_viewed: viewedStoryIds.has(story.id)
      }));
      
      // Group stories by user
      const groupedStories = storiesWithViewedStatus.reduce((groups, story) => {
        const userId = story.user_id;
        const existingGroup = groups.find(group => group.user_id === userId);
        
        if (existingGroup) {
          existingGroup.stories.push(story);
        } else {
          groups.push({
            user_id: userId,
            user: story.user,
            stories: [story],
            has_unviewed: !story.is_viewed // Initialize with first story's status
          });
        }
        
        // Update has_unviewed flag if any story is unviewed
        if (existingGroup && !story.is_viewed) {
          existingGroup.has_unviewed = true;
        }
        
        return groups;
      }, []);
      
      return groupedStories;
      
    } catch (error) {
      console.error('Error fetching active stories:', error);
      throw error;
    }
  }
  
  // Upload a new story
  static async uploadStory(uri, type = 'image', followersOnly = false) {
    try {
      // First upload media to Cloudinary
      const cloudinaryResponse = await uploadToCloudinary(uri, type);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      // Check if user has any stories in the last 24 hours
      const now = new Date();
      const { data: existingStories, error: fetchError } = await supabase
        .from('stories')
        .select('id, story_group_id')
        .eq('user_id', user.id)
        .gte('created_at', new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });
      
      if (fetchError) throw fetchError;
      
      let storyGroupId;
      let isFirstStory = true;
      
      // If user has existing stories, use the same story_group_id
      if (existingStories && existingStories.length > 0) {
        storyGroupId = existingStories[0].story_group_id;
        isFirstStory = false;
      } else {
        // Generate a new UUID for story_group_id
        storyGroupId = crypto.randomUUID();
      }
      
      // Save story to Supabase
      const { data, error } = await supabase
        .from('stories')
        .insert({
          user_id: user.id,
          media_url: cloudinaryResponse.url,
          cloudinary_public_id: cloudinaryResponse.publicId,
          type: type,
          followers_only: followersOnly,
          story_group_id: storyGroupId,
          is_first_story: isFirstStory
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
      
      return true;
    } catch (error) {
      console.error('Error deleting story:', error);
      throw error;
    }
  }
  
  // Get stories for a specific user
  static async getUserStories(userId) {
    try {
      // Get current timestamp
      const now = new Date();
      
      // Get all active stories for the specified user
      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data;
      
    } catch (error) {
      console.error('Error fetching user stories:', error);
      throw error;
    }
  }
  
  // Mark a story as viewed by the current user
  static async markStoryAsViewed(storyId) {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      // Insert a record into story_views table
      const { error } = await supabase
        .from('story_views')
        .upsert({
          story_id: storyId,
          user_id: user.id
        }, { onConflict: 'story_id,user_id' });
      
      if (error) throw error;
      return true;
      
    } catch (error) {
      console.error('Error marking story as viewed:', error);
      return false;
    }
  }
  
  // Check if a story has been viewed by the current user
  static async hasViewedStory(storyId) {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      // Check if a record exists in story_views table
      const { data, error } = await supabase
        .from('story_views')
        .select('id')
        .eq('story_id', storyId)
        .eq('user_id', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error; // PGRST116 is the error code for no rows returned
      
      return !!data;
      
    } catch (error) {
      console.error('Error checking if story is viewed:', error);
      return false;
    }
  }
  
  // Check if any story in a story group has been viewed
  static async hasViewedStoryGroup(storyGroupId) {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      // Use the custom function we created in SQL
      const { data, error } = await supabase
        .rpc('has_viewed_story_group', { group_id: storyGroupId });
      
      if (error) throw error;
      
      return data;
      
    } catch (error) {
      console.error('Error checking if story group is viewed:', error);
      return false;
    }
  }
}