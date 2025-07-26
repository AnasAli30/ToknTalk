import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, 
  MessageCircle, 
  Repeat2, 
  Camera, 
  User, 
  Edit3, 
  LogOut, 
  Calendar,
  Hash,
  Loader2,
  Save,
  X
} from 'lucide-react';
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
  likes: any[];
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

const extractImageFromContent = (content: string) => {
  const imageMatch = content.match(/\[IMAGE:(.*?)\]/);
  if (imageMatch) {
    try {
      return JSON.parse(imageMatch[1]);
    } catch (e) {
      return null;
    }
  }
  return null;
};

const getTextContent = (content: string) => {
  return content.replace(/\[IMAGE:.*?\]/, '').trim();
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
        
        if ('Ok' in result) {
          const profileData = result.Ok;
          setProfile({
            ...profileData,
            id: principalToString(profileData.id)
          });
          setUsername(profileData.username);
          setBio(profileData.bio && profileData.bio.length > 0 ? profileData.bio[0] : '');
          setAvatarUrl(profileData.avatar_url && profileData.avatar_url.length > 0 ? profileData.avatar_url[0] : '');
          
          // Fetch user posts
          await fetchUserPosts(principalToString(profileData.id));
        } else {
          console.log("No profile found, need to create one");
          setIsCreating(true);
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    if (authState.isAuthenticated) {
      fetchProfile();
    }
  }, [authState.isAuthenticated]);

  const fetchUserPosts = async (userId: string) => {
    try {
      setPostsLoading(true);
      const actor = await backendService.getAuthenticatedActor();
      const posts = await actor.get_feed(BigInt(0)) as BackendPost[];
      
      // Filter posts by the current user
      const userPostsData = posts
        .filter(post => principalToString(post.author) === userId)
        .map(post => ({
          ...post,
          author: principalToString(post.author),
          likes: post.likes.map(like => principalToString(like)),
          comments: Array.isArray(post.comments) ? post.comments : Array.from(post.comments)
        }));
      
      setUserPosts(userPostsData);
      
      // Check which posts are liked by current user
      const likedPostsSet = new Set<string>();
      const resharedPostsSet = new Set<string>();
      
      userPostsData.forEach(post => {
        if (post.likes.includes(authState.principal || '')) {
          likedPostsSet.add(post.id.toString());
        }
        if (isReshare(post)) {
          resharedPostsSet.add(post.id.toString());
        }
      });
      
      setLikedPosts(likedPostsSet);
      setResharedPosts(resharedPostsSet);
    } catch (err) {
      console.error('Error fetching user posts:', err);
    } finally {
      setPostsLoading(false);
    }
  };

  const handleCreateProfile = async () => {
    if (!username.trim()) {
      setError('Username is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const actor = await backendService.getAuthenticatedActor();
      const result = await actor.create_profile(
        username,
        bio ? [bio] : [],
        avatarUrl ? [avatarUrl] : []
      ) as CreateProfileResult;
      
      if ('Ok' in result) {
        const profileData = result.Ok;
        setProfile({
          ...profileData,
          id: principalToString(profileData.id)
        });
        setIsCreating(false);
      } else {
        setError(result.Err);
      }
    } catch (err) {
      console.error('Error creating profile:', err);
      setError('Failed to create profile');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!username.trim()) {
      setError('Username is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const actor = await backendService.getAuthenticatedActor();
      const result = await actor.update_profile(
        bio ? [bio] : [],
        avatarUrl ? [avatarUrl] : []
      ) as GetProfileResult;
      
      if ('Ok' in result) {
        const profileData = result.Ok;
        setProfile({
          ...profileData,
          id: principalToString(profileData.id)
        });
        setIsEditing(false);
      } else {
        setError(result.Err);
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile');
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
    try {
      const actor = await backendService.getAuthenticatedActor();
      
      if (likedPosts.has(postId)) {
        await actor.unlike_post(BigInt(postId));
        setLikedPosts(prev => {
          const newSet = new Set(prev);
          newSet.delete(postId);
          return newSet;
        });
      } else {
        await actor.like_post(BigInt(postId));
        setLikedPosts(prev => new Set([...prev, postId]));
      }
      
      // Refresh posts to get updated like counts
      if (profile) {
        await fetchUserPosts(profile.id);
      }
    } catch (err) {
      console.error('Error liking/unliking post:', err);
    }
  };

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1000000);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        <div className="bg-card rounded-xl p-6 border border-border">
          <div className="flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
            <span className="ml-3 text-text-secondary">Loading profile...</span>
          </div>
        </div>
      </div>
    );
  }

  if (isCreating) {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl p-6 border border-border"
        >
          <h3 className="text-xl sm:text-2xl font-bold mb-6 text-text">Create Your Profile</h3>
          {error && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-error mb-4 p-3 bg-error/10 rounded-lg border border-error/20"
            >
              {error}
            </motion.div>
          )}
          
          <div className="space-y-6">
            {/* Avatar Upload */}
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient overflow-hidden border-2 border-accent/20">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white">
                      <User className="w-8 h-8 sm:w-12 sm:h-12" />
                    </div>
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 bg-accent hover:bg-accent/80 text-white p-2 rounded-full shadow-lg transition-colors"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <p className="text-text-secondary text-sm text-center">Click the camera to upload a profile picture</p>
            </div>

            <InputField
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              className="bg-background border-border text-text"
            />
            
            <div>
              <label className="block text-text-secondary text-sm mb-2">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about yourself..."
                className="w-full bg-background border border-border rounded-lg p-3 text-text resize-none focus:border-accent focus:outline-none"
                rows={3}
              />
            </div>
            
            <Button 
              onClick={handleCreateProfile}
              disabled={loading}
              className="w-full bg-accent hover:bg-accent/80 disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </div>
              ) : (
                'Create Profile'
              )}
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Profile Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-xl p-4 sm:p-6 border border-border"
      >
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient overflow-hidden border-2 border-accent/20">
              {profile?.avatar_url && profile.avatar_url.length > 0 ? (
                <img src={profile.avatar_url[0]} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white text-2xl sm:text-3xl font-bold">
                  {profile?.username?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-text">{profile?.username}</h2>
              <p className="text-text-secondary">{profile?.bio && profile.bio.length > 0 ? profile.bio[0] : 'No bio yet'}</p>
              <p className="text-text-secondary text-sm">@{authState.principal?.slice(0, 8)}...</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={() => setIsEditing(true)}
              className="bg-card border border-border hover:border-accent/40 text-text hover:text-accent"
            >
              <Edit3 className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button 
              onClick={logout} 
              className="bg-error hover:bg-error/80 text-white"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Profile Stats */}
        <div className="flex justify-around py-4 border-t border-border">
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
      </motion.div>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {isEditing && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-card rounded-xl p-4 sm:p-6 border border-border"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl sm:text-2xl font-bold text-text">Edit Profile</h3>
              <button
                onClick={() => setIsEditing(false)}
                className="p-2 rounded-lg hover:bg-background transition-colors"
              >
                <X className="w-5 h-5 text-text-secondary" />
              </button>
            </div>
            
            {error && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-error mb-4 p-3 bg-error/10 rounded-lg border border-error/20"
              >
                {error}
              </motion.div>
            )}
            
            <div className="space-y-6">
              {/* Avatar Upload */}
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient overflow-hidden border-2 border-accent/20">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white">
                        <User className="w-8 h-8 sm:w-12 sm:h-12" />
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 bg-accent hover:bg-accent/80 text-white p-2 rounded-full shadow-lg transition-colors"
                  >
                    <Camera className="w-4 h-4" />
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
                className="bg-background border-border text-text"
              />
              
              <div>
                <label className="block text-text-secondary text-sm mb-2">Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about yourself..."
                  className="w-full bg-background border border-border rounded-lg p-3 text-text resize-none focus:border-accent focus:outline-none"
                  rows={3}
                />
              </div>
              
              <div className="flex gap-3">
                <Button 
                  onClick={handleUpdateProfile}
                  disabled={loading}
                  className="flex-1 bg-accent hover:bg-accent/80 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </div>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
                <Button 
                  onClick={() => setIsEditing(false)}
                  className="bg-card border border-border hover:border-accent/40 text-text hover:text-accent"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* User Posts */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-xl p-4 sm:p-6 border border-border"
      >
        <h3 className="text-xl sm:text-2xl font-bold mb-6 text-text">Your Posts</h3>
        
        {postsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
            <span className="ml-3 text-text-secondary">Loading posts...</span>
          </div>
        ) : userPosts.length === 0 ? (
          <div className="text-center py-8 text-text-secondary">
            <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-lg mb-2">No posts yet</p>
            <p className="text-sm">Start sharing your thoughts with the community!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {userPosts.map((post, index) => (
              <motion.div
                key={post.id.toString()}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="border border-border rounded-lg p-4 hover:border-accent/40 transition-colors"
              >
                {/* Reshare Header */}
                {isReshare(post) && (
                  <div className="bg-background/50 px-4 py-2 rounded-t-lg text-text-secondary text-sm flex items-center gap-2 mb-3">
                    <Repeat2 className="w-4 h-4" />
                    <span>You reshared</span>
                  </div>
                )}
                
                {/* Post Content */}
                <div className="text-text mb-3 whitespace-pre-wrap">
                  {getTextContent(post.content)}
                </div>
                
                {/* Post Image */}
                {(() => {
                  const imageData = extractImageFromContent(post.content);
                  return imageData ? (
                    <div className="mb-3">
                      <img 
                        src={imageData.dataUrl} 
                        alt={imageData.fileName || 'Post image'} 
                        className="max-w-full max-h-96 rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => {
                          window.open(imageData.dataUrl, '_blank');
                        }}
                      />
                    </div>
                  ) : null;
                })()}
                
                {/* Hashtags */}
                {post.hashtags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {post.hashtags.map((tag, index) => (
                      <span 
                        key={index} 
                        className="flex items-center gap-1 text-accent text-sm hover:underline cursor-pointer"
                      >
                        <Hash className="w-3 h-3" />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                
                {/* Post Stats and Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-border">
                  <div className="flex items-center gap-4 text-text-secondary text-sm">
                    <div className="flex items-center gap-1">
                      <Heart className="w-4 h-4" />
                      <span>{post.likes.length}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageCircle className="w-4 h-4" />
                      <span>{post.comments.length}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Repeat2 className="w-4 h-4" />
                      <span>{post.reshare_count}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(post.created_at)}</span>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => handleLikePost(post.id.toString())}
                    className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${
                      likedPosts.has(post.id.toString()) 
                        ? 'text-accent' 
                        : 'text-text-secondary hover:text-text'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${likedPosts.has(post.id.toString()) ? 'fill-current' : ''}`} />
                    <span className="text-sm">Like</span>
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default ProfileView; 