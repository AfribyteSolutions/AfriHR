"use client";
import Image from 'next/image';
import Link from 'next/link';
import React, { useState } from 'react'; // Removed useEffect as context handles initial fetch
import { useAuthUserContext } from '@/context/UserAuthContext'; // Import your context hook
import avatarImg from "../../../../../public/assets/images/avatar/avatar.png";
import UserIcon from '@/svg/header-svg/Profile/UserIcon';
import ChatIcon from '@/svg/header-svg/Profile/ChatIcon';
import EmailIcon from '@/svg/header-svg/Profile/EmailIcon';
import LogOut from '@/svg/header-svg/Profile/LogOut';
import { auth } from '@/lib/firebase'; // Ensure Firebase auth is imported for signOut

//types
type TUserProps = {
    handleShowUserDrowdown: () => void;
    isOpenUserDropdown: boolean;
};

const HeaderUserProfile = ({ handleShowUserDrowdown, isOpenUserDropdown }: TUserProps) => {
    // Get user data and loading state directly from the AuthUserContext
    const { user: authUser, loading: loadingAuthUser } = useAuthUserContext(); 

    // This function will be called on log out
    const handleLogout = async () => {
        try {
            await auth.signOut();
            window.location.href = '/auth/signin-basic'; // Redirect to sign-in page
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    return (
        <>
            <div className="nav-item relative">
                {/* Clickable profile icon */}
                <Link id="userportfolio" href="#" onClick={handleShowUserDrowdown}>
                    <div className="user__portfolio">
                        <div className="user__portfolio-thumb">
                            {/* Display a loading placeholder, user photo, or default avatar */}
                            {loadingAuthUser ? (
                                <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse"></div> // Simple loading animation
                            ) : authUser?.photoURL ? (
                                <Image src={authUser.photoURL} alt="User Photo" width={40} height={40} className="rounded-full object-cover" />
                            ) : (
                                <Image src={avatarImg} alt="Default Avatar" width={40} height={40} className="rounded-full object-cover" />
                            )}
                        </div>
                        <div className="user__content">
                            {/* Display user's name from context, with loading state and fallback */}
                            <h5>{loadingAuthUser ? "Loading..." : authUser?.fullName || "Jhon Smith"}</h5>
                            <span>online</span>
                        </div>
                    </div>
                </Link>
                {/* Conditional rendering of the dropdown */}
                {isOpenUserDropdown && (
                    <div className={`user__dropdown ${isOpenUserDropdown ? "user-enable" : " "}`}>
                        <ul>
                            <li>
                                {/* Link to My Profile using UID from context */}
                                {authUser?.uid ? (
                                    <Link href={`/hrm/employee-profile?uid=${authUser.uid}`}>
                                        <UserIcon />
                                        My Profile
                                    </Link>
                                ) : (
                                    <Link href="#"> {/* Placeholder if user not loaded/logged in */}
                                        <UserIcon />
                                        Profile (Login Required)
                                    </Link>
                                )}
                            </li>
                            <li>
                                <Link href="/apps/app-chat">
                                    <ChatIcon />
                                    Chat
                                </Link>
                            </li>
                            <li>
                                <Link href="/apps/email-inbox">
                                    <EmailIcon />
                                    Inbox
                                </Link>
                            </li>
                            <li>
                                <button onClick={handleLogout} className="flex items-center w-full px-4 py-2 text-gray-700 hover:bg-gray-100">
                                    <LogOut />
                                    <span className="ml-2">Log Out</span>
                                </button>
                            </li>
                        </ul>
                    </div>
                )}
            </div>
        </>
    );
};

export default HeaderUserProfile;
