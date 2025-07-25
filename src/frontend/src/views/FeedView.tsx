import { useEffect, useState, ChangeEvent, FormEvent } from 'react';
import { backendService } from '../services/backendService';
import { Button } from '../components';
import { useAuth } from '../context/AuthContext';
import { principalToString } from '../utils/principal';
import type { Post as BackendPost } from '../../../declarations/backend/backend.did';

// Simple version without heroicons for now
const HeartIcon = () => <span>❤️</span>;
const HeartIconSolid = () => <span>❤️</span>;
const ChatBubbleLeftIcon = () => <span>💬</span>;
const ArrowPathRoundedSquareIcon = () => <span>🔄</span>;
const PaperAirplaneIcon = () => <span>📤</span>;
const EllipsisHorizontalIcon = () => <span>⋯</span>;

interface Post extends Omit<BackendPost, 'author'> {
  author: string;
}

interface UserProfile {
  id: string;
  username: string;
  bio: string[];
  avatar_url: string[];
}

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

const isReshare = (post: Post) => isObjectWithReshare(post.post_type);

const getOriginalAuthor = (post: Post) => {
  if (isObjectWithReshare(post.post_type)) {
    return principalToString(post.post_type.Reshare.original_author);
  }
  return null;
};

const FeedView = () => {
  const { authState } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState('');
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userProfiles, setUserProfiles] = useState<Record<string, UserProfile>>({});
  const [commentText, setCommentText] = useState('');
  const [commentingPostId, setCommentingPostId] = useState<string | null>(null);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [resharedPosts, setResharedPosts] = useState<Set<string>>(new Set());
  const [showPersonalized, setShowPersonalized] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, [authState.isAuthenticated]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      
      let postsData: BackendPost[] = [];
      if (showPersonalized && authState.isAuthenticated) {
        // For now, use getAllPosts until getPersonalizedFeed is available
        const result = await backendService.getAllPosts();
        if (Array.isArray(result)) {
          postsData = result;
        }
      } else {
        const result = await backendService.getAllPosts();
        if (Array.isArray(result)) {
          postsData = result;
        }
      }
      
      const formattedPosts: Post[] = postsData.map((post: BackendPost) => ({
        ...post,
        author: principalToString(post.author),
      }));
      
      setPosts(formattedPosts);
      
      // Fetch user profiles for post authors
      const uniqueAuthors = [...new Set(formattedPosts.map(post => post.author))];
      await fetchUserProfiles(uniqueAuthors);
      
      // Check which posts the user has liked
      if (authState.isAuthenticated) {
        const likedPostIds = new Set<string>();
        const resharedPostIds = new Set<string>();
        
        for (const post of formattedPosts) {
          // Check likes
          if (post.likes.some(p => principalToString(p) === authState.principal)) {
            likedPostIds.add(post.id.toString());
          }
          
          // Check reshares - this is a simplification, will need to be updated
          if (isReshare(post)) {
            const originalAuthor = getOriginalAuthor(post);
            if (originalAuthor === authState.principal) {
              resharedPostIds.add(post.id.toString());
            }
          }
        }
        
        setLikedPosts(likedPostIds);
        setResharedPosts(resharedPostIds);
      }
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfiles = async (userIds: string[]) => {
    const profiles: Record<string, UserProfile> = {};
    
    for (const userId of userIds) {
      try {
        const profileResult = await backendService.getUserProfile(userId);
        if (profileResult && 'Ok' in profileResult) {
          const profile = profileResult.Ok;
          profiles[userId] = {
            id: principalToString(profile.id),
            username: profile.username,
            bio: profile.bio,
            avatar_url: profile.avatar_url
          };
        }
      } catch (err) {
        console.error(`Failed to fetch profile for ${userId}:`, err);
      }
    }
    
    setUserProfiles(prev => ({...prev, ...profiles}));
  };

  const handleCreatePost = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!authState.isAuthenticated) {
      setError('Please log in to create posts');
      return;
    }
    
    if (!newPost.trim()) {
      return;
    }
    
    try {
      setPosting(true);
      setError(null);
      
      const result = await backendService.createPost(newPost);
      
      if (result && 'Ok' in result) {
        setNewPost('');
        fetchPosts();
      } else if (result && 'Err' in result) {
        setError(result.Err);
      }
    } catch (err) {
      console.error('Error creating post:', err);
      setError('Failed to create post');
    } finally {
      setPosting(false);
    }
  };

  const handleLikePost = async (postId: string) => {
    if (!authState.isAuthenticated) {
      setError('Please log in to like posts');
      return;
    }
    
    try {
      const isLiked = likedPosts.has(postId);
      
      if (isLiked) {
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
      fetchPosts();
    } catch (err) {
      console.error('Error liking/unliking post:', err);
      setError('Failed to like/unlike post');
    }
  };

  const handleAddComment = async (postId: string) => {
    if (!authState.isAuthenticated) {
      setError('Please log in to comment');
      return;
    }
    
    if (!commentText.trim()) {
      return;
    }
    
    try {
      const result = await backendService.addComment(BigInt(postId), commentText);
      
      if (result && 'Ok' in result) {
        setCommentText('');
        setCommentingPostId(null);
        fetchPosts();
      } else if (result && 'Err' in result) {
        setError(result.Err);
      }
    } catch (err) {
      console.error('Error adding comment:', err);
      setError('Failed to add comment');
    }
  };

  const handleResharePost = async (postId: string) => {
    if (!authState.isAuthenticated) {
      setError('Please log in to reshare posts');
      return;
    }
    
    try {
      // For now, we'll just use a placeholder until resharePost is implemented
      console.log("Reshare functionality not yet implemented for post:", postId);
      setError("Reshare functionality not yet implemented");
    } catch (err) {
      console.error('Error resharing post:', err);
      setError('Failed to reshare post');
    }
  };

  const getUsernameForId = (userId: string) => {
    return userProfiles[userId]?.username || userId.slice(0, 8) + '...';
  };

  const getAvatarUrl = (userId: string) => {
    if (userProfiles[userId]?.avatar_url && userProfiles[userId].avatar_url.length > 0) {
      return userProfiles[userId].avatar_url[0];
    }
    // Return a default avatar
    return 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y';
  };

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1000000);
    const now = new Date();
    
    // If the post is from today, just show the time
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // If the post is from this week, show the day name and time
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 7) {
      return `${date.toLocaleDateString([], { weekday: 'short' })} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // Otherwise show the full date
    return date.toLocaleDateString([], { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit', 
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Create Post Card */}
      {authState.isAuthenticated && (
        <div className="bg-background-card rounded-xl p-6 shadow-md">
          <form onSubmit={handleCreatePost} className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-secondary-800 overflow-hidden flex-shrink-0">
                <img 
                  src={getAvatarUrl(authState.principal || '')} 
                  alt="Your avatar" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <textarea
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  placeholder="What's happening?"
                  className="w-full bg-background-input rounded-lg border border-secondary-700 p-3 text-text resize-none focus:border-primary focus:outline-none min-h-[100px]"
                />
              </div>
            </div>
            <div className="flex justify-between items-center">
              <div className="text-text-secondary text-sm">
                {/* Hashtag suggestions could go here */}
              </div>
              <Button 
                type="submit"
                disabled={posting || !newPost.trim()}
                className="bg-primary hover:bg-primary-600 text-white px-6 py-2 rounded-lg transition-colors"
              >
                {posting ? 'Posting...' : 'Post'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Feed Toggle */}
      {authState.isAuthenticated && (
        <div className="flex justify-center">
          <div className="bg-background-card rounded-full p-1 inline-flex">
            <button 
              onClick={() => {
                setShowPersonalized(true);
                fetchPosts();
              }}
              className={`px-4 py-2 rounded-full text-sm transition-colors ${
                showPersonalized 
                  ? 'bg-primary text-white' 
                  : 'text-text-secondary hover:text-text'
              }`}
            >
              For You
            </button>
            <button 
              onClick={() => {
                setShowPersonalized(false);
                fetchPosts();
              }}
              className={`px-4 py-2 rounded-full text-sm transition-colors ${
                !showPersonalized 
                  ? 'bg-primary text-white' 
                  : 'text-text-secondary hover:text-text'
              }`}
            >
              Latest
            </button>
          </div>
        </div>
      )}
      
      {/* Error Display */}
      {error && (
        <div className="bg-error/20 text-error rounded-lg p-4">
          {error}
        </div>
      )}
      
      {/* Posts List */}
      <div className="space-y-6">
        {loading && posts.length === 0 ? (
          <div className="bg-background-card rounded-xl p-6 text-center text-text-secondary">
            Loading posts...
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-background-card rounded-xl p-6 text-center text-text-secondary">
            No posts yet
          </div>
        ) : (
          posts.map((post) => (
            <div key={post.id.toString()} className="bg-background-card rounded-xl shadow-md overflow-hidden">
              {/* Reshare Header */}
              {isReshare(post) && (
                <div className="bg-background-light px-6 py-2 text-text-secondary text-sm flex items-center gap-2">
                  <ArrowPathRoundedSquareIcon />
                  <span>{getUsernameForId(post.author)} reshared</span>
                </div>
              )}
              
              {/* Post Content */}
              <div className="p-6">
                {/* Author Info */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-secondary-800 overflow-hidden">
                    <img 
                      src={getAvatarUrl(isReshare(post) ? getOriginalAuthor(post) || post.author : post.author)} 
                      alt={getUsernameForId(post.author)} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="font-medium">
                      {getUsernameForId(isReshare(post) ? getOriginalAuthor(post) || post.author : post.author)}
                    </div>
                    <div className="text-text-secondary text-sm">
                      {formatDate(post.created_at)}
                    </div>
                  </div>
                </div>
                
                {/* Post Text */}
                <div className="text-text mb-4 whitespace-pre-wrap">
                  {post.content}
                </div>
                
                {/* Hashtags */}
                {post.hashtags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
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
                
                {/* Post Stats */}
                <div className="flex items-center gap-6 text-text-secondary text-sm py-2 border-t border-secondary-800">
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
                </div>
                
                {/* Post Actions */}
                <div className="flex justify-between mt-3 border-t border-secondary-800 pt-3">
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
                  
                  <button 
                    onClick={() => {
                      const id = post.id;
                      if (typeof id === 'string' || typeof id === 'number' || typeof id === 'bigint') {
                        setCommentingPostId(id.toString());
                      } else {
                        setCommentingPostId(null);
                      }
                    }}
                    className="flex items-center gap-2 p-2 rounded-lg text-text-secondary hover:text-text"
                  >
                    <ChatBubbleLeftIcon />
                    <span>Comment</span>
                  </button>
                  
                  <button 
                    onClick={() => handleResharePost(post.id.toString())}
                    className={`flex items-center gap-2 p-2 rounded-lg ${
                      resharedPosts.has(post.id.toString()) 
                        ? 'text-primary' 
                        : 'text-text-secondary hover:text-text'
                    }`}
                    disabled={post.author === authState.principal}
                  >
                    <ArrowPathRoundedSquareIcon />
                    <span>Reshare</span>
                  </button>
                  
                  <button className="flex items-center gap-2 p-2 rounded-lg text-text-secondary hover:text-text">
                    <EllipsisHorizontalIcon />
                  </button>
                </div>
                
                {/* Comment Form */}
                {commentingPostId === post.id.toString() && (
                  <div className="mt-4 flex gap-2 items-center">
                    <input
                      value={commentText}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setCommentText(e.target.value)}
                      placeholder="Write a comment..."
                      className="flex-1 bg-background-input rounded-lg border border-secondary-700 p-3 text-text resize-none focus:border-primary focus:outline-none"
                    />
                    <Button 
                      onClick={() => handleAddComment(post.id.toString())}
                      disabled={!commentText.trim()}
                      className="bg-primary hover:bg-primary-600 text-white"
                    >
                      <PaperAirplaneIcon />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default FeedView; 