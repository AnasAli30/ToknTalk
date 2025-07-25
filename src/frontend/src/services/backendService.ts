import { backend } from "../../../declarations/backend";
import { authService } from "./authService";
import { HttpAgent, Actor } from "@dfinity/agent";
import { idlFactory } from "../../../declarations/backend/backend.did.js";
import { Principal } from "@dfinity/principal";

/**
 * Service for handling all backend canister API calls
 */
export const backendService = {
  /**
   * Gets an authenticated actor for backend calls
   */
  async getAuthenticatedActor() {
    console.log("Getting authenticated actor");
    try {
      const authState = await authService.initialize();
      console.log("Auth state:", authState);
      
      if (!authState.isAuthenticated || !authState.identity) {
        console.error("User is not authenticated");
        throw new Error("User is not authenticated");
      }
      
      // Create a new agent with the user's identity
      console.log("Creating agent with identity");
      const agent = new HttpAgent({ identity: authState.identity });
      
      // When developing locally, we need to fetch the root key
      if (process.env.DFX_NETWORK !== "ic") {
        console.log("Fetching root key for local development");
        await agent.fetchRootKey();
      }
      
      // Create an actor with the new agent
      const canisterId = process.env.CANISTER_ID_BACKEND || "";
      console.log("Creating actor with canister ID:", canisterId);
      
      const actor = Actor.createActor(idlFactory, {
        agent,
        canisterId,
      });
      
      console.log("Actor created successfully");
      return actor;
    } catch (error) {
      console.error("Error getting authenticated actor:", error);
      throw error;
    }
  },

  /**
   * Sends a greeting to the backend and returns the response
   * @param name Name to greet
   * @returns Promise with the greeting response
   */
  async greet(name: string): Promise<string> {
    console.log("Calling greet with name:", name);
    try {
      const result = await backend.greet(name || "World");
      console.log("Greet result:", result);
      return result;
    } catch (error) {
      console.error("Error in greet:", error);
      throw error;
    }
  },

  /**
   * Fetches the current counter value
   * @returns Promise with the current count
   */
  async getCount(): Promise<bigint> {
    console.log("Getting count");
    try {
      const result = await backend.get_count();
      console.log("Count result:", result);
      return result;
    } catch (error) {
      console.error("Error getting count:", error);
      throw error;
    }
  },

  /**
   * Increments the counter on the backend
   * @returns Promise with the new count
   */
  async incrementCounter(): Promise<bigint> {
    console.log("Incrementing counter");
    try {
      const result = await backend.increment();
      console.log("Increment result:", result);
      return result;
    } catch (error) {
      console.error("Error incrementing counter:", error);
      throw error;
    }
  },

  /**
   * Sends a prompt to the LLM backend
   * @param prompt The user's prompt text
   * @returns Promise with the LLM response
   */
  async sendLlmPrompt(prompt: string): Promise<string> {
    console.log("Sending LLM prompt:", prompt);
    try {
      const result = await backend.prompt(prompt);
      console.log("LLM result:", result);
      return result;
    } catch (error) {
      console.error("Error sending LLM prompt:", error);
      throw error;
    }
  },

  /**
   * Adds a new todo item
   * @param text The todo text
   * @returns Promise with the created Todo
   */
  async addTodo(text: string) {
    console.log("Adding todo:", text);
    try {
      const result = await backend.add_todo(text);
      console.log("Add todo result:", result);
      return result;
    } catch (error) {
      console.error("Error adding todo:", error);
      throw error;
    }
  },

  /**
   * Fetches all todo items
   * @returns Promise with the list of todos
   */
  async getTodos() {
    console.log("Getting todos");
    try {
      const result = await backend.get_todos();
      console.log("Get todos result:", result);
      return result;
    } catch (error) {
      console.error("Error getting todos:", error);
      throw error;
    }
  },

  /**
   * Toggles the completed state of a todo by id
   * @param id The todo id (bigint)
   * @returns Promise with the updated Todo or undefined
   */
  async toggleTodo(id: bigint) {
    console.log("Toggling todo:", id);
    try {
      const result = await backend.toggle_todo(id);
      console.log("Toggle todo result:", result);
      return result;
    } catch (error) {
      console.error("Error toggling todo:", error);
      throw error;
    }
  },

  /**
   * Deletes a todo by id
   * @param id The todo id (bigint)
   * @returns Promise with true if deleted, false otherwise
   */
  async deleteTodo(id: bigint) {
    console.log("Deleting todo:", id);
    try {
      const result = await backend.delete_todo(id);
      console.log("Delete todo result:", result);
      return result;
    } catch (error) {
      console.error("Error deleting todo:", error);
      throw error;
    }
  },

  /**
   * Creates or updates user profile
   */
  async createProfile(username: string, bio?: string, avatarUrl?: string) {
    console.log("Creating profile:", { username, bio, avatarUrl });
    try {
      const actor = await this.getAuthenticatedActor();
      console.log("Calling create_profile with:", username, bio ? [bio] : [], avatarUrl ? [avatarUrl] : []);
      const result = await actor.create_profile(username, bio ? [bio] : [], avatarUrl ? [avatarUrl] : []);
      console.log("Create profile result:", result);
      return result;
    } catch (error) {
      console.error("Error creating profile:", error);
      throw error;
    }
  },
  
  /**
   * Updates user profile
   */
  async updateProfile(bio?: string, avatarUrl?: string) {
    console.log("Updating profile:", { bio, avatarUrl });
    try {
      const actor = await this.getAuthenticatedActor();
      console.log("Calling update_profile with:", bio ? [bio] : [], avatarUrl ? [avatarUrl] : []);
      const result = await actor.update_profile(bio ? [bio] : [], avatarUrl ? [avatarUrl] : []);
      console.log("Update profile result:", result);
      return result;
    } catch (error) {
      console.error("Error updating profile:", error);
      throw error;
    }
  },
  
  /**
   * Gets the current user's profile
   */
  async getMyProfile() {
    console.log("Getting my profile");
    try {
      const actor = await this.getAuthenticatedActor();
      const result = await actor.get_profile();
      console.log("Get my profile result:", result);
      return result;
    } catch (error) {
      console.error("Error getting my profile:", error);
      throw error;
    }
  },
  
  /**
   * Gets a user's profile by principal ID
   */
  async getUserProfile(userId: string) {
    console.log("Getting user profile for:", userId);
    try {
      const result = await backend.get_user_profile(Principal.fromText(userId));
      console.log("Get user profile result:", result);
      return result;
    } catch (error) {
      console.error("Error getting user profile:", error);
      throw error;
    }
  },
  
  /**
   * Searches for users by query string
   */
  async searchUsers(query: string) {
    console.log("Searching users with query:", query);
    try {
      const result = await backend.search_users(query);
      console.log("Search users result:", result);
      return result;
    } catch (error) {
      console.error("Error searching users:", error);
      throw error;
    }
  },
  
  /**
   * Creates a new post
   */
  async createPost(content: string) {
    console.log("Creating post with content:", content);
    try {
      const actor = await this.getAuthenticatedActor();
      console.log("Got authenticated actor for post creation");
      const result = await actor.create_post(content);
      console.log("Create post result:", result);
      return result;
    } catch (error) {
      console.error("Error creating post:", error);
      throw error;
    }
  },
  
  /**
   * Get all posts
   */
  async getAllPosts() {
    console.log("Getting all posts");
    try {
      const actor = await this.getAuthenticatedActor();
      const result = await actor.get_posts();
      console.log("Get all posts result:", result);
      return result;
    } catch (error) {
      console.error("Error getting all posts:", error);
      throw error;
    }
  },
  
  /**
   * Get posts by user
   */
  async getUserPosts(userId: string) {
    console.log("Getting posts for user:", userId);
    try {
      const actor = await this.getAuthenticatedActor();
      const result = await actor.get_user_posts(Principal.fromText(userId));
      console.log("Get user posts result:", result);
      return result;
    } catch (error) {
      console.error("Error getting user posts:", error);
      throw error;
    }
  },
  
  /**
   * Get a specific post by ID
   */
  async getPost(postId: bigint) {
    console.log("Getting post:", postId.toString());
    try {
      const actor = await this.getAuthenticatedActor();
      const result = await actor.get_post(postId);
      console.log("Get post result:", result);
      return result;
    } catch (error) {
      console.error("Error getting post:", error);
      throw error;
    }
  },
  
  /**
   * Deletes a post by ID
   */
  async deletePost(postId: bigint) {
    console.log("Deleting post with ID:", postId);
    try {
      const actor = await this.getAuthenticatedActor();
      const result = await actor.delete_post(postId);
      console.log("Delete post result:", result);
      return result;
    } catch (error) {
      console.error("Error deleting post:", error);
      throw error;
    }
  },
  
  /**
   * Likes a post
   */
  async likePost(postId: bigint) {
    console.log("Liking post with ID:", postId);
    try {
      const actor = await this.getAuthenticatedActor();
      const result = await actor.like_post(postId);
      console.log("Like post result:", result);
      return result;
    } catch (error) {
      console.error("Error liking post:", error);
      throw error;
    }
  },
  
  /**
   * Unlikes a post
   */
  async unlikePost(postId: bigint) {
    console.log("Unliking post with ID:", postId);
    try {
      const actor = await this.getAuthenticatedActor();
      const result = await actor.unlike_post(postId);
      console.log("Unlike post result:", result);
      return result;
    } catch (error) {
      console.error("Error unliking post:", error);
      throw error;
    }
  },
  
  /**
   * Adds a comment to a post
   */
  async addComment(postId: bigint, content: string) {
    console.log("Adding comment to post:", postId, "with content:", content);
    try {
      const actor = await this.getAuthenticatedActor();
      const result = await actor.add_comment(postId, content);
      console.log("Add comment result:", result);
      return result;
    } catch (error) {
      console.error("Error adding comment:", error);
      throw error;
    }
  },
  
  /**
   * Gets comments for a post
   */
  async getComments(postId: bigint) {
    console.log("Getting comments for post:", postId);
    try {
      const result = await backend.get_comments(postId);
      console.log("Get comments result:", result);
      return result;
    } catch (error) {
      console.error("Error getting comments:", error);
      throw error;
    }
  },
  
  /**
   * Follow a user
   */
  async followUser(userId: string) {
    console.log("Following user:", userId);
    try {
      const actor = await this.getAuthenticatedActor();
      const result = await actor.follow_user(Principal.fromText(userId));
      console.log("Follow user result:", result);
      return result;
    } catch (error) {
      console.error("Error following user:", error);
      throw error;
    }
  },
  
  /**
   * Unfollow a user
   */
  async unfollowUser(userId: string) {
    console.log("Unfollowing user:", userId);
    try {
      const actor = await this.getAuthenticatedActor();
      const result = await actor.unfollow_user(Principal.fromText(userId));
      console.log("Unfollow user result:", result);
      return result;
    } catch (error) {
      console.error("Error unfollowing user:", error);
      throw error;
    }
  },
  
  /**
   * Get followers of a user
   */
  async getFollowers(userId: string) {
    console.log("Getting followers for user:", userId);
    try {
      const result = await backend.get_followers(Principal.fromText(userId));
      console.log("Get followers result:", result);
      return result;
    } catch (error) {
      console.error("Error getting followers:", error);
      throw error;
    }
  },
  
  /**
   * Get users followed by a user
   */
  async getFollowing(userId: string) {
    console.log("Getting users followed by:", userId);
    try {
      const result = await backend.get_following(Principal.fromText(userId));
      console.log("Get following result:", result);
      return result;
    } catch (error) {
      console.error("Error getting following:", error);
      throw error;
    }
  },
  
  /**
   * Get personalized feed for current user
   */
  async getFeed() {
    console.log("Getting personalized feed");
    try {
      const actor = await this.getAuthenticatedActor();
      const result = await actor.get_feed();
      console.log("Get feed result:", result);
      return result;
    } catch (error) {
      console.error("Error getting feed:", error);
      throw error;
    }
  },
  
  /**
   * Get trending topics
   */
  async getTrendingTopics(limit: number) {
    console.log("Getting trending topics with limit:", limit);
    try {
      const result = await backend.get_trending_topics(BigInt(limit));
      console.log("Get trending topics result:", result);
      return result;
    } catch (error) {
      console.error("Error getting trending topics:", error);
      throw error;
    }
  },
  
  /**
   * Search posts by hashtag
   */
  async searchPostsByHashtag(hashtag: string) {
    console.log("Searching posts by hashtag:", hashtag);
    try {
      const result = await backend.search_posts_by_hashtag(hashtag);
      console.log("Search posts by hashtag result:", result);
      return result;
    } catch (error) {
      console.error("Error searching posts by hashtag:", error);
      throw error;
    }
  },
  
  /**
   * Get notifications for current user
   */
  async getNotifications() {
    console.log("Getting notifications");
    try {
      const actor = await this.getAuthenticatedActor();
      const result = await actor.get_notifications();
      console.log("Get notifications result:", result);
      return result;
    } catch (error) {
      console.error("Error getting notifications:", error);
      throw error;
    }
  },
  
  /**
   * Mark notification as read
   */
  async markNotificationAsRead(notificationId: bigint) {
    console.log("Marking notification as read:", notificationId);
    try {
      const actor = await this.getAuthenticatedActor();
      const result = await actor.mark_notification_as_read(notificationId);
      console.log("Mark notification as read result:", result);
      return result;
    } catch (error) {
      console.error("Error marking notification as read:", error);
      throw error;
    }
  },
  
  /**
   * Mark all notifications as read
   */
  async markAllNotificationsAsRead() {
    console.log("Marking all notifications as read");
    try {
      const actor = await this.getAuthenticatedActor();
      const result = await actor.mark_all_notifications_as_read();
      console.log("Mark all notifications as read result:", result);
      return result;
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      throw error;
    }
  },
  
  /**
   * Get the current user's principal ID
   */
  async whoami() {
    console.log("Getting current user's principal ID");
    try {
      const actor = await this.getAuthenticatedActor();
      const result = await actor.whoami();
      console.log("Whoami result:", result);
      return result;
    } catch (error) {
      console.error("Error getting principal ID:", error);
      throw error;
    }
  },

  /**
   * Send a direct message to another user
   */
  async sendMessage(toUserId: string, content: string) {
    console.log("Sending message to:", toUserId, "content:", content);
    try {
      const actor = await this.getAuthenticatedActor();
      const result = await actor.send_message(Principal.fromText(toUserId), content);
      console.log("Send message result:", result);
      return result;
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  },
  
  /**
   * Get messages exchanged with a specific user
   */
  async getMessages(withUserId: string) {
    console.log("Getting messages with user:", withUserId);
    try {
      const actor = await this.getAuthenticatedActor();
      const result = await actor.get_messages(Principal.fromText(withUserId));
      console.log("Get messages result:", result);
      return result;
    } catch (error) {
      console.error("Error getting messages:", error);
      throw error;
    }
  },
  
  /**
   * Get all chat threads for the current user
   */
  async getChatThreads() {
    console.log("Getting chat threads");
    try {
      const actor = await this.getAuthenticatedActor();
      const result = await actor.get_chat_threads();
      console.log("Get chat threads result:", result);
      return result;
    } catch (error) {
      console.error("Error getting chat threads:", error);
      throw error;
    }
  },
  
  /**
   * Mark messages from a specific user as read
   */
  async markMessagesAsRead(fromUserId: string) {
    console.log("Marking messages as read from:", fromUserId);
    try {
      const actor = await this.getAuthenticatedActor();
      const result = await actor.mark_messages_as_read(Principal.fromText(fromUserId));
      console.log("Mark messages as read result:", result);
      return result;
    } catch (error) {
      console.error("Error marking messages as read:", error);
      throw error;
    }
  },

  /**
   * Reshare a post
   */
  async resharePost(postId: bigint) {
    console.log("Resharing post:", postId.toString());
    try {
      const actor = await this.getAuthenticatedActor();
      const result = await actor.reshare_post(postId);
      console.log("Reshare post result:", result);
      return result;
    } catch (error) {
      console.error("Error resharing post:", error);
      throw error;
    }
  },

  /**
   * Get personalized feed based on user interactions
   */
  async getPersonalizedFeed(limit: number) {
    console.log("Getting personalized feed with limit:", limit);
    try {
      const actor = await this.getAuthenticatedActor();
      const result = await actor.get_personalized_feed(BigInt(limit));
      console.log("Get personalized feed result:", result);
      return result;
    } catch (error) {
      console.error("Error getting personalized feed:", error);
      throw error;
    }
  },

  /**
   * Get mutual connections with another user
   */
  async getMutualConnections(userId: string) {
    console.log("Getting mutual connections with user:", userId);
    try {
      const actor = await this.getAuthenticatedActor();
      const result = await actor.get_mutual_connections(Principal.fromText(userId));
      console.log("Get mutual connections result:", result);
      return result;
    } catch (error) {
      console.error("Error getting mutual connections:", error);
      throw error;
    }
  },

  /**
   * Get suggested connections for the current user
   */
  async getSuggestedConnections(limit: number) {
    console.log("Getting suggested connections with limit:", limit);
    try {
      const actor = await this.getAuthenticatedActor();
      const result = await actor.suggest_connections(BigInt(limit));
      console.log("Get suggested connections result:", result);
      return result;
    } catch (error) {
      console.error("Error getting suggested connections:", error);
      throw error;
    }
  },

  /**
   * Get connection strength with another user
   */
  async getConnectionStrength(userId: string) {
    console.log("Getting connection strength with user:", userId);
    try {
      const actor = await this.getAuthenticatedActor();
      const result = await actor.get_connection_strength(Principal.fromText(userId));
      console.log("Get connection strength result:", result);
      return result;
    } catch (error) {
      console.error("Error getting connection strength:", error);
      throw error;
    }
  },

  /**
   * Get original post for a reshare
   */
  async getOriginalPost(postId: bigint) {
    console.log("Getting original post for reshare:", postId.toString());
    try {
      const actor = await this.getAuthenticatedActor();
      const result = await actor.get_original_post(postId);
      console.log("Get original post result:", result);
      return result;
    } catch (error) {
      console.error("Error getting original post:", error);
      throw error;
    }
  }
};
