import { useEffect, useState } from 'react';
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
    return new Date(Number(timestamp) / 1000000).toLocaleString();
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
    <div className="bg-gray-700 rounded-lg p-6 shadow-md">
      <h3 className="text-lg font-bold mb-4">Trending</h3>
      {error && <div className="text-red-400 mb-4">{error}</div>}
      {selectedHashtag ? (
        <div>
          <div className="flex items-center mb-4">
            <Button onClick={handleBackToTrending} className="mr-3 bg-gray-600">
              Back
            </Button>
            <h4 className="text-lg font-semibold">#{selectedHashtag}</h4>
          </div>
          {loadingPosts ? (
            <div className="text-gray-300">Loading posts...</div>
          ) : (
            <div className="space-y-4">
              {hashtagPosts.length === 0 ? (
                <div className="text-gray-400">No posts found with #{selectedHashtag}</div>
              ) : (
                hashtagPosts.map((post) => (
                  <div key={post.id.toString()} className="bg-gray-800 rounded-lg p-4">
                    <div className="flex justify-between mb-2">
                      <div className="font-bold">{getUsernameForAuthor(post.author)}</div>
                      <div className="text-gray-400 text-sm">{formatDate(post.created_at)}</div>
                    </div>
                    <p className="text-left mb-3">{post.content}</p>
                    <div className="flex gap-4 text-sm text-gray-400">
                      <div>{post.likes.length} likes</div>
                      <div>{post.comments.length} comments</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      ) : (
        <div>
          {loading ? (
            <div className="text-gray-300">Loading trending topics...</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {trendingTopics.length === 0 ? (
                <div className="col-span-3 text-gray-400">No trending topics yet</div>
              ) : (
                trendingTopics.map((topic) => (
                  <div 
                    key={topic.hashtag} 
                    className="bg-gray-800 rounded-lg p-3 cursor-pointer hover:bg-gray-600 transition-colors"
                    onClick={() => handleHashtagClick(topic.hashtag)}
                  >
                    <div className="font-bold">#{topic.hashtag}</div>
                    <div className="text-sm text-gray-400">{topic.count.toString()} posts</div>
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

export default TrendingView; 