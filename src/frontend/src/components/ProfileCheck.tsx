import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Camera, Loader2, CheckCircle, AlertCircle, Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { backendService } from '../services/backendService';
import { principalToString } from '../utils/principal';

// Image compression utility
const compressImage = (file: File, maxSize: number = 800): Promise<string> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    
    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;
      if (width > height) {
        if (width > maxSize) {
          height = (height * maxSize) / width;
          width = maxSize;
        }
      } else {
        if (height > maxSize) {
          width = (width * maxSize) / height;
          height = maxSize;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);
      const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
      resolve(compressedDataUrl);
    };
    
    img.src = URL.createObjectURL(file);
  });
};

// Types for backend responses
interface BackendUserProfile {
  id: any; // Principal
  username: string;
  bio: string[];
  avatar_url: string[];
  followers_count: number;
  following_count: number;
}

type GetProfileResult = { Ok: BackendUserProfile } | { Err: string };
type CreateProfileResult = { Ok: BackendUserProfile } | { Err: string };

interface UserProfile {
  id: string;
  username: string;
  bio: string[];
  avatar_url: string[];
  followers_count: number;
  following_count: number;
}

interface ProfileCheckProps {
  onProfileComplete: () => void;
}

const ProfileCheck: React.FC<ProfileCheckProps> = ({ onProfileComplete }) => {
  const { authState } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Floating stats for background animation
  const floatingStats = [
    { number: "100%", label: "On-Chain", position: { left: "15%", top: "25%" } },
    { number: "∞", label: "Scalable", position: { right: "20%", top: "35%" } },
    { number: "0", label: "Censorship", position: { left: "25%", bottom: "30%" } },
    { number: "24/7", label: "Available", position: { right: "15%", bottom: "25%" } },
    { number: "100%", label: "Secure", position: { right: "10%", top: "15%" } },
    { number: "∞", label: "Decentralized", position: { right: "35%", bottom: "40%" } }
  ];

  useEffect(() => {
    if (authState.isAuthenticated) {
      // Check if profile ID is already stored in localStorage
      const storedProfileId = localStorage.getItem('tokntalk_profile_id');
      if (storedProfileId && storedProfileId === authState.principal) {
        // Profile already exists for this user, proceed directly
        onProfileComplete();
        return;
      }
      // No stored profile, proceed with normal check
      checkProfile();
    }
  }, [authState.isAuthenticated, authState.principal]);

  const clearStoredProfile = () => {
    try {
      localStorage.removeItem('tokntalk_profile_id');
    } catch (storageError) {
      console.warn('Failed to clear profile ID from localStorage:', storageError);
    }
  };

  const checkProfile = async () => {
    if (!authState.isAuthenticated) return;

    try {
      setIsChecking(true);
      setError(null);
      
      const actor = await backendService.getAuthenticatedActor();
      const result = await actor.get_profile() as GetProfileResult;
      
      if ('Ok' in result && result.Ok) {
        const backendProfile = result.Ok;
        const userProfile: UserProfile = { 
          id: principalToString(backendProfile.id),
          username: backendProfile.username,
          bio: backendProfile.bio,
          avatar_url: backendProfile.avatar_url,
          followers_count: backendProfile.followers_count,
          following_count: backendProfile.following_count
        };
        setProfile(userProfile);
        // Store profile ID in localStorage for future use
        try {
          localStorage.setItem('tokntalk_profile_id', authState.principal || '');
        } catch (storageError) {
          console.warn('Failed to store profile ID in localStorage:', storageError);
        }
        // Profile exists, proceed to main app
        onProfileComplete();
      } else {
        // No profile found, show creation form
        setShowCreateForm(true);
      }
    } catch (err: any) {
      console.error("Error checking profile:", err);
      // If error, assume no profile and show creation form
      setShowCreateForm(true);
    } finally {
      setIsChecking(false);
    }
  };

  const handleCreateProfile = async () => {
    if (!username.trim()) {
      setError('Username is required');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      
      const actor = await backendService.getAuthenticatedActor();
      const bioArray = bio.trim() ? [bio.trim()] : [];
      const avatarArray = avatarUrl ? [avatarUrl] : [];
      
      const result = await actor.create_profile(username.trim(), bioArray, avatarArray) as CreateProfileResult;
      
      if ('Ok' in result && result.Ok) {
        // Store profile ID in localStorage for future use
        try {
          localStorage.setItem('tokntalk_profile_id', authState.principal || '');
        } catch (storageError) {
          console.warn('Failed to store profile ID in localStorage:', storageError);
        }
        setSuccess(true);
        // Wait a moment to show success, then proceed
        setTimeout(() => {
          onProfileComplete();
        }, 1500);
      } else if ('Err' in result) {
        setError('Failed to create profile: ' + result.Err);
      }
    } catch (err: any) {
      console.error("Error creating profile:", err);
      setError('Error creating profile: ' + (err.message || String(err)));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        // Check file size first (2MB limit)
        if (file.size > 2 * 1024 * 1024) {
          setError('Image file is too large. Please select an image smaller than 2MB.');
          return;
        }
        
        // Compress the image
        const compressedImage = await compressImage(file, 800);
        setAvatarUrl(compressedImage);
        setError(null); // Clear any previous errors
      } catch (err) {
        console.error('Error processing image:', err);
        setError('Error processing image. Please try again.');
      }
    }
  };

  // Show initial state when not checking and not showing create form
  if (!isChecking && !showCreateForm && !success) {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden">
        {/* Animated Background Gradients */}
        <div className="absolute inset-0">
          {/* Primary gradient orb */}
          <motion.div
            className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-accent/20 to-primary/10 rounded-full blur-3xl"
            animate={{
              x: [0, 100, 0],
              y: [0, -50, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          
          {/* Secondary gradient orb */}
          <motion.div
            className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-primary/15 to-accent/25 rounded-full blur-3xl"
            animate={{
              x: [0, -80, 0],
              y: [0, 60, 0],
              scale: [1, 0.8, 1],
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 5,
            }}
          />
          
          {/* Accent gradient orb */}
          <motion.div
            className="absolute top-3/4 left-1/2 w-72 h-72 bg-gradient-to-r from-accent/30 to-secondary/20 rounded-full blur-3xl"
            animate={{
              x: [0, 120, 0],
              y: [0, -30, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 18,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 10,
            }}
          />
        </div>

        {/* Floating Stats in Background */}
        <div className="absolute inset-0">
          {floatingStats.map((stat, index) => (
            <motion.div
              key={`floating-stat-${index}`}
              className="absolute text-center"
              style={stat.position}
              initial={{ opacity: 0, y: 20 }}
              animate={{ 
                opacity: [0.3, 0.7, 0.3],
                y: [0, -10, 0]
              }}
              transition={{
                duration: 4 + index,
                repeat: Infinity,
                ease: "easeInOut",
                delay: index * 0.5,
              }}
              whileHover={{
                y: -20,
                scale: 1.1,
                opacity: 1,
              }}
            >
              <div className="text-2xl md:text-3xl font-bold text-accent/60">
                {stat.number}
              </div>
              <div className="text-sm text-text-secondary/60 font-medium">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Floating Geometric Elements */}
        <div className="absolute inset-0">
          {/* Floating circles */}
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={`circle-${i}`}
              className="absolute w-2 h-2 bg-accent/30 rounded-full"
              style={{
                left: `${20 + (i * 15)}%`,
                top: `${30 + (i * 10)}%`,
              }}
              animate={{
                y: [0, -30, 0],
                opacity: [0.3, 0.8, 0.3],
                scale: [1, 1.5, 1],
              }}
              transition={{
                duration: 4 + i,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.5,
              }}
            />
          ))}
          
          {/* Floating squares */}
          {[...Array(4)].map((_, i) => (
            <motion.div
              key={`square-${i}`}
              className="absolute w-3 h-3 bg-primary/20 rotate-45"
              style={{
                right: `${25 + (i * 20)}%`,
                top: `${20 + (i * 15)}%`,
              }}
              animate={{
                y: [0, 40, 0],
                rotate: [45, 225, 45],
                opacity: [0.2, 0.6, 0.2],
              }}
              transition={{
                duration: 6 + i,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.8,
              }}
            />
          ))}
          
          {/* Floating stars */}
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={`star-${i}`}
              className="absolute text-accent/20"
              style={{
                left: `${10 + (i * 12)}%`,
                top: `${60 + (i * 8)}%`,
              }}
              animate={{
                y: [0, -25, 0],
                rotate: [0, 180, 360],
                opacity: [0.1, 0.4, 0.1],
              }}
              transition={{
                duration: 8 + i,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.3,
              }}
            >
              <Star className="w-4 h-4" />
            </motion.div>
          ))}
        </div>

        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 opacity-5">
          <div 
            className="absolute inset-0"
            style={{
              backgroundImage: `
                linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
              `,
              backgroundSize: '50px 50px',
            }}
          />
        </div>

        <div className="relative z-10 flex items-center justify-center min-h-screen p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="modern-card p-8 text-center max-w-md w-full"
          >
            <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-accent" />
            </div>
            <h2 className="text-2xl font-bold text-text mb-2">Welcome to ToknTalk!</h2>
            <p className="text-text-secondary mb-6">
              Let's check your profile status to get you started
            </p>
            
            <motion.button
              onClick={checkProfile}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="modern-button w-full relative overflow-hidden"
            >
              <span>Check My Profile</span>
              {/* Loading animation overlay */}
              <motion.div
                className="absolute inset-0 bg-white/20"
                initial={{ x: "-100%" }}
                whileHover={{ x: "100%" }}
                transition={{ duration: 0.6 }}
              />
            </motion.button>
{/*             
            <button
              onClick={clearStoredProfile}
              className="text-sm text-text-secondary hover:text-accent transition-colors duration-300 mt-4"
            >
              Clear stored profile data
            </button> */}
          </motion.div>
        </div>
      </div>
    );
  }

  if (isChecking) {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden">
        {/* Animated Background Gradients */}
        <div className="absolute inset-0">
          {/* Primary gradient orb */}
          <motion.div
            className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-accent/20 to-primary/10 rounded-full blur-3xl"
            animate={{
              x: [0, 100, 0],
              y: [0, -50, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          
          {/* Secondary gradient orb */}
          <motion.div
            className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-primary/15 to-accent/25 rounded-full blur-3xl"
            animate={{
              x: [0, -80, 0],
              y: [0, 60, 0],
              scale: [1, 0.8, 1],
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 5,
            }}
          />
          
          {/* Accent gradient orb */}
          <motion.div
            className="absolute top-3/4 left-1/2 w-72 h-72 bg-gradient-to-r from-accent/30 to-secondary/20 rounded-full blur-3xl"
            animate={{
              x: [0, 120, 0],
              y: [0, -30, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 18,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 10,
            }}
          />
        </div>

        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 opacity-5">
          <div 
            className="absolute inset-0"
            style={{
              backgroundImage: `
                linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
              `,
              backgroundSize: '50px 50px',
            }}
          />
        </div>

        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="modern-card p-8 text-center max-w-md w-full"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full mx-auto mb-4"
            />
            <h2 className="text-xl font-semibold text-text mb-2">Checking Profile</h2>
            <p className="text-text-secondary">Setting up your account...</p>
          </motion.div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden">
        {/* Animated Background Gradients */}
        <div className="absolute inset-0">
          {/* Primary gradient orb */}
          <motion.div
            className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-accent/20 to-primary/10 rounded-full blur-3xl"
            animate={{
              x: [0, 100, 0],
              y: [0, -50, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          
          {/* Secondary gradient orb */}
          <motion.div
            className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-primary/15 to-accent/25 rounded-full blur-3xl"
            animate={{
              x: [0, -80, 0],
              y: [0, 60, 0],
              scale: [1, 0.8, 1],
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 5,
            }}
          />
          
          {/* Accent gradient orb */}
          <motion.div
            className="absolute top-3/4 left-1/2 w-72 h-72 bg-gradient-to-r from-accent/30 to-secondary/20 rounded-full blur-3xl"
            animate={{
              x: [0, 120, 0],
              y: [0, -30, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 18,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 10,
            }}
          />
        </div>

        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 opacity-5">
          <div 
            className="absolute inset-0"
            style={{
              backgroundImage: `
                linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
              `,
              backgroundSize: '50px 50px',
            }}
          />
        </div>

        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="modern-card p-8 text-center max-w-md w-full"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <CheckCircle className="w-8 h-8 text-white" />
            </motion.div>
            <h2 className="text-xl font-semibold text-text mb-2">Profile Created!</h2>
            <p className="text-text-secondary">Welcome to ToknTalk!</p>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated Background Gradients */}
      <div className="absolute inset-0">
        {/* Primary gradient orb */}
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-accent/20 to-primary/10 rounded-full blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        
        {/* Secondary gradient orb */}
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-primary/15 to-accent/25 rounded-full blur-3xl"
          animate={{
            x: [0, -80, 0],
            y: [0, 60, 0],
            scale: [1, 0.8, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 5,
          }}
        />
        
        {/* Accent gradient orb */}
        <motion.div
          className="absolute top-3/4 left-1/2 w-72 h-72 bg-gradient-to-r from-accent/30 to-secondary/20 rounded-full blur-3xl"
          animate={{
            x: [0, 120, 0],
            y: [0, -30, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 10,
          }}
        />
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 opacity-5">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
          }}
        />
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="modern-card p-8 max-w-md w-full"
        >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-accent" />
          </div>
          <h2 className="text-2xl font-bold text-text mb-2">Complete Your Profile</h2>
          <p className="text-text-secondary">
            Set up your profile to start connecting with others on ToknTalk
          </p>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleCreateProfile(); }} className="space-y-6">
          {/* Username */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-text mb-2">
              Username *
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-3 rounded-lg border border-accent/20 bg-background-card text-text placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50 transition-all duration-300"
              placeholder="Enter your username"
              required
            />
          </div>

          {/* Bio */}
          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-text mb-2">
              Bio
            </label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="w-full p-3 rounded-lg border border-accent/20 bg-background-card text-text placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50 transition-all duration-300 resize-none"
              placeholder="Tell us about yourself..."
            />
          </div>

          {/* Avatar Upload */}
          <div>
            <label className="block text-sm font-medium text-text mb-2">
              Profile Picture
            </label>
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-full bg-background-card border-2 border-accent/20 flex items-center justify-center overflow-hidden">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <Camera className="w-6 h-6 text-text-secondary" />
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 p-3 border-2 border-dashed border-accent/30 rounded-lg text-text-secondary hover:border-accent/50 hover:text-accent transition-all duration-300"
              >
                {avatarUrl ? 'Change Photo' : 'Upload Photo'}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center space-x-2 p-3 bg-error/10 border border-error/20 rounded-lg text-error"
            >
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </motion.div>
          )}

          {/* Submit Button */}
          <motion.button
            type="submit"
            disabled={isSubmitting || !username.trim()}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full modern-button disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
          >
            <AnimatePresence mode="wait">
              {isSubmitting ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center justify-center"
                >
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  <span>Creating Profile...</span>
                </motion.div>
              ) : (
                <motion.div
                  key="content"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center justify-center"
                >
                  <span>Create Profile</span>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Loading animation overlay */}
            <motion.div
              className="absolute inset-0 bg-white/20"
              initial={{ x: "-100%" }}
              whileHover={{ x: "100%" }}
              transition={{ duration: 0.6 }}
            />
          </motion.button>
        </form>
      </motion.div>
      </div>
    </div>
  );
};

export default ProfileCheck; 