import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { backendService } from '../services/backendService';
import { Button, InputField } from '../components';
import { principalToString } from '../utils/principal';
import type { UserProfile as BackendUserProfile, _SERVICE } from '../../../declarations/backend/backend.did';

interface UserProfile extends Omit<BackendUserProfile, 'id'> {
  id: string;
}

type GetProfileResult = { Ok: BackendUserProfile } | { Err: string };

type CreateProfileResult = { Ok: BackendUserProfile } | { Err: string };

const ProfileView = () => {
  const { authState, logout } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        console.log("Fetching profile, auth state:", authState);
        
        const actor = await backendService.getAuthenticatedActor();
        console.log("Got authenticated actor");
        
        const result = await actor.get_profile() as GetProfileResult;
        console.log("Profile result:", result);
        
        if ('Ok' in result && result.Ok) {
          const backendProfile = result.Ok;
          console.log("Profile found:", backendProfile);
          setProfile({ ...backendProfile, id: principalToString(backendProfile.id) });
        } else {
          console.log("No profile found, showing creation form");
          setIsCreating(true);
        }
      } catch (err: any) {
        console.error("Error fetching profile:", err);
        setIsCreating(true);
      } finally {
        setLoading(false);
      }
    };
    
    if (authState.isAuthenticated) {
      console.log("User is authenticated, fetching profile");
      fetchProfile();
    } else {
      console.log("User is not authenticated");
    }
  }, [authState.isAuthenticated]);

  const handleCreateProfile = async () => {
    if (!username) {
      setError('Username is required');
      return;
    }
    
    try {
      setLoading(true);
      console.log("Creating profile with username:", username, "bio:", bio);
      
      const actor = await backendService.getAuthenticatedActor();
      console.log("Got authenticated actor for profile creation");
      
      console.log("Calling create_profile with:", username, bio ? [bio] : [], []);
      const result = await actor.create_profile(username, bio ? [bio] : [], []) as CreateProfileResult;
      console.log("Profile creation result:", result);
      
      if ('Ok' in result && result.Ok) {
        const backendProfile = result.Ok;
        console.log("Profile created successfully:", backendProfile);
        setProfile({ ...backendProfile, id: principalToString(backendProfile.id) });
        setIsCreating(false);
      } else {
        console.error("Failed to create profile:", result);
        setError('Failed to create profile: ' + (result as any).Err);
      }
    } catch (err: any) {
      console.error("Error creating profile:", err);
      setError('Error creating profile: ' + (err.message || String(err)));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-700 rounded-lg p-6 shadow-md">
        <p>Loading profile...</p>
      </div>
    );
  }

  if (isCreating) {
    return (
      <div className="bg-gray-700 rounded-lg p-6 shadow-md">
        <h3 className="text-lg font-bold mb-4">Create Your Profile</h3>
        {error && <p className="text-red-400 mb-2">{error}</p>}
        <div className="space-y-4">
          <InputField
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
          />
          <InputField
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Bio (optional)"
          />
          <Button onClick={handleCreateProfile}>
            Create Profile
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-700 rounded-lg p-6 shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold">Your Profile</h3>
        <Button onClick={logout} className="bg-red-600 hover:bg-red-700">
          Log Out
        </Button>
      </div>
      {profile && (
        <div className="text-left">
          <p><strong>Username:</strong> {profile.username}</p>
          {profile.bio && <p><strong>Bio:</strong> {profile.bio}</p>}
          <p><strong>Principal ID:</strong> {authState.principal}</p>
        </div>
      )}
    </div>
  );
};

export default ProfileView; 