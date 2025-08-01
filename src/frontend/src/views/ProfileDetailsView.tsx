import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, 
  MessageCircle, 
  Repeat2, 
  Users, 
  User, 
  X, 
  DollarSign,
  Calendar,
  Hash,
  Send,
  Loader2
} from 'lucide-react';
import { backendService } from '../services/backendService';
import { walletService } from '../services/walletService';
import { Button } from '../components';
import { useAuth } from '../context/AuthContext';
import { principalToString } from '../utils/principal';
import type { 
  Post as BackendPost 
} from '../../../declarations/backend/backend.did';
import { Principal } from '@dfinity/principal';

interface UserProfile {
  id: string;
  username: string;
  bio: string[];
  avatar_url: string[];
  followers_count: bigint;
  following_count: bigint;
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
      original_author: string;
    };
  };
}

// Remove old icon placeholders - using Lucide React icons now

function isPlainObject(x: unknown): x is Record<string, unknown> {
  return (
    typeof x === 'object' &&
    x !== null &&
    !Array.isArray(x)
  );
}

function isObjectWithReshare(x: unknown): x is { Reshare: any } {
  return (
    typeof x === 'object' &&
    x !== null &&
    !Array.isArray(x) &&
    Object.prototype.hasOwnProperty.call(x, 'Reshare')
  );
}

const ProfileDetailsView = ({
  userId,
  onClose,
  onNavigateToChat
}: {
  userId: string;
  onClose: () => void;
  onNavigateToChat?: () => void;
}) => {
  const { authState } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [followers, setFollowers] = useState<string[]>([]);
  const [following, setFollowing] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loadingFollow, setLoadingFollow] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'followers' | 'following'>('posts');
  const [comment, setComment] = useState('');
  const [commentPostId, setCommentPostId] = useState<string | null>(null);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [userProfiles, setUserProfiles] = useState<Record<string, UserProfile>>({});
  
  // Tip functionality
  const [showTipModal, setShowTipModal] = useState(false);
  const [tipAmount, setTipAmount] = useState('');
  const [tipLoading, setTipLoading] = useState(false);
  const [tipError, setTipError] = useState<string | null>(null);
  const [tipSuccess, setTipSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
    fetchPosts();
    fetchFollowers();
    fetchFollowing();
    checkIfFollowing();
  }, [userId]);

  const fetchProfile = async () => {
    try {
      const result = await backendService.getUserProfile(userId);
      if (result && 'Ok' in result) {
        const profile = result.Ok;
        setProfile({
          id: principalToString(profile.id),
          username: profile.username,
          bio: profile.bio,
          avatar_url: profile.avatar_url,
          followers_count: profile.followers_count,
          following_count: profile.following_count
        });
      } else {
        setError('Profile not found');
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = async () => {
    try {
      const result = await backendService.getUserPosts(userId);
      if (Array.isArray(result)) {
        const formattedPosts = result.map((post: BackendPost) => ({
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
        setPosts(formattedPosts);
        
        // Check which posts are liked by current user
        const currentUserId = authState.principal;
        if (currentUserId) {
          const liked = new Set<string>();
          formattedPosts.forEach(post => {
            if (post.likes.includes(currentUserId)) {
              liked.add(post.id.toString());
            }
          });
          setLikedPosts(liked);
        }
      }
    } catch (err) {
      console.error('Error fetching posts:', err);
    }
  };

  const fetchFollowers = async () => {
    try {
      const result = await backendService.getFollowers(userId);
      if (Array.isArray(result)) {
        const followerIds = result.map(principalToString);
        setFollowers(followerIds);
        fetchUserProfiles(followerIds);
      }
    } catch (err) {
      console.error('Error fetching followers:', err);
    }
  };

  const fetchFollowing = async () => {
    try {
      const result = await backendService.getFollowing(userId);
      if (Array.isArray(result)) {
        const followingIds = result.map(principalToString);
        setFollowing(followingIds);
        fetchUserProfiles(followingIds);
      }
    } catch (err) {
      console.error('Error fetching following:', err);
    }
  };

  const fetchUserProfiles = async (userIds: string[]) => {
    try {
      const profiles: Record<string, UserProfile> = {};
      for (const userId of userIds) {
        try {
          const result = await backendService.getUserProfile(userId);
          if (result && 'Ok' in result) {
            const profile = result.Ok;
            profiles[userId] = {
              id: principalToString(profile.id),
              username: profile.username,
              bio: profile.bio,
              avatar_url: profile.avatar_url,
              followers_count: profile.followers_count,
              following_count: profile.following_count
            };
          }
        } catch (err) {
          console.error(`Error fetching profile for ${userId}:`, err);
        }
      }
      setUserProfiles(prev => ({ ...prev, ...profiles }));
    } catch (err) {
      console.error('Error fetching user profiles:', err);
    }
  };

  const checkIfFollowing = async () => {
    try {
      const result = await backendService.getFollowing(authState.principal || '');
      if (Array.isArray(result)) {
        const followingIds = result.map(principalToString);
        setIsFollowing(followingIds.includes(userId));
      }
    } catch (err) {
      console.error('Error checking follow status:', err);
    }
  };

  const handleFollow = async () => {
    if (!authState.isAuthenticated) {
      setError('Please log in to follow users');
      return;
    }
    setLoadingFollow(true);
    try {
      if (isFollowing) {
        await backendService.unfollowUser(userId);
      } else {
        await backendService.followUser(userId);
      }
      setIsFollowing(!isFollowing);
      fetchFollowers(); // Refresh counts
    } catch (err) {
      console.error('Error following/unfollowing:', err);
      setError('Failed to follow/unfollow user');
    } finally {
      setLoadingFollow(false);
    }
  };

  const handleMessage = async () => {
    if (!authState.isAuthenticated) {
      setError('Please log in to send messages');
      return;
    }
    setLoadingMessage(true);
    try {
      // Navigate to chat with this user
      if (onNavigateToChat) {
        onNavigateToChat();
      }
    } catch (err) {
      console.error('Error navigating to chat:', err);
      setError('Failed to open chat');
    } finally {
      setLoadingMessage(false);
    }
  };

  const handleTip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authState.isAuthenticated) {
      setTipError('Please log in to send tips');
      return;
    }
    
    if (!tipAmount.trim()) {
      setTipError('Please enter a tip amount');
      return;
    }

    const amount = parseFloat(tipAmount);
    if (isNaN(amount) || amount <= 0) {
      setTipError('Please enter a valid amount');
      return;
    }

    try {
      setTipLoading(true);
      setTipError(null);
      
      const request = {
        userId: userId,
        amount: Number(walletService.icpToE8s(amount))
      };
      
      await walletService.tipUser(request);
      
      setTipSuccess(`Successfully tipped ${profile?.username} ${amount} ICP!`);
      setTipAmount('');
      
      // Close modal after 2 seconds
      setTimeout(() => {
        setShowTipModal(false);
        setTipSuccess(null);
      }, 2000);
    } catch (err: any) {
      console.error('Error tipping user:', err);
      setTipError('Tip failed: ' + (err.message || String(err)));
    } finally {
      setTipLoading(false);
    }
  };

  const handleLike = async (postId: string) => {
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
      fetchPosts(); // Refresh posts to get updated like counts
    } catch (err) {
      console.error('Error liking/unliking post:', err);
      setError('Failed to like/unlike post');
    }
  };

  const handleComment = async (postId: string) => {
    if (!authState.isAuthenticated) {
      setError('Please log in to comment');
      return;
    }
    if (!comment.trim()) {
      return;
    }
    try {
      const result = await backendService.addComment(BigInt(postId), comment);
      if (isPlainObject(result) && 'Ok' in result) {
        setComment('');
        setCommentPostId(null);
        fetchPosts();
      } else if (isPlainObject(result) && 'Err' in result) {
        const errorMsg = (result as any).Err;
        setError(typeof errorMsg === 'string' ? errorMsg : 'Failed to add comment');
      }
    } catch (err) {
      console.error('Error adding comment:', err);
      setError('Failed to add comment');
    }
  };

  const getAvatarUrl = (profile: UserProfile | null) => {
    if (profile?.avatar_url && profile.avatar_url.length > 0) {
      return profile.avatar_url[0];
    }
    return 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y';
  };

  const formatBio = (bio: string[] | undefined) => {
    if (!bio || bio.length === 0) return 'No bio yet';
    return bio[0];
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

  const isReshare = (post: Post) => isObjectWithReshare(post.post_type);

  const getOriginalAuthor = (post: Post) => {
    if (isObjectWithReshare(post.post_type)) {
      return principalToString(post.post_type.Reshare.original_author as any);
    }
    return null;
  };

  const handleViewUser = (userId: string) => {
    // For now, just reload the page
    // In a real app, this would navigate to the user's profile
    window.location.reload();
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

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-card rounded-xl p-8 shadow-2xl max-w-md w-full mx-4 border border-border">
          <div className="flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
            <span className="ml-3 text-text-secondary">Loading profile...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-card rounded-xl p-8 shadow-2xl max-w-md w-full mx-4 border border-border">
          <div className="text-center">
            <p className="text-red-400 mb-4">{error}</p>
            <Button onClick={onClose} className="bg-accent hover:bg-accent/80 text-white">
              Close
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-background rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-border flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-background border-b border-border p-6 rounded-t-xl">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-text">Profile</h2>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-background text-text-secondary transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

        {/* Profile Info */}
        <div className="p-6 bg-background overflow-y-auto flex-1">
          <div className="flex items-start space-x-6 mb-6">
            <div className="w-24 h-24 rounded-full bg-gradient overflow-hidden border-2 border-accent/20 flex-shrink-0">
              {profile?.avatar_url && profile.avatar_url.length > 0 ? (
                <img src={profile.avatar_url[0]} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white text-3xl font-bold">
                  {profile?.username?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
            </div>
            
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-text mb-2">{profile?.username}</h3>
              <p className="text-text-secondary mb-4">{formatBio(profile?.bio)}</p>
              <p className="text-text-secondary text-sm mb-4">@{userId.slice(0, 8)}...</p>
              
              <div className="flex space-x-4">
                <Button
                  onClick={handleFollow}
                  disabled={loadingFollow || userId === authState.principal}
                  className={`${
                    isFollowing 
                      ? 'bg-background border border-border hover:border-accent/40 text-text hover:text-accent' 
                      : 'bg-accent hover:bg-accent/80 text-white'
                  } disabled:opacity-50`}
                >
                  {loadingFollow ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    isFollowing ? 'Unfollow' : 'Follow'
                  )}
                </Button>
                
                {onNavigateToChat && (
                  <Button
                    onClick={handleMessage}
                    disabled={loadingMessage || userId === authState.principal}
                    className="bg-card border border-border hover:border-accent/40 text-text hover:text-accent disabled:opacity-50"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span className="ml-2">Message</span>
                  </Button>
                )}

                <Button
                  onClick={() => setShowTipModal(true)}
                  disabled={userId === authState.principal}
                  className="bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
                >
                  <DollarSign className="w-4 h-4" />
                  <span className="ml-2">Tip</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="flex justify-around py-4 border-t border-border mb-6 bg-card/50 rounded-lg">
            <div className="text-center">
              <div className="text-xl font-bold text-text">{posts.length}</div>
              <div className="text-text-secondary text-sm">Posts</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-text">{Number(profile?.followers_count || 0)}</div>
              <div className="text-text-secondary text-sm">Followers</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-text">{Number(profile?.following_count || 0)}</div>
              <div className="text-text-secondary text-sm">Following</div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-border mb-6">
            <button
              onClick={() => setActiveTab('posts')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'posts'
                  ? 'text-accent border-b-2 border-accent'
                  : 'text-text-secondary hover:text-text'
              }`}
            >
              Posts
            </button>
            <button
              onClick={() => setActiveTab('followers')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'followers'
                  ? 'text-accent border-b-2 border-accent'
                  : 'text-text-secondary hover:text-text'
              }`}
            >
              <Users className="w-4 h-4" />
              <span className="ml-2">Followers ({followers.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('following')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'following'
                  ? 'text-accent border-b-2 border-accent'
                  : 'text-text-secondary hover:text-text'
              }`}
            >
              <Users className="w-4 h-4" />
              <span className="ml-2">Following ({following.length})</span>
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'posts' && (
            <div className="space-y-4">
              {posts.length === 0 ? (
                <div className="text-center py-8 text-text-secondary">
                  <p className="text-lg mb-2">No posts yet</p>
                  <p className="text-sm">This user hasn't shared anything yet.</p>
                </div>
              ) : (
                posts.map((post) => (
                  <div key={post.id.toString()} className="border border-border rounded-lg p-4 bg-card">
                    {/* Reshare Header */}
                    {isReshare(post) && (
                      <div className="bg-background/50 px-4 py-2 rounded-t-lg text-text-secondary text-sm flex items-center gap-2 mb-3">
                        <Repeat2 className="w-4 h-4" />
                        <span>{profile?.username} reshared</span>
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
                              // Open image in full screen
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
                            className="text-accent text-sm hover:underline cursor-pointer"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    {/* Post Stats and Actions */}
                    <div className="flex items-center justify-between pt-3 border-t border-border">
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
                        <span className="text-text-secondary">{formatDate(post.created_at)}</span>
                      </div>
                      
                      <button 
                        onClick={() => handleLike(post.id.toString())}
                        className={`flex items-center gap-2 p-2 rounded-lg ${
                          likedPosts.has(post.id.toString()) 
                            ? 'text-accent' 
                            : 'text-text-secondary hover:text-text'
                        }`}
                      >
                        {likedPosts.has(post.id.toString()) 
                          ? <Heart className="w-4 h-4 fill-current" /> 
                          : <Heart className="w-4 h-4" />
                        }
                        <span>Like</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'followers' && (
            <div className="space-y-3">
              {followers.length === 0 ? (
                <div className="text-center py-8 text-text-secondary">
                  <p>No followers yet</p>
                </div>
              ) : (
                followers.map((followerId) => {
                  const followerProfile = userProfiles[followerId];
                  return (
                    <div key={followerId} className="flex items-center justify-between p-3 border border-border rounded-lg bg-card">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-full bg-gradient overflow-hidden">
                          <img 
                            src={getAvatarUrl(followerProfile)} 
                            alt="Avatar" 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <div className="font-medium text-text">
                            {followerProfile?.username || `User ${followerId.slice(0, 8)}...`}
                          </div>
                          <div className="text-text-secondary text-sm">
                            {followerProfile?.bio && followerProfile.bio.length > 0 
                              ? followerProfile.bio[0] 
                              : 'No bio'
                            }
                          </div>
                        </div>
                      </div>
                      <Button 
                        onClick={() => handleViewUser(followerId)}
                        className="bg-accent hover:bg-accent/80 text-white"
                      >
                        View
                      </Button>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {activeTab === 'following' && (
            <div className="space-y-3">
              {following.length === 0 ? (
                <div className="text-center py-8 text-text-secondary">
                  <p>Not following anyone yet</p>
                </div>
              ) : (
                following.map((followingId) => {
                  const followingProfile = userProfiles[followingId];
                  return (
                    <div key={followingId} className="flex items-center justify-between p-3 border border-border rounded-lg bg-card">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-full bg-gradient overflow-hidden">
                          <img 
                            src={getAvatarUrl(followingProfile)} 
                            alt="Avatar" 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <div className="font-medium text-text">
                            {followingProfile?.username || `User ${followingId.slice(0, 8)}...`}
                          </div>
                          <div className="text-text-secondary text-sm">
                            {followingProfile?.bio && followingProfile.bio.length > 0 
                              ? followingProfile.bio[0] 
                              : 'No bio'
                            }
                          </div>
                        </div>
                      </div>
                      <Button 
                        onClick={() => handleViewUser(followingId)}
                        className="bg-accent hover:bg-accent/80 text-white"
                      >
                        View
                      </Button>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Tip Modal */}
        {showTipModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card rounded-xl p-6 w-full max-w-md border border-border shadow-2xl"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-text">Tip {profile?.username}</h3>
                <button
                  onClick={() => setShowTipModal(false)}
                  className="p-2 rounded-full hover:bg-background text-text-secondary transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleTip} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-text">Amount (ICP)</label>
                  <input
                    type="number"
                    step="0.00000001"
                    value={tipAmount}
                    onChange={(e) => setTipAmount(e.target.value)}
                    className="w-full p-3 border border-border rounded-lg bg-background text-text focus:border-accent focus:outline-none"
                    placeholder="0.00000001"
                    disabled={tipLoading}
                  />
                </div>
                
                {tipError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                    {tipError}
                  </div>
                )}
                
                {tipSuccess && (
                  <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm">
                    {tipSuccess}
                  </div>
                )}
                
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowTipModal(false)}
                    className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-background transition-colors text-text"
                    disabled={tipLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={tipLoading}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {tipLoading ? (
                      <div className="flex items-center justify-center">
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Sending...
                      </div>
                    ) : (
                      'Send Tip'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ProfileDetailsView; 