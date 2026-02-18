"use client";
import Image from 'next/image';
import Link from 'next/link';
import React from 'react'; 
import { useAuthUserContext } from '@/context/UserAuthContext'; 
import avatarImg from "../../../../../public/assets/images/avatar/avatar.png";
import UserIcon from '@/svg/header-svg/Profile/UserIcon';
import ChatIcon from '@/svg/header-svg/Profile/ChatIcon';
import LogOut from '@/svg/header-svg/Profile/LogOut';
import { auth } from '@/lib/firebase'; 
import { IEmployee } from '@/interface/IEmployee';

// types
type TUserProps = {
    handleShowUserDrowdown: () => void;
    isOpenUserDropdown: boolean;
};

/**
 * We define a type that combines your IEmployee interface with 
 * potential Firebase Auth properties, explicitly allowing nulls.
 */
type ExtendedUser = Partial<IEmployee> & {
    displayName?: string | null;
    fullName?: string | null;
    photoURL?: string | null;
    email?: string | null;
    uid?: string | null;
};

const HeaderUserProfile = ({ handleShowUserDrowdown, isOpenUserDropdown }: TUserProps) => {
    // Get user data and loading state. 
    // We cast to 'any' first then to 'ExtendedUser' to bypass strict inheritance conflicts.
    const { user, loading: loadingAuthUser } = useAuthUserContext(); 
    const authUser = user as ExtendedUser;

    const handleLogout = async () => {
        try {
            await auth.signOut();
            window.location.href = '/auth/signin-basic'; 
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    // Logic for Name: Firestore fullName > Firestore name > Firebase displayName
    const displayName = 
        authUser?.fullName || 
        authUser?.name || 
        authUser?.displayName || 
        "User";
    
    // Logic for Role: Use position from onboarding or fallback
    const displayRole = authUser?.position || "online";

    // Logic for Avatar: Profile pic from Firestore > Photo from Auth > Default
    const profileImage = 
        authUser?.profilePictureUrl || 
        authUser?.image || 
        authUser?.photoURL;

    return (
        <>
            <div className="nav-item relative">
                <Link id="userportfolio" href="#" onClick={(e) => { e.preventDefault(); handleShowUserDrowdown(); }}>
                    <div className="user__portfolio">
                        <div className="user__portfolio-thumb">
                            {loadingAuthUser ? (
                                <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse border border-slate-200"></div> 
                            ) : profileImage ? (
                                <Image 
                                    src={profileImage} 
                                    alt="User Photo" 
                                    width={40} 
                                    height={40} 
                                    className="rounded-full object-cover border border-slate-200" 
                                />
                            ) : (
                                <Image 
                                    src={avatarImg} 
                                    alt="Default Avatar" 
                                    width={40} 
                                    height={40} 
                                    className="rounded-full object-cover border border-slate-200" 
                                />
                            )}
                        </div>
                        <div className="user__content">
                            <h5 className="font-bold text-slate-900 dark:text-white">
                                {loadingAuthUser ? "Loading..." : displayName}
                            </h5>
                            <span className="text-xs text-slate-500 capitalize">{displayRole}</span>
                        </div>
                    </div>
                </Link>

                {isOpenUserDropdown && (
                    <div className={`user__dropdown ${isOpenUserDropdown ? "user-enable" : ""}`}>
                        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 md:hidden">
                            <p className="text-sm font-bold truncate">{displayName}</p>
                            <p className="text-xs text-slate-500 truncate">{authUser?.email}</p>
                        </div>
                        <ul>
                            <li>
                                {authUser?.uid ? (
                                    <Link href={`/hrm/employee-profile?uid=${authUser.uid}`}>
                                        <UserIcon />
                                        My Profile
                                    </Link>
                                ) : (
                                    <Link href="#">
                                        <UserIcon />
                                        Profile
                                    </Link>
                                )}
                            </li>
                            
                            <li>
                                <button 
                                    onClick={handleLogout} 
                                    className="flex items-center w-full px-4 py-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                                >
                                    <LogOut />
                                    <span className="ml-2 font-medium">Log Out</span>
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