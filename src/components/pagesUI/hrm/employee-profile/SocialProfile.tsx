"use client";
import React, { useState, useEffect } from "react";
import UpdateSocialProfileModal from "./UpdateSocialProfileModal";
import Link from "next/link";
import { IEmployee, ISocialProfile } from "@/interface";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface propsType {
  data: IEmployee | any;
}

const SocialProfile = ({ data }: propsType) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [socialProfile, setSocialProfile] = useState<ISocialProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch social profile data from the 'users' collection
  useEffect(() => {
    if (!data?.uid) {
      setLoading(false);
      return;
    }

    const userRef = doc(db, "users", data.uid);

    const unsubscribe = onSnapshot(
      userRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const userData = docSnap.data();
          // Assuming social profile data is stored under 'socialProfile' field
          setSocialProfile(userData.socialProfile || null);
        } else {
          setSocialProfile(null);
        }
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching social profile:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [data?.uid]);

  const getLink = (platform: keyof ISocialProfile) => {
    const username = socialProfile?.[platform];
    if (!username) return null;

    switch (platform) {
      case "linkedin":
        return `https://linkedin.com/in/${username}`;
      case "twitter":
        return `https://twitter.com/${username}`;
      case "facebook":
        return `https://facebook.com/${username}`;
      case "instagram":
        return `https://instagram.com/${username}`;
      case "whatsapp":
        return `https://wa.me/${username}`;
      default:
        return null;
    }
  };

  return (
    <>
      <div className="col-span-12 md:col-span-6 xl:col-span-4 xxl:col-span-4">
        <div className="card__wrapper">
          <div className="employee__profile-single-box relative">
            <div className="card__title-wrap flex align-center justify-between mb-[15px]">
              <h5 className="card__heading-title">Social Profile</h5>
              <button
                onClick={() => setModalOpen(true)}
                className="edit-icon"
              >
                <i className="fa-solid fa-pencil"></i>
              </button>
            </div>
            <div className="personal-info-wrapper bank__account">
              {loading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading social links...</p>
                </div>
              ) : socialProfile && Object.values(socialProfile).some(Boolean) ? (
                <ul className="personal-info">
                  {socialProfile.linkedin && (
                    <li>
                      <div className="title">LinkedIn:</div>
                      <div className="text text-link-hover">
                        <Link href={getLink("linkedin") || "#"} target="_blank">
                          {socialProfile.linkedin}
                        </Link>
                      </div>
                    </li>
                  )}
                  {socialProfile.twitter && (
                    <li>
                      <div className="title">Twitter:</div>
                      <div className="text text-link-hover">
                        <Link href={getLink("twitter") || "#"} target="_blank">
                          {socialProfile.twitter}
                        </Link>
                      </div>
                    </li>
                  )}
                  {socialProfile.facebook && (
                    <li>
                      <div className="title">Facebook:</div>
                      <div className="text text-link-hover">
                        <Link href={getLink("facebook") || "#"} target="_blank">
                          {socialProfile.facebook}
                        </Link>
                      </div>
                    </li>
                  )}
                  {socialProfile.instagram && (
                    <li>
                      <div className="title">Instagram:</div>
                      <div className="text text-link-hover">
                        <Link href={getLink("instagram") || "#"} target="_blank">
                          {socialProfile.instagram}
                        </Link>
                      </div>
                    </li>
                  )}
                  {socialProfile.whatsapp && (
                    <li>
                      <div className="title">WhatsApp:</div>
                      <div className="text text-link-hover">
                        <Link href={getLink("whatsapp") || "#"} target="_blank">
                          {socialProfile.whatsapp}
                        </Link>
                      </div>
                    </li>
                  )}
                </ul>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <i className="fa-solid fa-user-plus text-2xl mb-2"></i>
                  <p>No social media links added yet</p>
                  <button 
                    className="btn btn-sm btn-primary mt-2"
                    onClick={() => setModalOpen(true)}
                  >
                    Add Social Links
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {modalOpen && (
        <UpdateSocialProfileModal 
          open={modalOpen} 
          setOpen={setModalOpen} 
          data={data}
          socialProfile={socialProfile}
        />
      )}
    </>
  );
};

export default SocialProfile;