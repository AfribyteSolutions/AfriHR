// interface/Is
export interface IEmployee {
    id: string; // or number, depending on your DB
    name: string;
    position: string;
    image: string; // <-- for employee image URL
    phone: string;
    socialLinks: {
      facebook?: string;
      twitter?: string;
      linkedin?: string;
      youtube?: string;
      website?: string;
    };
  }
  