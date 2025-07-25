import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Hash, 
  MessageSquare, 
  Heart, 
  User, 
  Calendar,
  Search,
  Sparkles
} from 'lucide-react';
import { backendService } from '../services/backendService';
import { Button } from '../components';
import { useAuth } from '../context/AuthContext';
import { principalToString } from '../utils/principal';
import type { UserProfile as BackendUserProfile, Post as BackendPost } from '../../../declarations/backend/backend.did';

interface ExploreViewProps {
  onViewProfile?: (userId: string) => void;
  searchQuery?: string;
}

interface UserProfile {
  id: string;
  username: string;
  bio: string[];
  avatar_url: string[];
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

const ExploreView = ({ onViewProfile, searchQuery = '' }: ExploreViewProps) => {
  const { authState } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [following, setFollowing] = useState<Set<string>>(new Set());
  const [loadingFollow, setLoadingFollow] = useState<string | null>(null);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [resharedPosts, setResharedPosts] = useState<Set<string>>(new Set());
  const [userProfiles, setUserProfiles] = useState<Record<string, UserProfile>>({});
  const [activeTab, setActiveTab] = useState<'users' | 'posts'>('posts');

  useEffect(() => {
    if (searchQuery) {
      performSearch(searchQuery);
    } else {
      // Load trending content when no search
      loadTrendingContent();
    }
  }, [searchQuery]);

  const performSearch = async (query: string) => {
    try {
      setLoading(true);
      setError(null);

      // Search for both users and posts
      const [usersResult, postsResult] = await Promise.all([
        backendService.searchUsers(query),
        backendService.getAllPosts()
      ]);

      // Process users
      if (Array.isArray(usersResult)) {
        const users = usersResult.map((user: BackendUserProfile) => ({
          id: principalToString(user.id),
          username: user.username,
          bio: user.bio,
          avatar_url: user.avatar_url
        }));
        setUsers(users);
      } else {
        setUsers([]);
      }

      // Process posts
      if (Array.isArray(postsResult)) {
        const formattedPosts: Post[] = postsResult.map((post: BackendPost) => ({
          ...post,
          author: principalToString(post.author),
        }));

        // Filter posts based on search query
        const queryLower = query.toLowerCase();
        const filteredPosts = formattedPosts.filter(post => {
          const content = getTextContent(post.content).toLowerCase();
          const hashtags = post.hashtags.join(' ').toLowerCase();
          const author = getUsernameForId(post.author).toLowerCase();
          
          return content.includes(queryLower) || 
                 hashtags.includes(queryLower) || 
                 author.includes(queryLower) ||
                 (query.startsWith('#') && hashtags.includes(query.slice(1))) ||
                 (query.startsWith('@') && author.includes(query.slice(1)));
        });

        setPosts(filteredPosts);
        
        // Fetch user profiles for post authors
        const uniqueAuthors = [...new Set(filteredPosts.map(post => post.author))];
        await fetchUserProfiles(uniqueAuthors);
        
        // Check which posts the user has liked
        if (authState.isAuthenticated) {
          const likedSet = new Set<string>();
          const resharedSet = new Set<string>();
          
          filteredPosts.forEach(post => {
            if (post.likes.some(like => principalToString(like) === authState.principal)) {
              likedSet.add(post.id.toString());
            }
          });
          
          setLikedPosts(likedSet);
          setResharedPosts(resharedSet);
        }
      }

      // Get following list if authenticated
      if (authState.isAuthenticated) {
        const followingList = await backendService.getFollowing(authState.principal || '');
        if (Array.isArray(followingList)) {
          const followingIds = new Set(followingList.map(principalToString));
          setFollowing(followingIds);
        }
      }
    } catch (err) {
      console.error('Error performing search:', err);
      setError('Failed to perform search');
    } finally {
      setLoading(false);
    }
  };

  const loadTrendingContent = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load trending posts and users
      const [postsResult, usersResult] = await Promise.all([
        backendService.getAllPosts(),
        backendService.searchUsers('')
      ]);

      // Process posts (show recent posts as trending)
      if (Array.isArray(postsResult)) {
        const formattedPosts: Post[] = postsResult.map((post: BackendPost) => ({
          ...post,
          author: principalToString(post.author),
        }));
        
        // Sort by creation date (newest first)
        const sortedPosts = formattedPosts.sort((a, b) => 
          Number(b.created_at) - Number(a.created_at)
        );
        
        setPosts(sortedPosts.slice(0, 20)); // Show top 20 posts
        
        // Fetch user profiles
        const uniqueAuthors = [...new Set(sortedPosts.slice(0, 20).map(post => post.author))];
        await fetchUserProfiles(uniqueAuthors);
        
        // Check liked posts
        if (authState.isAuthenticated) {
          const likedSet = new Set<string>();
          const resharedSet = new Set<string>();
          
          sortedPosts.slice(0, 20).forEach(post => {
            if (post.likes.some(like => principalToString(like) === authState.principal)) {
              likedSet.add(post.id.toString());
            }
          });
          
          setLikedPosts(likedSet);
          setResharedPosts(resharedSet);
        }
      }

      // Process users
      if (Array.isArray(usersResult)) {
        const users = usersResult.map((user: BackendUserProfile) => ({
          id: principalToString(user.id),
          username: user.username,
          bio: user.bio,
          avatar_url: user.avatar_url
        }));
        setUsers(users.slice(0, 10)); // Show top 10 users
      }

      // Get following list
      if (authState.isAuthenticated) {
        const followingList = await backendService.getFollowing(authState.principal || '');
        if (Array.isArray(followingList)) {
          const followingIds = new Set(followingList.map(principalToString));
          setFollowing(followingIds);
        }
      }
    } catch (err) {
      console.error('Error loading trending content:', err);
      setError('Failed to load trending content');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfiles = async (userIds: string[]) => {
    const profiles: Record<string, UserProfile> = {};
    for (const userId of userIds) {
      try {
        const result = await backendService.getUserProfile(userId);
        if ('Ok' in result) {
          const profile = result.Ok;
          profiles[userId] = { ...profile, id: principalToString(profile.id) };
        }
      } catch (err) {
        // ignore
      }
    }
    setUserProfiles(profiles);
  };

  const handleFollow = async (userId: string) => {
    if (!authState.isAuthenticated) {
      setError('Please log in to follow users');
      return;
    }

    try {
      setLoadingFollow(userId);
      const isFollowing = following.has(userId);

      if (isFollowing) {
        await backendService.unfollowUser(userId);
        setFollowing(prev => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });
      } else {
        await backendService.followUser(userId);
        setFollowing(prev => new Set([...prev, userId]));
      }
    } catch (err) {
      console.error('Error following/unfollowing user:', err);
      setError('Failed to follow/unfollow user');
    } finally {
      setLoadingFollow(null);
    }
  };

  const handleLikePost = async (postId: string) => {
    if (!authState.isAuthenticated) return;

    try {
      const result = await backendService.likePost(BigInt(postId));
      if (isPlainObject(result) && 'Ok' in result) {
        setLikedPosts(prev => {
          const newSet = new Set(prev);
          if (newSet.has(postId)) {
            newSet.delete(postId);
          } else {
            newSet.add(postId);
          }
          return newSet;
        });
      }
    } catch (err) {
      console.error('Error liking post:', err);
    }
  };

  const handleViewProfile = (userId: string) => {
    if (onViewProfile) {
      onViewProfile(userId);
    }
  };

  const getUsernameForId = (userId: string) => {
    return userProfiles[userId]?.username || userId.slice(0, 8);
  };

  const getAvatarUrl = (userId: string) => {
    return userProfiles[userId]?.avatar_url[0] || '';
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

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <div className="flex items-center justify-center gap-3">
          <div className="w-12 h-12 bg-gradient rounded-xl flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold gradient-text">
            {searchQuery ? 'Search Results' : 'Explore'}
          </h1>
        </div>
        {searchQuery && (
          <p className="text-text-secondary">
            Showing results for "{searchQuery}"
          </p>
        )}
      </motion.div>

      {/* Error Display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-error/10 border border-error/20 text-error rounded-xl p-4"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <div className="flex space-x-1 bg-card rounded-xl p-1 border border-border">
        <button
          onClick={() => setActiveTab('posts')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all duration-300 ${
            activeTab === 'posts'
              ? 'bg-accent text-white shadow-lg'
              : 'text-text-secondary hover:text-text hover:bg-background'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Posts ({posts.length})
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all duration-300 ${
            activeTab === 'users'
              ? 'bg-accent text-white shadow-lg'
              : 'text-text-secondary hover:text-text hover:bg-background'
          }`}
        >
          <Users className="w-4 h-4" />
          Users ({users.length})
        </button>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center py-12"
          >
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
              <span className="text-text-secondary">Loading...</span>
            </div>
          </motion.div>
        ) : activeTab === 'posts' ? (
          <motion.div
            key="posts"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            {posts.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="w-12 h-12 text-text-secondary mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-text mb-2">No posts found</h3>
                <p className="text-text-secondary">
                  {searchQuery ? 'Try adjusting your search terms' : 'No trending posts available'}
                </p>
              </div>
            ) : (
              posts.map((post, index) => (
                <motion.div
                  key={post.id.toString()}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-all duration-300"
                >
                  {/* Reshare Header */}
                  {isReshare(post) && (
                    <div className="bg-background/50 px-4 py-2 rounded-lg text-text-secondary text-sm flex items-center gap-2 mb-4">
                      <Hash className="w-4 h-4" />
                      <span>Reshared by {getUsernameForId(post.author)}</span>
                    </div>
                  )}
                  
                  {/* Post Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-gradient overflow-hidden">
                      {getAvatarUrl(post.author) ? (
                        <img 
                          src={getAvatarUrl(post.author)} 
                          alt={getUsernameForId(post.author)}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white font-bold text-sm">
                          {getUsernameForId(post.author).slice(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-text">
                        {getUsernameForId(post.author)}
                      </div>
                      <div className="text-sm text-text-secondary flex items-center gap-2">
                        <Calendar className="w-3 h-3" />
                        {formatDate(post.created_at)}
                      </div>
                    </div>
                  </div>

                  {/* Post Content */}
                  <div className="text-text mb-4 whitespace-pre-wrap leading-relaxed">
                    {getTextContent(post.content)}
                  </div>
                  
                  {/* Post Image */}
                  {(() => {
                    const imageData = extractImageFromContent(post.content);
                    return imageData ? (
                      <div className="mb-4">
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
                    <div className="flex flex-wrap gap-2 mb-4">
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

                  {/* Post Actions */}
                  <div className="flex justify-between pt-4 border-t border-border">
                    <button 
                      onClick={() => handleLikePost(post.id.toString())}
                      className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${
                        likedPosts.has(post.id.toString()) 
                          ? 'text-accent' 
                          : 'text-text-secondary hover:text-text'
                      }`}
                    >
                      <Heart className={`w-5 h-5 ${likedPosts.has(post.id.toString()) ? 'fill-current' : ''}`} />
                      <span>{post.likes.length > 0 ? post.likes.length : ''}</span>
                    </button>
                    <div className="flex items-center gap-4 text-text-secondary text-sm">
                      <div className="flex items-center gap-1">
                        <MessageSquare className="w-4 h-4" />
                        <span>{post.comments.length}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Hash className="w-4 h-4" />
                        <span>{post.reshare_count}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        ) : (
          <motion.div
            key="users"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            {users.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-text-secondary mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-text mb-2">No users found</h3>
                <p className="text-text-secondary">
                  {searchQuery ? 'Try adjusting your search terms' : 'No users available'}
                </p>
              </div>
            ) : (
              users.map((user, index) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex items-center justify-between">
                    <div
                      className="cursor-pointer flex-1"
                      onClick={() => handleViewProfile(user.id)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient overflow-hidden">
                          {user.avatar_url[0] ? (
                            <img 
                              src={user.avatar_url[0]} 
                              alt={user.username}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white font-bold">
                              {user.username.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-lg text-text">{user.username}</div>
                          {user.bio && user.bio.length > 0 && (
                            <p className="text-text-secondary">{user.bio[0]}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      {onViewProfile && (
                        <Button
                          onClick={() => handleViewProfile(user.id)}
                          className="bg-background border border-border hover:border-accent/40 text-text hover:text-accent"
                        >
                          View Profile
                        </Button>
                      )}
                      {authState.isAuthenticated && user.id !== authState.principal && (
                        <Button
                          onClick={() => handleFollow(user.id)}
                          disabled={loadingFollow === user.id}
                          className={following.has(user.id) 
                            ? 'bg-background border border-border hover:border-accent/40 text-text hover:text-accent' 
                            : 'bg-accent hover:bg-accent/80 text-white'
                          }
                        >
                          {loadingFollow === user.id ? '...' : (following.has(user.id) ? 'Following' : 'Follow')}
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ExploreView; 