import { useEffect, useState } from 'react';
import { backendService } from '../services/backendService';
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
          comments: Array.isArray(post.comments)
            ? post.comments
            : Array.from(post.comments as BigUint64Array),
          hashtags: post.hashtags,
          reshare_count: post.reshare_count
        }));
        setPosts(formattedPosts);
        
        // Check which posts the user has liked
        if (authState.isAuthenticated) {
          const likedPostIds = new Set<string>();
          for (const post of formattedPosts) {
            if (post.likes.includes(authState.principal || '')) {
              likedPostIds.add(post.id.toString());
            }
          }
          setLikedPosts(likedPostIds);
        }
      }
    } catch (err) {
      console.error('Error fetching posts:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFollowers = async () => {
    try {
      const result = await backendService.getFollowers(userId);
      if (Array.isArray(result)) {
        setFollowers(result.map(principalToString));
      }
    } catch (err) {
      console.error('Error fetching followers:', err);
    }
  };

  const fetchFollowing = async () => {
    try {
      const result = await backendService.getFollowing(userId);
      if (Array.isArray(result)) {
        setFollowing(result.map(principalToString));
      }
    } catch (err) {
      console.error('Error fetching following:', err);
    }
  };

  const checkIfFollowing = async () => {
    if (!authState.isAuthenticated) return;
    
    try {
      const result = await backendService.getFollowing(authState.principal || '');
      if (Array.isArray(result)) {
        const followingIds = result.map(principalToString);
        setIsFollowing(followingIds.includes(userId));
      }
    } catch (err) {
      console.error('Error checking if following:', err);
    }
  };

  const handleFollow = async () => {
    if (!authState.isAuthenticated) {
      setError('Please log in to follow users');
      return;
    }
    
    try {
      setLoadingFollow(true);
      
      if (isFollowing) {
        await backendService.unfollowUser(Principal.fromText(userId));
        setIsFollowing(false);
      } else {
        await backendService.followUser(Principal.fromText(userId));
        setIsFollowing(true);
      }
      
      // Refresh followers count
      fetchFollowers();
    } catch (err) {
      console.error('Error following/unfollowing user:', err);
      setError('Failed to follow/unfollow user');
    } finally {
      setLoadingFollow(false);
    }
  };

  const handleMessage = async () => {
    setLoadingMessage(true);
    try {
      await backendService.sendMessage(userId, `Hello ${profile?.username || ''}!`);
      if (onNavigateToChat) {
        onNavigateToChat();
      } else {
        onClose();
      }
      console.log('Message sent successfully! Navigate to the chat tab to continue the conversation.');
    } catch (err) {
      setError('Failed to start conversation');
    } finally {
      setLoadingMessage(false);
    }
  };

  const handleLike = async (postId: string) => {
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
      
      if (result && 'Ok' in result) {
        setComment('');
        setCommentPostId(null);
        fetchPosts();
      } else if (result && 'Err' in result) {
        setError(result.Err);
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
    if (!bio || bio.length === 0) return 'No bio provided';
    return bio.join(' ');
  };

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1000000);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const handleViewUser = (userId: string) => {
    window.location.reload();
  };

  const isReshare = (post: Post) => isObjectWithReshare(post.post_type);

  const getOriginalAuthor = (post: Post) => {
    if (isObjectWithReshare(post.post_type)) {
      return principalToString(post.post_type.Reshare.original_author);
    }
    return null;
  };

  return (
    <div className="bg-background-card rounded-xl p-6 shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold">Profile</h3>
        <Button onClick={onClose} className="bg-secondary-700 hover:bg-secondary-600">
          Close
        </Button>
      </div>
      
      {error && <div className="bg-error/20 text-error rounded-lg p-4 mb-4">{error}</div>}
      
      {loading && !profile ? (
        <div className="text-text-secondary">Loading profile...</div>
      ) : !profile ? (
        <div className="text-text-secondary">Profile not found</div>
      ) : (
        <div>
          <div className="mb-6">
            <div className="flex items-center gap-4">
              {/* Profile Avatar */}
              <div className="w-16 h-16 rounded-full bg-secondary-800 overflow-hidden">
                <img src={getAvatarUrl(profile)} alt={profile.username} className="w-full h-full object-cover" />
              </div>
              {/* Profile Info */}
              <div className="flex-1">
                <div className="text-xl font-bold">{profile.username}</div>
                <div className="text-text-secondary mb-2">{formatBio(profile.bio)}</div>
                <div className="text-xs text-text-muted mb-2">Principal: {profile.id}</div>
                <div className="flex gap-4 text-sm">
                  <div><span className="font-bold">{posts.length}</span> posts</div>
                  <div><span className="font-bold">{followers.length}</span> followers</div>
                  <div><span className="font-bold">{following.length}</span> following</div>
                </div>
              </div>
            </div>
            {/* Action Buttons */}
            {authState.isAuthenticated && authState.principal !== profile.id && (
              <div className="flex gap-2 mt-4">
                <Button 
                  onClick={handleFollow} 
                  disabled={loadingFollow} 
                  className={isFollowing ? 'bg-secondary-700 hover:bg-secondary-600' : 'bg-primary hover:bg-primary-600'}
                >
                  {isFollowing ? 'Unfollow' : 'Follow'}
                </Button>
                <Button 
                  onClick={handleMessage} 
                  disabled={loadingMessage} 
                  className="bg-accent hover:bg-accent-hover"
                >
                  Message
                </Button>
              </div>
            )}
          </div>
          
          {/* Tab Navigation */}
          <div className="flex border-b border-secondary-800 mb-4">
            <button
              onClick={() => setActiveTab('posts')}
              className={`px-4 py-2 ${activeTab === 'posts' ? 'text-primary border-b-2 border-primary' : 'text-text-secondary'}`}
            >
              Posts
            </button>
            <button
              onClick={() => setActiveTab('followers')}
              className={`px-4 py-2 ${activeTab === 'followers' ? 'text-primary border-b-2 border-primary' : 'text-text-secondary'}`}
            >
              Followers
            </button>
            <button
              onClick={() => setActiveTab('following')}
              className={`px-4 py-2 ${activeTab === 'following' ? 'text-primary border-b-2 border-primary' : 'text-text-secondary'}`}
            >
              Following
            </button>
          </div>
          
          {/* Tab Content */}
          {activeTab === 'posts' && (
            <div className="space-y-4">
              {posts.length === 0 ? (
                <div className="text-text-secondary text-center py-4">No posts yet</div>
              ) : (
                posts.map(post => (
                  <div key={post.id.toString()} className="border-b border-secondary-800 pb-4 mb-4 last:border-b-0">
                    <div className="mb-2">
                      <div className="text-text-secondary text-sm">{formatDate(post.created_at)}</div>
                      <div className="my-2">{post.content}</div>
                      {post.hashtags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2">
                          {post.hashtags.map((tag, index) => (
                            <span key={index} className="text-primary text-sm">#{tag}</span>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-4 text-sm text-text-secondary">
                        <div>{post.likes.length} likes</div>
                        <div>{post.comments.length} comments</div>
                      </div>
                    </div>
                    
                    {/* Post Actions */}
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleLike(post.id.toString())}
                        className={likedPosts.has(post.id.toString()) ? 'bg-primary' : 'bg-secondary-700'}
                      >
                        {likedPosts.has(post.id.toString()) ? 'Liked' : 'Like'}
                      </Button>
                      <Button
                        onClick={() => {
                          const id = post.id;
                          if (typeof id === 'string' || typeof id === 'number' || typeof id === 'bigint') {
                            setCommentPostId(id.toString());
                          } else {
                            setCommentPostId(null);
                          }
                        }}
                        className="bg-secondary-700"
                      >
                        Comment
                      </Button>
                    </div>
                    
                    {/* Comment Form */}
                    {commentPostId === post.id.toString() && (
                      <div className="mt-3 flex gap-2">
                        <input
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          placeholder="Write a comment..."
                          className="flex-1 bg-background-input rounded-lg border border-secondary-700 p-2 text-text"
                        />
                        <Button
                          onClick={() => handleComment(post.id.toString())}
                          disabled={!comment.trim()}
                          className="bg-primary"
                        >
                          Post
                        </Button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
          
          {activeTab === 'followers' && (
            <div className="space-y-3">
              {followers.length === 0 ? (
                <div className="text-text-secondary text-center py-4">No followers yet</div>
              ) : (
                followers.map(followerId => (
                  <div key={followerId} className="flex justify-between items-center p-3 bg-background-light rounded-lg">
                    <div>{followerId.slice(0, 8)}...</div>
                    <Button onClick={() => handleViewUser(followerId)} className="bg-secondary-700">
                      View
                    </Button>
                  </div>
                ))
              )}
            </div>
          )}
          
          {activeTab === 'following' && (
            <div className="space-y-3">
              {following.length === 0 ? (
                <div className="text-text-secondary text-center py-4">Not following anyone</div>
              ) : (
                following.map(followingId => (
                  <div key={followingId} className="flex justify-between items-center p-3 bg-background-light rounded-lg">
                    <div>{followingId.slice(0, 8)}...</div>
                    <Button onClick={() => handleViewUser(followingId)} className="bg-secondary-700">
                      View
                    </Button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProfileDetailsView; 