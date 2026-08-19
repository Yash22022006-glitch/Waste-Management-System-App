import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { UserRole, Bin, User } from '../types';
import { binService } from '../services/binService';
import { authService } from '../services/authService'; // Import authService

const ProfilePage: React.FC = () => {
  const { user, login } = useAuth(); // Get login from auth context to update user state
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLocationLoading, setIsLocationLoading] = useState<boolean>(false);
  const [bins, setBins] = useState<Bin[]>([]); // Keep for binService cleanup

  // Profile editing states (for text fields)
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editedFullName, setEditedFullName] = useState<string>('');
  const [editedAge, setEditedAge] = useState<number | string>('');
  const [editedArea, setEditedArea] = useState<string>('');
  const [saveDetailsLoading, setSaveDetailsLoading] = useState<boolean>(false);
  const [saveDetailsError, setSaveDetailsError] = useState<string | null>(null);

  // Profile photo states (for file input)
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null); // For new photo preview
  const [isSavingPhoto, setIsSavingPhoto] = useState<boolean>(false); // Used internally by handleSaveDetails
  const [photoError, setPhotoError] = useState<string | null>(null);


  // Derive current profile photo URL (either uploaded, or DiceBear generated)
  const currentProfilePhoto = user?.photoUrl || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${user?.id || 'default'}&backgroundColor=b6e3f4,c0aede,d1d4f9`;
  // Photo to display in the avatar area (preview if selected, else current, else default)
  const avatarDisplayUrl = previewUrl || user?.photoUrl || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${user?.id || 'default'}&backgroundColor=b6e3f4,c0aede,d1d4f9`;


  // Initialize editable fields when user loads or when edit mode is entered
  useEffect(() => {
    if (user) {
      setEditedFullName(user.fullName || user.username);
      setEditedAge(user.age || ''); // Use empty string for number input if no age
      setEditedArea(user.area || '');
    }
  }, [user]);

  // Geolocation effect
  useEffect(() => {
    setIsLocationLoading(true);
    if (navigator.geolocation) {
      const geoWatchId = navigator.geolocation.watchPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setLocationError(null);
          setIsLocationLoading(false);
        },
        (err) => {
          console.error("Error getting location:", err.code, err.message, err); // Log code, message, and full object
          let errorMessage = `Geolocation error: `;
          if (err.code === err.PERMISSION_DENIED) {
            errorMessage += "Permission denied. Please enable location access in your browser settings.";
          } else if (err.code === err.POSITION_UNAVAILABLE) {
            // Specific handling for "Network error" message
            if (err.message === "Network error.") {
              errorMessage += "Network error. Please check your internet connection and device's location services.";
            } else {
              errorMessage += "Position unavailable. Please ensure GPS/location services are enabled.";
            }
          } else if (err.code === err.TIMEOUT) {
            errorMessage += "Timed out while trying to get your location. Trying again...";
          } else {
            errorMessage += err.message || "An unknown error occurred.";
          }
          setLocationError(errorMessage);
          setCurrentLocation(null);
          setIsLocationLoading(false);
        },
        { enableHighAccuracy: true, timeout: 60000, maximumAge: Infinity }
      );

      return () => navigator.geolocation.clearWatch(geoWatchId);
    } else {
      setLocationError("Geolocation is not supported by your browser.");
      setIsLocationLoading(false);
    }
  }, []);

  // Bin service subscription (kept for consistency, though not directly used for display on profile now)
  useEffect(() => {
    setBins(binService.getBins());
    const unsubscribe = binService.subscribe(setBins);
    return () => unsubscribe();
  }, []);

  // Photo upload handlers
  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setPhotoError(null);
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      if (file.size > 2 * 1024 * 1024) { // Max 2MB
        setPhotoError("File size too large. Max 2MB allowed.");
        setSelectedFile(null);
        setPreviewUrl(null);
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setSelectedFile(null);
      setPreviewUrl(null);
    }
  }, []);

  const handleCancelUpload = useCallback(() => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setPhotoError(null);
  }, []);


  const handleEditClick = useCallback(() => {
    setIsEditing(true);
    // Initialize edited states from current user data
    if (user) {
      setEditedFullName(user.fullName || user.username);
      setEditedAge(user.age || ''); // Use empty string for number input if no age
      setEditedArea(user.area || '');
      // Clear any pending photo uploads from a previous partial attempt
      handleCancelUpload();
    }
  }, [user, handleCancelUpload]);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
    // Reset any pending photo upload changes
    handleCancelUpload();
    setSaveDetailsError(null);
    setPhotoError(null);
    // Reset text fields to original values from user object
    if (user) {
        setEditedFullName(user.fullName || user.username);
        setEditedAge(user.age || '');
        setEditedArea(user.area || '');
    }
  }, [user, handleCancelUpload]);

  const handleSaveDetails = useCallback(async () => {
    if (!user) return;

    setSaveDetailsLoading(true);
    setSaveDetailsError(null);
    setPhotoError(null);

    let finalPhotoUrl: string | undefined = user.photoUrl; // Start with current saved photo

    try {
      // 1. Handle Photo Update/Removal if any
      if (selectedFile) {
        setIsSavingPhoto(true); // Indicate photo is being processed
        const reader = new FileReader();
        const photoBase64: string = await new Promise((resolve, reject) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = (error) => reject(error);
          reader.readAsDataURL(selectedFile);
        });
        
        const photoResponse = await authService.updateUserProfilePhoto(user.id, photoBase64);
        if (!photoResponse.success) {
          setPhotoError(photoResponse.message || 'Failed to update profile photo.');
          throw new Error('Photo update failed');
        }
        finalPhotoUrl = photoBase64; // Update photo URL for the user object
      } else if (user.photoUrl && previewUrl === null) {
        // This implies the user clicked 'Remove Photo' or cleared file selection
        // when a photo was present. Set photoUrl to null to remove it.
        const photoResponse = await authService.updateUserProfilePhoto(user.id, null);
        if (!photoResponse.success) {
          setPhotoError(photoResponse.message || 'Failed to remove profile photo.');
          throw new Error('Photo removal failed');
        }
        finalPhotoUrl = undefined; // Photo removed, set to undefined
      }
      setIsSavingPhoto(false);

      // 2. Handle Text Details Update
      const updatedFields: Partial<User> = {
        fullName: editedFullName,
        age: typeof editedAge === 'string' && editedAge === '' ? undefined : Number(editedAge),
        area: editedArea,
        photoUrl: finalPhotoUrl, // Ensure the new/removed photo URL is part of the updated user object
      };

      const detailsResponse = await authService.updateUserProfile(user.id, updatedFields);
      if (detailsResponse.success) {
        // Update local user state in context to reflect all changes
        const currentToken = authService.getToken() || '';
        const updatedUser = { ...user, ...updatedFields };
        login(updatedUser, currentToken); // This also updates localStorage

        setSelectedFile(null);
        setPreviewUrl(null);
        setIsEditing(false); // Exit edit mode
      } else {
        setSaveDetailsError(detailsResponse.message || 'Failed to save profile details.');
      }
    } catch (error: any) {
      console.error("Error saving profile:", error);
      if (error.message === 'Photo update failed' || error.message === 'Photo removal failed') {
        // Photo error already set, don't overwrite
      } else {
        setSaveDetailsError(error.message || "An unexpected error occurred while saving profile.");
      }
    } finally {
      setSaveDetailsLoading(false);
      setIsSavingPhoto(false); // Ensure this is reset
    }
  }, [user, editedFullName, editedAge, editedArea, selectedFile, previewUrl, login]);


  if (!user) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">Profile Not Found</h2>
        <p className="text-gray-600">Please log in to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">User Profile</h2>

      <div className="bg-white p-6 rounded-lg shadow-md max-w-md mx-auto">
        <div className="flex flex-col items-center mb-6 relative">
          <img
            src={avatarDisplayUrl} 
            alt={`${user.fullName || user.username}'s avatar`}
            className="w-24 h-24 rounded-full object-cover border-4 border-primary-500 mb-3"
            aria-label="User profile picture"
          />
          
          {isEditing ? (
            <>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                aria-label="Upload new profile photo"
                disabled={isSavingPhoto || saveDetailsLoading}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 bg-primary-600 text-white p-2 rounded-full shadow-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
                aria-label="Edit profile photo"
                disabled={isSavingPhoto || saveDetailsLoading}
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.38-2.827-2.828z" />
                </svg>
              </button>
            </>
          ) : ( // Show the edit icon to enter edit mode
             <button
                onClick={handleEditClick}
                className="absolute -bottom-1 -right-1 bg-gray-600 text-white p-2 rounded-full shadow-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                aria-label="Toggle edit mode"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.38-2.827-2.828z"></path></svg>
              </button>
          )}
         

          <p className="text-xl font-bold text-gray-900">{user.fullName || user.username}</p>
          <p className="text-sm text-gray-600">@{user.username}</p>
        </div>

        {photoError && (
          <p className="text-red-600 text-sm bg-red-100 p-2 rounded mb-4">{photoError}</p>
        )}
        {saveDetailsError && (
          <p className="text-red-600 text-sm bg-red-100 p-2 rounded mb-4">{saveDetailsError}</p>
        )}
        
        {isEditing && (selectedFile || user.photoUrl) && ( // Show photo control buttons if in edit mode and a photo is present or selected
          <div className="flex justify-center space-x-2 mt-4">
            {selectedFile ? (
              <button
                onClick={handleCancelUpload}
                disabled={isSavingPhoto || saveDetailsLoading}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md text-sm font-medium hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Cancel Photo
              </button>
            ) : (user.photoUrl && ( // Only show Remove Photo if there's a current photo and no new one selected
              <button
                onClick={() => {
                    // Stage for removal: clear the preview and selected file
                    setSelectedFile(null);
                    setPreviewUrl(null);
                    // Actual removal happens in handleSaveDetails
                }}
                disabled={isSavingPhoto || saveDetailsLoading}
                className="px-4 py-2 bg-danger text-white rounded-md text-sm font-medium hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Remove Photo
              </button>
            ))}
          </div>
        )}

        <div className="space-y-4 mt-6 pt-6 border-t border-gray-200">
          <div>
            <p className="text-sm font-medium text-gray-500">User ID</p>
            <p className="text-lg font-semibold text-gray-900">{user.id}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Role</p>
            <p className="text-lg font-semibold text-gray-900">
              {user.role.replace('_', ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
            </p>
          </div>
          <div>
            <label htmlFor="fullName" className="text-sm font-medium text-gray-500">Full Name</label>
            {isEditing ? (
              <input
                id="fullName"
                type="text"
                value={editedFullName}
                onChange={(e) => setEditedFullName(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                disabled={saveDetailsLoading}
              />
            ) : (
              <p className="text-lg font-semibold text-gray-900">{user.fullName || 'N/A'}</p>
            )}
          </div>
          <div>
            <label htmlFor="age" className="text-sm font-medium text-gray-500">Age</label>
            {isEditing ? (
              <input
                id="age"
                type="number"
                value={editedAge}
                onChange={(e) => setEditedAge(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                disabled={saveDetailsLoading}
              />
            ) : (
              <p className="text-lg font-semibold text-gray-900">{user.age || 'N/A'}</p>
            )}
          </div>
          <div>
            <label htmlFor="area" className="text-sm font-medium text-gray-500">Area</label>
            {isEditing ? (
              <input
                id="area"
                type="text"
                value={editedArea}
                onChange={(e) => setEditedArea(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                disabled={saveDetailsLoading}
              />
            ) : (
              <p className="text-lg font-semibold text-gray-900">{user.area || 'N/A'}</p>
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Live Location</p>
            {isLocationLoading ? (
              <p className="text-lg font-semibold text-gray-700">Fetching location...</p>
            ) : currentLocation ? (
              <p className="text-lg font-semibold text-gray-900">
                Lat: {currentLocation.lat.toFixed(4)}, Lng: {currentLocation.lng.toFixed(4)}
              </p>
            ) : (
              <p className="text-lg font-semibold text-red-600">{locationError || 'Location not available.'}</p>
            )}
          </div>
        </div>

        {isEditing && (
          <div className="flex justify-end space-x-2 mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={handleCancelEdit}
              disabled={saveDetailsLoading || isSavingPhoto}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md text-sm font-medium hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveDetails}
              disabled={saveDetailsLoading || isSavingPhoto}
              className="px-4 py-2 bg-primary-600 text-white rounded-md text-sm font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saveDetailsLoading || isSavingPhoto ? (
                <svg className="animate-spin h-5 w-5 text-white inline mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : 'Save Changes'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;