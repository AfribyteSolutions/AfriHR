export interface IEmployee {
  id: string; 
  authUid?: string; 
  name: string; // Used in your standard forms
  fullName?: string; // Often used in Firestore 'users'/'employees' collection
  displayName?: string; // Standard Firebase Auth property
  position: string;
  image: string; 
  profilePictureUrl?: string; 
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