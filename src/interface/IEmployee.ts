// interface/IEmployee
export interface IEmployee {
    id: string; // or number, depending on your DB
    authUid?: string; // Firebase Auth UID (may differ from Firestore doc.id)
    name: string;
    position: string;
    image: string; // <-- for employee image URL
    profilePictureUrl?: string; // Profile picture URL (optional)
    phone: string;
    socialLinks: {
      facebook?: string;
      twitter?: string;
      linkedin?: string;
      youtube?: string;
      website?: string;
    };
  }
  