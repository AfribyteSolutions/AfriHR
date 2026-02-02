"use client";
import Image from 'next/image';
import Link from 'next/link';
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import logoSvg from '../../../../public/assets/images/logo/logo.svg';
import logoWhite from '../../../../public/assets/images/logo/logo-white.svg';
import SignInBasicForm from '@/form/auth/SignIn/basic-form';
import SocialLinks from '@/components/SocialLinks/SocialLinks';

const SignInBasicMain = () => {
    const router = useRouter();

    // Redirect to dashboard if already logged in
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                console.log('User already logged in, redirecting to dashboard');
                router.replace('/dashboard');
            }
        });
        return () => unsubscribe();
    }, [router]);

    return (
        <>
            <div className="container-xxl">
                {/* -- SignIn area start-- */}
                <div className="authentication-wrapper basic-authentication">
                    <div className="authentication-inner">
                        <div className="card__wrapper">
                            <div className="authentication-top text-center mb-[20px]">
                                <Link href="#" className="authentication-logo logo-black">
                                    <Image style={{ width: "100%", height: "auto" }} src={logoSvg} alt="logo" />
                                </Link>
                                <Link href="#" className="authentication-logo logo-white">
                                    <Image style={{ width: "100%", height: "auto" }} src={logoWhite} alt="logo" />
                                </Link>
                                <h4 className="mb-[15px]">Welcome to AfriHR</h4>
                                <p className="mb-[15px]">Please sign-in to your account and start the adventure</p>
                            </div>
                            {/* Sign in basic form area*/}
                            <SignInBasicForm />
                            {/* Sign in basic end area*/}
                            <p className="text-center">
                                <span>Sign in with your credentials as registered.</span><br></br>
                                <Link href="/auth/forgot-password-basic">
                                    <span>Forgot Password?</span>
                                </Link>
                            </p>
                            {/* <div className="divider mb-2.5 text-center">
                                <div className="divider-text">or</div>
                            </div> */}
                            {/* Social link*/}
                            {/* <SocialLinks /> */}
                        </div>
                    </div>
                </div>
                {/* -- SignIn area end-- */}
            </div>
        </>
    );
};

export default SignInBasicMain;