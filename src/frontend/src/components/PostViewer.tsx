import { useState, useEffect, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Heart, 
  MessageCircle, 
  Repeat2, 
  Send, 
  MoreHorizontal,
  User,
  Calendar,
  Hash
} from 'lucide-react';
import { backendService } from '../services/backendService';
import { Button } from './';
import { useAuth } from '../context/AuthContext';
import { principalToString } from '../utils/principal';
import type { Post as BackendPost, Comment as BackendComment } from '../../../declarations/backend/backend.did';

interface Post extends Omit<BackendPost, 'author'> {
  author: string;
}

interface Comment extends Omit<BackendComment, 'author'> {
  author: string;
}

interface UserProfile {
  id: string;
  username: string;
  bio: string[];
  avatar_url: string[];
}

interface PostViewerProps {
  post: Post;
  onClose: () => void;
  onLikePost: (postId: string) => void;
  onResharePost: (postId: string) => void;
  onViewProfile: (userId: string) => void;
  likedPosts: Set<string>;
  resharedPosts: Set<string>;
  userProfiles: Record<string, UserProfile>;
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

const PostViewer: React.FC<PostViewerProps> = ({
  post,
  onClose,
  onLikePost,
  onResharePost,
  onViewProfile,
  likedPosts,
  resharedPosts,
  userProfiles
}) => {
  const { authState } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(true);
  const [postingComment, setPostingComment] = useState(false);
  const [commentUserProfiles, setCommentUserProfiles] = useState<Record<string, UserProfile>>({});

  useEffect(() => {
    fetchComments();
  }, [post.id]);

  const fetchComments = async () => {
    try {
      setLoadingComments(true);
      const result = await backendService.getComments(post.id);
      const formattedComments: Comment[] = result.map((comment: BackendComment) => ({
        ...comment,
        author: principalToString(comment.author),
      }));
      setComments(formattedComments);
      
      // Fetch user profiles for comment authors
      const uniqueAuthors = [...new Set(formattedComments.map(comment => comment.author))];
      const profiles: Record<string, UserProfile> = {};
      for (const author of uniqueAuthors) {
        try {
          const profileResult = await backendService.getUserProfile(author);
          if ('Ok' in profileResult) {
            const profile = profileResult.Ok;
            profiles[author] = { ...profile, id: principalToString(profile.id) };
          }
        } catch (err) {
          // ignore
        }
      }
      setCommentUserProfiles(profiles);
    } catch (err) {
      console.error('Error fetching comments:', err);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !authState.isAuthenticated) return;

    try {
      setPostingComment(true);
      const result = await backendService.addComment(post.id, newComment);
      if (result) {
        setNewComment('');
        // Refresh comments
        await fetchComments();
      }
    } catch (err) {
      console.error('Error adding comment:', err);
    } finally {
      setPostingComment(false);
    }
  };

  const getUsernameForId = (userId: string) => {
    return userProfiles[userId]?.username || commentUserProfiles[userId]?.username || userId.slice(0, 8);
  };

  const getAvatarUrl = (userId: string) => {
    return userProfiles[userId]?.avatar_url[0] || commentUserProfiles[userId]?.avatar_url[0] || '';
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

  function isPlainObject(x: unknown): x is Record<string, unknown> {
    return (
      typeof x === 'object' &&
      x !== null &&
      !Array.isArray(x)
    );
  }

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
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-background rounded-xl max-w-4xl w-full max-h-[95vh] flex flex-col border border-border shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border bg-card">
            <h2 className="text-lg sm:text-xl font-semibold text-text">Post Details</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-background transition-colors"
            >
              <X className="w-5 h-5 text-text-secondary" />
            </button>
          </div>

          {/* Post Content */}
          <div className="p-4 sm:p-6 border-b border-border flex-shrink-0 overflow-y-auto max-h-[60vh] bg-background">
            {/* Reshare Header */}
            {isReshare(post) && (
              <div className="flex items-center gap-2 text-text-secondary text-sm mb-4 p-3 bg-background/50 rounded-lg">
                <Repeat2 className="w-4 h-4" />
                <span>{getUsernameForId(post.author)} reshared</span>
              </div>
            )}
            
            {/* Author Info */}
            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={() => onViewProfile(isReshare(post) ? getOriginalAuthor(post) || post.author : post.author)}
                className="w-12 h-12 rounded-full bg-gradient overflow-hidden hover:opacity-80 transition-opacity cursor-pointer"
              >
                {getAvatarUrl(isReshare(post) ? getOriginalAuthor(post) || post.author : post.author) ? (
                  <img 
                    src={getAvatarUrl(isReshare(post) ? getOriginalAuthor(post) || post.author : post.author)} 
                    alt={getUsernameForId(post.author)} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white font-bold">
                    {getUsernameForId(isReshare(post) ? getOriginalAuthor(post) || post.author : post.author).slice(0, 2).toUpperCase()}
                  </div>
                )}
              </button>
              <div className="flex-1">
                <button
                  onClick={() => onViewProfile(isReshare(post) ? getOriginalAuthor(post) || post.author : post.author)}
                  className="font-semibold text-text hover:text-accent transition-colors cursor-pointer text-left"
                >
                  {getUsernameForId(isReshare(post) ? getOriginalAuthor(post) || post.author : post.author)}
                </button>
                <div className="flex items-center gap-2 text-text-secondary text-sm">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(post.created_at)}</span>
                </div>
              </div>
            </div>
            
            {/* Post Text */}
            <div className="text-text mb-4 whitespace-pre-wrap leading-relaxed text-base font-medium">
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
                    className="max-w-full max-h-64 rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity"
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
                    className="flex items-center gap-1 text-accent text-sm hover:underline cursor-pointer"
                  >
                    <Hash className="w-3 h-3" />
                    {tag}
                  </span>
                ))}
              </div>
            )}
            
            {/* Post Stats */}
                          <div className="flex items-center gap-4 sm:gap-6 text-text-secondary text-sm py-3 border-t border-border bg-background/30">
              <div className="flex items-center gap-1">
                <Heart className="w-4 h-4" />
                <span>{post.likes.length} likes</span>
              </div>
              <div className="flex items-center gap-1">
                <MessageCircle className="w-4 h-4" />
                <span>{comments.length} comments</span>
              </div>
              <div className="flex items-center gap-1">
                <Repeat2 className="w-4 h-4" />
                <span>{post.reshare_count} reshares</span>
              </div>
            </div>
            
            {/* Post Actions */}
            <div className="flex justify-between pt-3">
              <button 
                onClick={() => onLikePost(post.id.toString())}
                className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${
                  likedPosts.has(post.id.toString()) 
                    ? 'text-accent' 
                    : 'text-text-secondary hover:text-text'
                }`}
              >
                <Heart className={`w-5 h-5 ${likedPosts.has(post.id.toString()) ? 'fill-current' : ''}`} />
                <span className="text-sm">Like</span>
              </button>
              
              <button 
                className="flex items-center gap-2 p-2 rounded-lg text-text-secondary hover:text-text transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
                <span className="text-sm">Comment</span>
              </button>
              
              <button 
                onClick={() => onResharePost(post.id.toString())}
                className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${
                  resharedPosts.has(post.id.toString()) 
                    ? 'text-accent' 
                    : 'text-text-secondary hover:text-text'
                }`}
                disabled={post.author === authState.principal}
              >
                <Repeat2 className={`w-5 h-5 ${resharedPosts.has(post.id.toString()) ? 'fill-current' : ''}`} />
                <span className="text-sm">Reshare</span>
              </button>
              
              <button className="flex items-center gap-2 p-2 rounded-lg text-text-secondary hover:text-text transition-colors">
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>
          </div>

                      {/* Comments Section */}
            <div className="flex-1 flex flex-col min-h-0 bg-background">
            {/* Comment Form */}
            {authState.isAuthenticated && (
              <div className="p-4 border-b border-border flex-shrink-0 bg-card">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient overflow-hidden flex-shrink-0">
                    {getAvatarUrl(authState.principal || '') ? (
                      <img 
                        src={getAvatarUrl(authState.principal || '')} 
                        alt="Your avatar" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white font-bold text-xs">
                        {authState.principal?.slice(0, 2).toUpperCase() || 'U'}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 flex gap-2">
                    <input
                      value={newComment}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setNewComment(e.target.value)}
                      placeholder="Write a comment..."
                      className="flex-1 bg-card border border-border rounded-lg px-3 py-2 text-text focus:border-accent focus:outline-none placeholder-text-secondary text-sm"
                      onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                    />
                    <Button 
                      onClick={handleAddComment}
                      disabled={postingComment || !newComment.trim()}
                      className="bg-accent hover:bg-accent/80 text-white px-4 py-2"
                    >
                      {postingComment ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto p-4 bg-background/50">
              {loadingComments ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent"></div>
                  <span className="ml-3 text-text-secondary">Loading comments...</span>
                </div>
              ) : comments.length === 0 ? (
                <div className="text-center py-8 text-text-secondary">
                  <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No comments yet</p>
                  <p className="text-sm text-text-secondary mt-1">Be the first to comment!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <motion.div
                      key={comment.id.toString()}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex gap-3"
                    >
                      <button
                        onClick={() => onViewProfile(comment.author)}
                        className="w-8 h-8 rounded-full bg-gradient overflow-hidden flex-shrink-0 hover:opacity-80 transition-opacity cursor-pointer"
                      >
                        {getAvatarUrl(comment.author) ? (
                          <img 
                            src={getAvatarUrl(comment.author)} 
                            alt={getUsernameForId(comment.author)} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white font-bold text-xs">
                            {getUsernameForId(comment.author).slice(0, 2).toUpperCase()}
                          </div>
                        )}
                      </button>
                      <div className="flex-1">
                        <div className="bg-card rounded-lg p-3 border border-border">
                          <div className="flex items-center gap-2 mb-1">
                            <button
                              onClick={() => onViewProfile(comment.author)}
                              className="font-semibold text-text hover:text-accent transition-colors cursor-pointer"
                            >
                              {getUsernameForId(comment.author)}
                            </button>
                            <span className="text-text-secondary text-sm">
                              {formatDate(comment.created_at)}
                            </span>
                          </div>
                          <p className="text-text text-sm">{comment.content}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PostViewer; 