import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { backendService } from '../services/backendService';
import { Button, InputField } from '../components';
import { principalToString } from '../utils/principal';
import type { UserProfile as BackendUserProfile, Post as BackendPost } from '../../../declarations/backend/backend.did';

interface UserProfile extends Omit<BackendUserProfile, 'id'> {
  id: string;
}

interface Post {
  id: bigint;
  author: string;
  content: string;
  created_at: bigint;
  likes: string[];
  comments: bigint[];
  hashtags: string[];
  reshare_count: bigint;
  post_type?: {
    Reshare: {
      original_post_id: bigint;
      original_author: any;
    };
  };
}

type GetProfileResult = { Ok: BackendUserProfile } | { Err: string };
type CreateProfileResult = { Ok: BackendUserProfile } | { Err: string };

// Simple icon placeholders
const HeartIcon = () => <span>❤️</span>;
const HeartIconSolid = () => <span>❤️</span>;
const ChatBubbleLeftIcon = () => <span>💬</span>;
const ArrowPathRoundedSquareIcon = () => <span>🔄</span>;
const CameraIcon = () => <span>📷</span>;

// Type guards
function isPlainObject(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null && !Array.isArray(x);
}

function isObjectWithReshare(x: unknown): x is { Reshare: any } {
  return isPlainObject(x) && Object.prototype.hasOwnProperty.call(x, 'Reshare');
}

const isReshare = (post: Post) => isObjectWithReshare(post.post_type);

const getOriginalAuthor = (post: Post) => {
  if (isObjectWithReshare(post.post_type)) {
    return principalToString(post.post_type.Reshare.original_author);
  }
  return null;
};

const ProfileView = () => {
  const { authState, logout } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [resharedPosts, setResharedPosts] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        console.log("Fetching profile, auth state:", authState);
        
        const actor = await backendService.getAuthenticatedActor();
        console.log("Got authenticated actor");
        
        const result = await actor.get_profile() as GetProfileResult;
        console.log("Profile result:", result);
        
        if ('Ok' in result && result.Ok) {
          const backendProfile = result.Ok;
          console.log("Profile found:", backendProfile);
          const userProfile = { ...backendProfile, id: principalToString(backendProfile.id) };
          setProfile(userProfile);
          setUsername(backendProfile.username);
          setBio(backendProfile.bio.length > 0 ? backendProfile.bio[0] : '');
          setAvatarUrl(backendProfile.avatar_url.length > 0 ? backendProfile.avatar_url[0] : '');
          
          // Fetch user posts
          fetchUserPosts(userProfile.id);
        } else {
          console.log("No profile found, showing creation form");
          setIsCreating(true);
        }
      } catch (err: any) {
        console.error("Error fetching profile:", err);
        setIsCreating(true);
      } finally {
        setLoading(false);
      }
    };
    
    if (authState.isAuthenticated) {
      console.log("User is authenticated, fetching profile");
      fetchProfile();
    } else {
      console.log("User is not authenticated");
    }
  }, [authState.isAuthenticated]);

  const fetchUserPosts = async (userId: string) => {
    try {
      setPostsLoading(true);
      const posts = await backendService.getUserPosts(userId) as any[];
      
      if (Array.isArray(posts)) {
                 const formattedPosts = posts.map((post: BackendPost) => ({
           id: post.id,
           author: principalToString(post.author),
           content: post.content,
           created_at: post.created_at,
           likes: post.likes.map(principalToString),
           comments: Array.isArray(post.comments) ? post.comments : Array.from(post.comments as any) as bigint[],
           hashtags: post.hashtags,
           reshare_count: post.reshare_count,
           post_type: post.post_type as any,
         }));
        
        setUserPosts(formattedPosts);
        
        // Check which posts are liked/reshared by current user
        const currentUserId = authState.principal;
        if (currentUserId) {
          const liked = new Set<string>();
          const reshared = new Set<string>();
          
          formattedPosts.forEach(post => {
            if (post.likes.includes(currentUserId)) {
              liked.add(post.id.toString());
            }
            if (isReshare(post) && post.author === currentUserId) {
              reshared.add(post.id.toString());
            }
          });
          
          setLikedPosts(liked);
          setResharedPosts(reshared);
        }
      }
    } catch (err) {
      console.error("Error fetching user posts:", err);
    } finally {
      setPostsLoading(false);
    }
  };

  const handleCreateProfile = async () => {
    if (!username) {
      setError('Username is required');
      return;
    }
    
    try {
      setLoading(true);
      console.log("Creating profile with username:", username, "bio:", bio, "avatar:", avatarUrl);
      
      const actor = await backendService.getAuthenticatedActor();
      console.log("Got authenticated actor for profile creation");
      
      const bioArray = bio ? [bio] : [];
      const avatarArray = avatarUrl ? [avatarUrl] : [];
      
      console.log("Calling create_profile with:", username, bioArray, avatarArray);
      const result = await actor.create_profile(username, bioArray, avatarArray) as CreateProfileResult;
      console.log("Profile creation result:", result);
      
      if ('Ok' in result && result.Ok) {
        const backendProfile = result.Ok;
        console.log("Profile created successfully:", backendProfile);
        const userProfile = { ...backendProfile, id: principalToString(backendProfile.id) };
        setProfile(userProfile);
        setIsCreating(false);
        
        // Fetch user posts after profile creation
        fetchUserPosts(userProfile.id);
      } else {
        console.error("Failed to create profile:", result);
        setError('Failed to create profile: ' + (result as any).Err);
      }
    } catch (err: any) {
      console.error("Error creating profile:", err);
      setError('Error creating profile: ' + (err.message || String(err)));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!username) {
      setError('Username is required');
      return;
    }
    
    try {
      setLoading(true);
      
      const actor = await backendService.getAuthenticatedActor();
      const bioArray = bio ? [bio] : [];
      const avatarArray = avatarUrl ? [avatarUrl] : [];
      
      const result = await actor.update_profile(bioArray, avatarArray) as CreateProfileResult;
      
      if ('Ok' in result && result.Ok) {
        const backendProfile = result.Ok;
        const userProfile = { ...backendProfile, id: principalToString(backendProfile.id) };
        setProfile(userProfile);
        setIsEditing(false);
      } else {
        setError('Failed to update profile: ' + (result as any).Err);
      }
    } catch (err: any) {
      console.error("Error updating profile:", err);
      setError('Error updating profile: ' + (err.message || String(err)));
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setAvatarUrl(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLikePost = async (postId: string) => {
    if (!authState.isAuthenticated) {
      setError('Please log in to like posts');
      return;
    }
    
    try {
      if (likedPosts.has(postId)) {
        await backendService.unlikePost(BigInt(postId));
        setLikedPosts(prev => {
          const newSet = new Set(prev);
          newSet.delete(postId);
          return newSet;
        });
      } else {
        await backendService.likePost(BigInt(postId));
        setLikedPosts(prev => new Set([...prev, postId]));
      }
      
      // Refresh posts to get updated like counts
      if (profile) {
        fetchUserPosts(profile.id);
      }
    } catch (err) {
      console.error('Error liking/unliking post:', err);
      setError('Failed to like/unlike post');
    }
  };

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1000000);
    const now = new Date();
    
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 7) {
      return `${date.toLocaleDateString([], { weekday: 'short' })} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    return date.toLocaleDateString([], { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit', 
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="bg-background-card rounded-xl p-6 shadow-md">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-3 text-text-secondary">Loading profile...</span>
        </div>
      </div>
    );
  }

  if (isCreating) {
    return (
      <div className="bg-background-card rounded-xl p-6 shadow-md">
        <h3 className="text-xl font-bold mb-6 text-text">Create Your Profile</h3>
        {error && <p className="text-error mb-4 p-3 bg-error/10 rounded-lg">{error}</p>}
        
        <div className="space-y-6">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-secondary-800 overflow-hidden border-2 border-primary/20">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-text-secondary">
                    <CameraIcon />
                  </div>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 bg-primary hover:bg-primary-600 text-white p-2 rounded-full shadow-lg transition-colors"
              >
                <CameraIcon />
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <p className="text-text-secondary text-sm">Click the camera to upload a profile picture</p>
          </div>

          <InputField
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            className="bg-background-input border-secondary-700 text-text"
          />
          
          <div>
            <label className="block text-text-secondary text-sm mb-2">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself..."
              className="w-full bg-background-input border border-secondary-700 rounded-lg p-3 text-text resize-none focus:border-primary focus:outline-none"
              rows={3}
            />
          </div>
          
          <Button 
            onClick={handleCreateProfile}
            disabled={loading}
            className="w-full bg-primary hover:bg-primary-600 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Profile'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="bg-background-card rounded-xl p-6 shadow-md">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 rounded-full bg-secondary-800 overflow-hidden border-2 border-primary/20">
              {profile?.avatar_url && profile.avatar_url.length > 0 ? (
                <img src={profile.avatar_url[0]} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-text-secondary text-2xl">
                  {profile?.username?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-text">{profile?.username}</h2>
              <p className="text-text-secondary">{profile?.bio && profile.bio.length > 0 ? profile.bio[0] : 'No bio yet'}</p>
              <p className="text-text-muted text-sm">@{authState.principal?.slice(0, 8)}...</p>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <Button 
              onClick={() => setIsEditing(true)}
              className="bg-secondary-700 hover:bg-secondary-600"
            >
              Edit Profile
            </Button>
            <Button 
              onClick={logout} 
              className="bg-error hover:bg-error/80"
            >
              Log Out
            </Button>
          </div>
        </div>

        {/* Profile Stats */}
        <div className="flex justify-around py-4 border-t border-secondary-800">
          <div className="text-center">
            <div className="text-xl font-bold text-text">{userPosts.length}</div>
            <div className="text-text-secondary text-sm">Posts</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-text">{profile?.followers_count || 0}</div>
            <div className="text-text-secondary text-sm">Followers</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-text">{profile?.following_count || 0}</div>
            <div className="text-text-secondary text-sm">Following</div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="bg-background-card rounded-xl p-6 shadow-md">
          <h3 className="text-xl font-bold mb-6 text-text">Edit Profile</h3>
          {error && <p className="text-error mb-4 p-3 bg-error/10 rounded-lg">{error}</p>}
          
          <div className="space-y-6">
            {/* Avatar Upload */}
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-secondary-800 overflow-hidden border-2 border-primary/20">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-text-secondary">
                      <CameraIcon />
                    </div>
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 bg-primary hover:bg-primary-600 text-white p-2 rounded-full shadow-lg transition-colors"
                >
                  <CameraIcon />
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>

            <InputField
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              className="bg-background-input border-secondary-700 text-text"
            />
            
            <div>
              <label className="block text-text-secondary text-sm mb-2">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about yourself..."
                className="w-full bg-background-input border border-secondary-700 rounded-lg p-3 text-text resize-none focus:border-primary focus:outline-none"
                rows={3}
              />
            </div>
            
            <div className="flex space-x-3">
              <Button 
                onClick={handleUpdateProfile}
                disabled={loading}
                className="flex-1 bg-primary hover:bg-primary-600 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button 
                onClick={() => setIsEditing(false)}
                className="bg-secondary-700 hover:bg-secondary-600"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* User Posts */}
      <div className="bg-background-card rounded-xl p-6 shadow-md">
        <h3 className="text-xl font-bold mb-6 text-text">Your Posts</h3>
        
        {postsLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-3 text-text-secondary">Loading posts...</span>
          </div>
        ) : userPosts.length === 0 ? (
          <div className="text-center py-8 text-text-secondary">
            <p className="text-lg mb-2">No posts yet</p>
            <p className="text-sm">Start sharing your thoughts with the community!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {userPosts.map((post) => (
              <div key={post.id.toString()} className="border border-secondary-800 rounded-lg p-4">
                {/* Reshare Header */}
                {isReshare(post) && (
                  <div className="bg-background-light px-4 py-2 rounded-t-lg text-text-secondary text-sm flex items-center gap-2 mb-3">
                    <ArrowPathRoundedSquareIcon />
                    <span>You reshared</span>
                  </div>
                )}
                
                {/* Post Content */}
                <div className="text-text mb-3 whitespace-pre-wrap">
                  {post.content}
                </div>
                
                {/* Hashtags */}
                {post.hashtags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {post.hashtags.map((tag, index) => (
                      <span 
                        key={index} 
                        className="text-primary text-sm hover:underline cursor-pointer"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
                
                {/* Post Stats and Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-secondary-800">
                  <div className="flex items-center gap-4 text-text-secondary text-sm">
                    <div className="flex items-center gap-1">
                      <span>{post.likes.length}</span>
                      <span>likes</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>{post.comments.length}</span>
                      <span>comments</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>{post.reshare_count}</span>
                      <span>reshares</span>
                    </div>
                    <span className="text-text-muted">{formatDate(post.created_at)}</span>
                  </div>
                  
                  <button 
                    onClick={() => handleLikePost(post.id.toString())}
                    className={`flex items-center gap-2 p-2 rounded-lg ${
                      likedPosts.has(post.id.toString()) 
                        ? 'text-primary' 
                        : 'text-text-secondary hover:text-text'
                    }`}
                  >
                    {likedPosts.has(post.id.toString()) 
                      ? <HeartIconSolid /> 
                      : <HeartIcon />
                    }
                    <span>Like</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileView; 