import { useEffect, useState } from 'react';
import { backendService } from '../services/backendService';
import { Button } from '../components';
import { useAuth } from '../context/AuthContext';
import { principalToString } from '../utils/principal';
import type { UserProfile as BackendUserProfile } from '../../../declarations/backend/backend.did';

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

const ExploreView = ({ onViewProfile, searchQuery = '' }: ExploreViewProps) => {
  const { authState } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [following, setFollowing] = useState<Set<string>>(new Set());
  const [loadingFollow, setLoadingFollow] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  // Handle searchQuery prop changes
  useEffect(() => {
    if (searchQuery) {
      setSearchTerm(searchQuery);
      // Fetch users with the search query
      fetchUsersWithQuery(searchQuery);
    }
  }, [searchQuery]);

  const fetchUsersWithQuery = async (query: string) => {
    try {
      setLoading(true);
      const result = await backendService.searchUsers(query);
      
      if (Array.isArray(result)) {
        const users = result.map((user: BackendUserProfile) => ({
          id: principalToString(user.id),
          username: user.username,
          bio: user.bio,
          avatar_url: user.avatar_url
        }));
        setUsers(users);
      } else {
        setUsers([]);
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
      console.error('Error fetching users:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const result = await backendService.searchUsers(searchTerm);
      
      if (Array.isArray(result)) {
        const users = result.map((user: BackendUserProfile) => ({
          id: principalToString(user.id),
          username: user.username,
          bio: user.bio,
          avatar_url: user.avatar_url
        }));
        setUsers(users);
      } else {
        setUsers([]);
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
      console.error('Error fetching users:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleViewProfile = (userId: string) => {
    if (onViewProfile) {
      onViewProfile(userId);
    }
  };

  return (
    <div className="bg-background-card rounded-xl p-6 shadow-md">
      <h3 className="text-lg font-bold mb-4">Explore Users</h3>
      
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-2">
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search users..."
            className="flex-1 bg-background-input rounded-lg border border-secondary-700 p-3 text-text resize-none focus:border-primary focus:outline-none"
          />
          <Button type="submit" className="bg-primary hover:bg-primary-600">
            Search
          </Button>
        </div>
      </form>
      
      {error && <div className="bg-error/20 text-error rounded-lg p-4 mb-4">{error}</div>}
      
      <div className="space-y-4">
        {loading ? (
          <div className="text-text-secondary">Loading users...</div>
        ) : users.length === 0 ? (
          <div className="text-text-secondary">No users found</div>
        ) : (
          users.map((user) => (
            <div key={user.id} className="bg-background-light rounded-lg p-4 flex justify-between items-center">
              <div
                className="cursor-pointer flex-1"
                onClick={() => handleViewProfile(user.id)}
              >
                <div className="font-bold">{user.username}</div>
                {user.bio && user.bio.length > 0 && <p className="text-sm text-text-secondary">{user.bio[0]}</p>}
              </div>
              <div className="flex gap-2">
                {onViewProfile && (
                  <Button
                    onClick={() => handleViewProfile(user.id)}
                    className="bg-secondary-700 hover:bg-secondary-600"
                  >
                    View
                  </Button>
                )}
                {authState.isAuthenticated && user.id !== authState.principal && (
                  <Button
                    onClick={() => handleFollow(user.id)}
                    disabled={loadingFollow === user.id}
                    className={following.has(user.id) ? 'bg-secondary-700 hover:bg-secondary-600' : 'bg-primary hover:bg-primary-600'}
                  >
                    {following.has(user.id) ? 'Unfollow' : 'Follow'}
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ExploreView; 