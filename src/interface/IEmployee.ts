export interface IEmployee {
  id: string; 
  authUid?: string; // Firebase Auth UID (may differ from Firestore doc.id)
  name: string; // Used in standard forms
  fullName?: string; // Used in Firestore 'users'/'employees' collection
  displayName?: string; // Standard Firebase Auth property
  position: string;
  image: string; // Employee image URL
  profilePictureUrl?: string; // Optional profile picture URL
  email?: string; // Useful for fallbacks
  uid?: string;   // Standard Firebase UID
  phone: string;
  socialLinks: {
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    youtube?: string;
    website?: string;
  };
}