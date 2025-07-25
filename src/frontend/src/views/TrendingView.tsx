import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Hash, ArrowLeft, TrendingUp, MessageCircle, Heart } from 'lucide-react';
import { backendService } from '../services/backendService';
import { Button } from '../components';
import { principalToString } from '../utils/principal';
import type { TrendingTopic as BackendTrendingTopic, Post as BackendPost, UserProfile as BackendUserProfile } from '../../../declarations/backend/backend.did';

interface TrendingTopic extends BackendTrendingTopic {}
interface Post extends Omit<BackendPost, 'author'> {
  author: string;
}
interface UserProfile extends Omit<BackendUserProfile, 'id'> {
  id: string;
}

const TrendingView = () => {
  const [trendingTopics, setTrendingTopics] = useState<TrendingTopic[]>([]);
  const [selectedHashtag, setSelectedHashtag] = useState<string | null>(null);
  const [hashtagPosts, setHashtagPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userProfiles, setUserProfiles] = useState<Record<string, UserProfile>>({});

  useEffect(() => {
    fetchTrendingTopics();
  }, []);

  useEffect(() => {
    if (selectedHashtag) {
      fetchPostsByHashtag(selectedHashtag);
    }
  }, [selectedHashtag]);

  const fetchTrendingTopics = async () => {
    try {
      setLoading(true);
      const result = await backendService.getTrendingTopics(10);
      setTrendingTopics(result);
    } catch (err) {
      setError('Failed to load trending topics');
    } finally {
      setLoading(false);
    }
  };

  const fetchPostsByHashtag = async (hashtag: string) => {
    try {
      setLoadingPosts(true);
      const postsRaw = await backendService.searchPostsByHashtag(hashtag);
      const posts: Post[] = postsRaw.map((post: BackendPost) => ({
        ...post,
        author: principalToString(post.author),
      }));
      setHashtagPosts(posts);
      // Fetch user profiles for post authors
      const uniqueAuthors = [...new Set(posts.map(post => post.author))];
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
      setUserProfiles(profiles);
    } catch (err) {
      setError(`Failed to load posts for #${hashtag}`);
    } finally {
      setLoadingPosts(false);
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
    
    return date.toLocaleDateString();
  };

  const getUsernameForAuthor = (authorId: string) => {
    return userProfiles[authorId]?.username || authorId.slice(0, 8) + '...';
  };

  const handleHashtagClick = (hashtag: string) => {
    setSelectedHashtag(hashtag);
  };

  const handleBackToTrending = () => {
    setSelectedHashtag(null);
    setHashtagPosts([]);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient rounded-xl flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Trending</h1>
            <p className="text-text-secondary">Discover what's popular right now</p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center space-x-2 p-4 bg-red-50 border border-red-200 rounded-lg"
          >
            <span className="text-red-700">{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {selectedHashtag ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Back Button and Hashtag Header */}
          <div className="flex items-center space-x-4">
            <Button 
              onClick={handleBackToTrending} 
              className="flex items-center space-x-2 bg-background border border-border hover:bg-accent/10"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Trending</span>
            </Button>
            <div className="flex items-center space-x-2">
              <Hash className="w-6 h-6 text-accent" />
              <h2 className="text-xl font-bold text-text-primary">#{selectedHashtag}</h2>
            </div>
          </div>

          {/* Posts */}
          {loadingPosts ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
              <span className="ml-3 text-text-secondary">Loading posts...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {hashtagPosts.length === 0 ? (
                <div className="text-center py-12">
                  <Hash className="w-16 h-16 mx-auto mb-4 text-text-secondary opacity-50" />
                  <p className="text-text-secondary">No posts found with #{selectedHashtag}</p>
                </div>
              ) : (
                hashtagPosts.map((post) => (
                  <motion.div
                    key={post.id.toString()}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-card rounded-xl p-6 border border-border hover:border-accent/20 transition-all duration-300"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-gradient flex items-center justify-center">
                          <span className="text-white font-semibold">
                            {getUsernameForAuthor(post.author).charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="font-semibold text-text-primary">
                            {getUsernameForAuthor(post.author)}
                          </div>
                          <div className="text-sm text-text-secondary">
                            {formatDate(post.created_at)}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-text-primary mb-4 leading-relaxed">{post.content}</p>
                    
                    <div className="flex items-center space-x-6 text-sm text-text-secondary">
                      <div className="flex items-center space-x-1">
                        <Heart className="w-4 h-4" />
                        <span>{post.likes.length} likes</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MessageCircle className="w-4 h-4" />
                        <span>{post.comments.length} comments</span>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          )}
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Trending Topics Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
              <span className="ml-3 text-text-secondary">Loading trending topics...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {trendingTopics.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <TrendingUp className="w-16 h-16 mx-auto mb-4 text-text-secondary opacity-50" />
                  <p className="text-text-secondary">No trending topics yet</p>
                  <p className="text-sm text-text-muted mt-2">Start posting with hashtags to see them here!</p>
                </div>
              ) : (
                trendingTopics.map((topic, index) => (
                  <motion.div
                    key={topic.hashtag}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-card rounded-xl p-6 border border-border hover:border-accent/40 hover:bg-accent/5 transition-all duration-300 cursor-pointer group"
                    onClick={() => handleHashtagClick(topic.hashtag)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <Hash className="w-5 h-5 text-accent" />
                        <span className="font-bold text-text-primary group-hover:text-accent transition-colors">
                          #{topic.hashtag}
                        </span>
                      </div>
                      <div className="text-sm text-text-secondary">
                        #{index + 1}
                      </div>
                    </div>
                    <div className="text-sm text-text-secondary">
                      {topic.count.toString()} posts
                    </div>
                    <div className="mt-3 pt-3 border-t border-border">
                      <div className="text-xs text-text-muted">
                        Trending now
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default TrendingView; 