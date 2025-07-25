import { useEffect, useState, ChangeEvent, FormEvent, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, 
  MessageCircle, 
  Repeat2, 
  Send, 
  MoreHorizontal,
  Home,
  Sparkles,
  Hash,
  User,
  Calendar,
  Image,
  Smile,
  X
} from 'lucide-react';
import { backendService } from '../services/backendService';
import { Button } from '../components';
import PostViewer from '../components/PostViewer';
import { useAuth } from '../context/AuthContext';
import { principalToString } from '../utils/principal';
import type { Post as BackendPost } from '../../../declarations/backend/backend.did';

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

interface FeedViewProps {
  searchQuery?: string;
}

const FeedView: React.FC<FeedViewProps> = ({ searchQuery = '' }) => {
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
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchPosts();
  }, [authState.isAuthenticated]);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showEmojiPicker) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker]);

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
        const likedSet = new Set<string>();
        const resharedSet = new Set<string>();
        
        // For now, we'll check based on the likes array
        // In a real implementation, you'd have a separate endpoint to get user's liked posts
        formattedPosts.forEach(post => {
          if (post.likes.some(like => principalToString(like) === authState.principal)) {
            likedSet.add(post.id.toString());
          }
        });
        
        setLikedPosts(likedSet);
        setResharedPosts(resharedSet);
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

  const handleCreatePost = async (e: FormEvent) => {
    e.preventDefault();
    if ((!newPost.trim() && !selectedImage) || !authState.isAuthenticated) return;
    
    try {
      setPosting(true);
      
      // Create post content with image data if available
      let postContent = newPost;
      if (selectedImage && imagePreview) {
        // Store image data temporarily (in a real app, this would be uploaded to backend)
        const imageData = {
          dataUrl: imagePreview,
          fileName: selectedImage.name,
          timestamp: Date.now()
        };
        postContent += `\n[IMAGE:${JSON.stringify(imageData)}]`;
      }
      
      const result = await backendService.createPost(postContent);
      
      if (isPlainObject(result) && 'Ok' in result) {
        setNewPost('');
        setSelectedImage(null);
        setImagePreview(null);
        setShowEmojiPicker(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        await fetchPosts(); // Refresh posts
      } else if (isPlainObject(result) && 'Err' in result) {
        const errorMsg = (result as any).Err;
        setError(typeof errorMsg === 'string' ? errorMsg : 'Failed to create post');
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
      await fetchPosts(); // Refresh posts to get updated like counts
    } catch (err) {
      console.error('Error liking/unliking post:', err);
      setError('Failed to like/unlike post');
    }
  };

  const handleAddComment = async (postId: string) => {
    if (!commentText.trim() || !authState.isAuthenticated) return;
    
    try {
      const result = await backendService.addComment(BigInt(postId), commentText);
      if (isPlainObject(result) && 'Ok' in result) {
        setCommentText('');
        setCommentingPostId(null);
        await fetchPosts(); // Refresh posts to get updated comment counts
      } else if (isPlainObject(result) && 'Err' in result) {
        const errorMsg = (result as any).Err;
        setError(typeof errorMsg === 'string' ? errorMsg : 'Failed to add comment');
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
      await backendService.resharePost(BigInt(postId));
      setResharedPosts(prev => new Set([...prev, postId]));
      await fetchPosts(); // Refresh posts to get updated reshare counts
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

  const handleImageSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setError('Image size must be less than 2MB');
        return;
      }
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }
      
      setSelectedImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const addEmoji = (emoji: string) => {
    setNewPost(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const emojis = [
    '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
    '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
    '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩',
    '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣',
    '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬',
    '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗',
    '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😯', '😦', '😧',
    '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢',
    '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '💩', '👻', '💀',
    '☠️', '👽', '👾', '🤖', '😺', '😸', '😹', '😻', '😼', '😽'
  ];

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

  return (
    <div className="max-w-2xl mx-auto p-2 space-y-2">
     

      {/* Create Post Card */}
      {authState.isAuthenticated && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl p-6 border border-border"
        >
          <form onSubmit={handleCreatePost} className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient overflow-hidden flex-shrink-0">
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
                  className="w-full bg-background rounded-lg border border-border p-3 text-text-primary resize-none focus:border-accent focus:outline-none min-h-[100px]"
                />
                
                {/* Image Preview */}
                {imagePreview && (
                  <div className="mt-3 relative">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="max-w-full max-h-64 rounded-lg object-cover"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                {/* Image Upload Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-accent hover:bg-accent/10 rounded-lg transition-colors"
                  title="Add photo"
                >
                  <Image className="w-5 h-5" />
                </button>
                
                {/* Emoji Picker Button */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="p-2 text-accent hover:bg-accent/10 rounded-lg transition-colors"
                    title="Add emoji"
                  >
                    <Smile className="w-5 h-5" />
                  </button>
                  
                  {/* Emoji Picker */}
                  <AnimatePresence>
                    {showEmojiPicker && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 10 }}
                        className="absolute top-full left-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-lg z-10 w-80"
                      >
                        <div className="grid grid-cols-12 gap-1 max-h-48 overflow-y-auto">
                          {emojis.map((emoji, index) => (
                            <button
                              key={index}
                              type="button"
                              onClick={() => addEmoji(emoji)}
                              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-lg transition-colors"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                
                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </div>
              
              <Button 
                type="submit"
                disabled={posting || (!newPost.trim() && !selectedImage)}
                className="bg-accent hover:bg-accent/90 text-white px-6 py-2 rounded-lg transition-colors"
              >
                {posting ? 'Posting...' : 'Post'}
              </Button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Feed Toggle */}
      {authState.isAuthenticated && (
        <div className="flex justify-center">
          <div className="bg-card rounded-full p-1 inline-flex border border-border">
            <button 
              onClick={() => {
                setShowPersonalized(true);
                fetchPosts();
              }}
              className={`px-4 py-2 rounded-full text-sm transition-colors ${
                showPersonalized 
                  ? 'bg-accent text-white' 
                  : 'text-text-secondary hover:text-text-primary'
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
                  ? 'bg-accent text-white' 
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Latest
            </button>
          </div>
        </div>
      )}
      
      {/* Error Display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Posts List */}
      <div className="space-y-6">
        {loading && posts.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
            <span className="ml-3 text-text-secondary">Loading posts...</span>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <Sparkles className="w-16 h-16 mx-auto mb-4 text-text-secondary opacity-50" />
            <p className="text-text-secondary">No posts yet</p>
            <p className="text-sm text-text-muted mt-2">Start posting to see content here!</p>
          </div>
        ) : (
          posts.map((post, index) => (
            <motion.div
              key={post.id.toString()}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-card rounded-xl border border-border overflow-hidden hover:border-accent/20 transition-all duration-300 cursor-pointer"
              onClick={() => setSelectedPost(post)}
            >
              {/* Reshare Header */}
              {isReshare(post) && (
                <div className="bg-background px-6 py-2 text-text-secondary text-sm flex items-center gap-2 border-b border-border">
                  <Repeat2 className="w-4 h-4" />
                  <span>{getUsernameForId(post.author)} reshared</span>
                </div>
              )}
              
              {/* Post Content */}
              <div className="p-6">
                {/* Author Info */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient overflow-hidden">
                    <img 
                      src={getAvatarUrl(isReshare(post) ? getOriginalAuthor(post) || post.author : post.author)} 
                      alt={getUsernameForId(post.author)} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-text-primary">
                      {getUsernameForId(isReshare(post) ? getOriginalAuthor(post) || post.author : post.author)}
                    </div>
                    <div className="flex items-center gap-2 text-text-secondary text-sm">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(post.created_at)}</span>
                    </div>
                  </div>
                </div>
                
                {/* Post Text */}
                <div className="text-text-primary mb-4 whitespace-pre-wrap leading-relaxed">
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
                        className="max-w-full max-h-96 rounded-lg object-cover"
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
                        className="flex items-center gap-1 text-accent text-sm hover:underline cursor-pointer"
                      >
                        <Hash className="w-3 h-3" />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                
                {/* Post Actions */}
                <div className="flex justify-between pt-3 border-t border-border">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLikePost(post.id.toString());
                    }}
                    className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${
                      likedPosts.has(post.id.toString()) 
                        ? 'text-red-500' 
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    <Heart className={`w-5 h-5 ${likedPosts.has(post.id.toString()) ? 'fill-current' : ''}`} />
                    <span>{post.likes.length > 0 ? post.likes.length : ''}</span>
                  </button>
                  
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPost(post);
                    }}
                    className="flex items-center gap-2 p-2 rounded-lg text-text-secondary hover:text-text-primary transition-colors"
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span>{post.comments.length > 0 ? post.comments.length : ''}</span>
                  </button>
                  
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleResharePost(post.id.toString());
                    }}
                    className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${
                      resharedPosts.has(post.id.toString()) 
                        ? 'text-green-500' 
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                    disabled={post.author === authState.principal}
                  >
                    <Repeat2 className={`w-5 h-5 ${resharedPosts.has(post.id.toString()) ? 'fill-current' : ''}`} />
                    <span>{post.reshare_count > 0 ? post.reshare_count : ''}</span>
                  </button>
                  
                  <button 
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-2 p-2 rounded-lg text-text-secondary hover:text-text-primary transition-colors"
                  >
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Post Viewer Modal */}
      <AnimatePresence>
        {selectedPost && (
          <PostViewer
            post={selectedPost}
            onClose={() => setSelectedPost(null)}
            onLikePost={handleLikePost}
            onResharePost={handleResharePost}
            likedPosts={likedPosts}
            resharedPosts={resharedPosts}
            userProfiles={userProfiles}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default FeedView; 