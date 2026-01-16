'use client';

import { useState, useRef, useCallback } from 'react';
import { Edit2, Save, X, Camera, Upload, Sparkles, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { toast } from 'sonner';
import { logger } from '@/services/logger';

import { cn } from '@/lib/utils';
import { useProfileContext } from '@/contexts/ProfileContext';

import { ProfileStats } from './ProfileStats';
import { ProfileProgress, ProfileSegment } from './ProfileProgress';
import { IOS26LiquidCard, IOS26LiquidButton, IOS26LiquidInput } from '@/components/ios26';

interface ProfileHeaderProps {
  className?: string;
}

// Enhanced Avatar Upload Component
function EnhancedAvatarUpload({
  src,
  alt,
  isEditing,
  onUpload,
  badge
}: {
  src?: string;
  alt: string;
  isEditing: boolean;
  onUpload?: (file: File) => Promise<void>;
  badge?: {
    id: string;
    name: string;
    icon: string;
    color: string;
  } | undefined;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (isEditing) setIsDragging(true);
  }, [isEditing]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileUpload = useCallback(async (file: File) => {
    if (!onUpload) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setIsUploading(true);
    try {
      await onUpload(file);
      toast.success('Avatar updated successfully!');
    } catch (error) {
      toast.error('Failed to upload avatar');
      logger.error('Avatar upload error:', 'ProfileHeader', error);
    } finally {
      setIsUploading(false);
    }
  }, [onUpload]);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (!isEditing || !onUpload) return;

    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));

    if (imageFile) {
      await handleFileUpload(imageFile);
    } else {
      toast.error('Please drop an image file');
    }
  }, [isEditing, onUpload, handleFileUpload]);


  const handleClick = () => {
    if (isEditing) {
      fileInputRef.current?.click();
    }
  };

  return (
    <motion.div
      className="relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      animate={{
        scale: isDragging ? 1.05 : 1,
      }}
      transition={{ duration: 0.2 }}
    >
      <IOS26LiquidCard
        variant="medium"
        interactive={isEditing}
        glow={isDragging}
        morph={isUploading}
        className={cn(
          'w-32 h-32 sm:w-36 sm:h-36 lg:w-40 lg:h-40 p-0 overflow-hidden cursor-pointer group',
          isDragging && 'ring-4 ring-blue-400/50 ring-offset-2',
          !src && 'border-2 border-dashed border-slate-300'
        )}
        onClick={handleClick}
      >
        {src ? (
          <>
            <Image
              src={src}
              alt={alt}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 144px, 160px"
            />

            {/* Upload Overlay */}
            <AnimatePresence>
              {isEditing && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center group-hover:bg-black/70 transition-colors"
                >
                  <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    className="text-white flex flex-col items-center gap-2"
                  >
                    {isUploading ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-8 h-8 border-2 border-white border-t-transparent rounded-full"
                      />
                    ) : (
                      <>
                        <Camera className="w-6 h-6" />
                        <span className="text-xs font-medium">Update Photo</span>
                      </>
                    )}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-500">
            {isDragging ? (
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="flex flex-col items-center gap-2"
              >
                <Upload className="w-8 h-8 text-blue-500" />
                <span className="text-sm font-medium text-blue-500">Drop to upload</span>
              </motion.div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-slate-600">
                    {alt.slice(0, 2).toUpperCase()}
                  </span>
                </div>
                {isEditing && (
                  <span className="text-xs font-medium">Add Photo</span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Achievement Badge */}
        {badge && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
            className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full flex items-center justify-center shadow-lg border-2 border-white"
            style={{ backgroundColor: badge.color }}
          >
            <span className="text-white text-lg">{badge.icon}</span>
          </motion.div>
        )}
      </IOS26LiquidCard>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileUpload(file);
        }}
        className="hidden"
        disabled={isUploading}
      />
    </motion.div>
  );
}

// Progress Circle Component
function ProgressCircle({
  percentage,
  size = 120,
  strokeWidth = 8,
  showLabel = true
}: {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  const getColor = (percent: number) => {
    if (percent >= 80) return '#10B981'; // Green
    if (percent >= 60) return '#F59E0B'; // Amber
    if (percent >= 40) return '#EF4444'; // Red
    return '#6B7280'; // Slate
  };

  const color = getColor(percentage);

  return (
    <motion.div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-slate-200"
        />

        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: 'easeInOut' }}
        />
      </svg>

      {showLabel && (
        <motion.div
          className="absolute inset-0 flex flex-col items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <span className="text-2xl font-bold" style={{ color }}>
            {percentage}%
          </span>
          <span className="text-xs text-slate-500 font-medium">
            Complete
          </span>
        </motion.div>
      )}
    </motion.div>
  );
}

// Gamification Component
function ProfileGamification({ percentage, level }: { percentage: number; level: number }) {
  const achievements = [
    { id: 'first-step', name: 'Getting Started', icon: '👋', unlocked: percentage >= 20, description: 'Complete basic profile info' },
    { id: 'foodie', name: 'Foodie Explorer', icon: '🍕', unlocked: percentage >= 40, description: 'Set your cuisine preferences' },
    { id: 'chef', name: 'Home Chef', icon: '👨‍🍳', unlocked: percentage >= 60, description: 'Complete cooking preferences' },
    { id: 'master', name: 'Profile Master', icon: '⭐', unlocked: percentage >= 80, description: 'Complete your entire profile' },
    { id: 'legend', name: 'Food Legend', icon: '🏆', unlocked: percentage >= 100, description: 'Perfect profile setup' }
  ];

  const nextMilestone = achievements.find(a => !a.unlocked);

  return (
    <IOS26LiquidCard variant="subtle" className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          Profile Journey
        </h3>
        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
          Level {level}
        </span>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {achievements.map((achievement) => (
          <motion.div
            key={achievement.id}
            className={cn(
              'flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium transition-all',
              achievement.unlocked
                ? 'bg-green-100 text-green-700'
                : 'bg-slate-100 text-slate-500'
            )}
            initial={{ scale: 0.9, opacity: 0.7 }}
            animate={{
              scale: achievement.unlocked ? 1 : 0.9,
              opacity: achievement.unlocked ? 1 : 0.7
            }}
            whileHover={{ scale: 1.05 }}
            title={achievement.description}
          >
            <span>{achievement.icon}</span>
            <span>{achievement.name}</span>
          </motion.div>
        ))}
      </div>

      {nextMilestone && (
        <motion.div
          className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Target className="w-4 h-4 text-blue-500" />
          <div className="flex-1">
            <p className="text-xs font-medium text-blue-700">
              Next: {nextMilestone.name}
            </p>
            <p className="text-xs text-blue-600">
              {nextMilestone.description}
            </p>
          </div>
        </motion.div>
      )}
    </IOS26LiquidCard>
  );
}

export function ProfileHeader({ className }: ProfileHeaderProps) {
  const { profile, updateProfile, uploadAvatar } = useProfileContext();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    fullName: profile?.fullName || '',
    username: profile?.username || '',
    bio: profile?.bio || '',
  });

  if (!profile) return null;

  // Calculate profile completion
  const calculateProfileCompletion = () => {
    const segments: ProfileSegment[] = [
      {
        id: 'basic',
        label: 'Basic Info',
        completed: !!(profile.fullName && profile.username && profile.avatarUrl),
        weight: 30,
      },
      {
        id: 'preferences',
        label: 'Preferences',
        completed: !!(
          profile.dietaryRestrictions?.length ||
          profile.preferredCuisines?.length ||
          profile.cookingSkillLevel
        ),
        weight: 30,
      },
      {
        id: 'household',
        label: 'Household',
        completed: !!profile.householdSize && profile.householdSize > 0,
        weight: 20,
      },
      {
        id: 'settings',
        label: 'Settings',
        completed: !!(
          profile.monthlyBudget ||
          profile.budget?.weekly ||
          profile.budget?.monthly
        ),
        weight: 20,
      },
    ];

    const completedWeight = segments
      .filter(s => s.completed)
      .reduce((sum, s) => sum + s.weight, 0);
    const percentage = Math.round(completedWeight);

    return { percentage, segments };
  };

  const { percentage, segments } = calculateProfileCompletion();

  // Calculate user level based on activity (mock data for now)
  const userLevel = Math.min(5, Math.floor((percentage / 100) * 5) + 1);
  const levelProgress = (percentage % 20) * 5;
  const locationLabel = profile.location
    ? [profile.location.city, profile.location.country].filter(Boolean).join(', ')
    : undefined;

  const handleSave = async () => {
    try {
      await updateProfile(editData);
      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (error: unknown) {
      toast.error('Failed to update profile');
      logger.error('Profile update error:', 'ProfileHeader', error);
    }
  };

  const handleCancel = () => {
    setEditData({
      fullName: profile.fullName || '',
      username: profile.username || '',
      bio: profile.bio || '',
    });
    setIsEditing(false);
  };

  const mockBadge = percentage >= 60 ? {
    id: 'verified',
    name: 'Verified Chef',
    icon: '✓',
    color: '#10b981',
  } : undefined;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('space-y-6', className)}
    >
      {/* Main Profile Card */}
      <IOS26LiquidCard
        variant="medium"
        glow
        shimmer
        className="p-6 sm:p-8"
      >
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Column - Avatar & Progress */}
          <div className="flex flex-col items-center lg:items-start gap-6">
            {/* Enhanced Avatar with Drag & Drop */}
            <EnhancedAvatarUpload
              src={profile.avatarUrl}
              alt={profile.fullName || profile.username || 'User'}
              isEditing={isEditing}
              onUpload={async (file) => {
                await uploadAvatar(file);
              }}
              badge={mockBadge}
            />

            {/* Progress Circle */}
            <div className="hidden lg:block">
              <ProgressCircle percentage={percentage} />
            </div>
          </div>

          {/* Right Column - Info & Actions */}
          <div className="flex-1 space-y-6">
            {/* Header with Edit Actions */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <AnimatePresence mode="wait">
                  {isEditing ? (
                    <motion.div
                      key="editing"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="space-y-4"
                    >
                      <IOS26LiquidInput
                        label="Full Name"
                        value={editData.fullName}
                        onChange={(e) =>
                          setEditData({ ...editData, fullName: e.target.value })
                        }
                        placeholder="Enter your full name"
                        size="lg"
                        fluid
                      />
                      <IOS26LiquidInput
                        label="Username"
                        value={editData.username}
                        onChange={(e) =>
                          setEditData({ ...editData, username: e.target.value })
                        }
                        placeholder="Choose a username"
                        size="md"
                        fluid
                      />
                      <div className="relative">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Bio
                        </label>
                        <motion.textarea
                          className={cn(
                            'w-full h-24 p-4 rounded-xl resize-none',
                            'ios26-glass ios26-glass-medium',
                            'bg-transparent border-0 outline-none',
                            'text-slate-900',
                            'placeholder-slate-500',
                            'focus:ring-2 focus:ring-blue-500/50'
                          )}
                          value={editData.bio}
                          onChange={(e) =>
                            setEditData({ ...editData, bio: e.target.value })
                          }
                          placeholder="Tell us about yourself and your cooking journey..."
                          maxLength={200}
                          whileFocus={{ scale: 1.01 }}
                          transition={{ duration: 0.2 }}
                        />
                        <div className="absolute bottom-2 right-3 text-xs text-slate-400">
                          {editData.bio.length}/200
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="display"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="space-y-3"
                    >
                      <div>
                        <h1 className="text-3xl font-bold text-slate-900">
                          {profile.fullName || 'Welcome to KeCarajoComer!'}
                        </h1>
                        <p className="text-lg text-slate-600">
                          @{profile.username || 'your-username'}
                        </p>
                      </div>
                      {profile.bio && (
                        <motion.p
                          className="text-slate-700 leading-relaxed max-w-lg"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.2 }}
                        >
                          {profile.bio}
                        </motion.p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Edit Actions */}
              <div className="ml-6">
                <AnimatePresence mode="wait">
                  {isEditing ? (
                    <motion.div
                      key="save-cancel"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="flex gap-3"
                    >
                      <IOS26LiquidButton
                        size="sm"
                        variant="ghost"
                        onClick={handleCancel}
                        icon={<X className="w-4 h-4" />}
                      >
                        Cancel
                      </IOS26LiquidButton>
                      <IOS26LiquidButton
                        size="sm"
                        variant="primary"
                        onClick={handleSave}
                        icon={<Save className="w-4 h-4" />}
                        glow
                      >
                        Save
                      </IOS26LiquidButton>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="edit"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                    >
                      <IOS26LiquidButton
                        size="sm"
                        variant="secondary"
                        onClick={() => setIsEditing(true)}
                        icon={<Edit2 className="w-4 h-4" />}
                      >
                        Edit Profile
                      </IOS26LiquidButton>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Mobile Progress Circle */}
            <div className="lg:hidden flex justify-center">
              <ProgressCircle percentage={percentage} size={100} strokeWidth={6} />
            </div>

            {/* Stats */}
            <ProfileStats
              level={userLevel}
              levelProgress={levelProgress}
              completionPercentage={percentage}
              quickStats={{
                location: locationLabel,
                householdSize: profile.householdSize || 1,
                primaryCuisine: profile.preferredCuisines?.[0],
              }}
            />

            {/* Progress Segments */}
            <ProfileProgress
              percentage={percentage}
              segments={segments}
            />
          </div>
        </div>
      </IOS26LiquidCard>

      {/* Gamification Section */}
      <ProfileGamification percentage={percentage} level={userLevel} />
    </motion.div>
  );
}
