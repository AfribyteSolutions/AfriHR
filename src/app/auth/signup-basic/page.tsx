"use client";
import Image from 'next/image';
import Link from 'next/link';
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import logoSvg from '../../../../public/assets/images/logo/logo.svg';
import logoWhite from '../../../../public/assets/images/logo/logo-white.svg';
import SignUpBasicForm from '@/form/auth/SignUp/basic-form';

const SignUpBasicMain = () => {
  const router = useRouter();

  // Redirect to pricing page if already logged in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log('User already logged in, redirecting to pricing page');
        router.replace('/pricing');
      }
    });
    return () => unsubscribe();
  }, [router]);

  return (
    <>
      <div 
        className="container-xxl min-h-screen"
        style={{
          backgroundImage: 'url("/assets/images/bg/auth-background2.png")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {/* -- Sign Up area start-- */}
        <div className="authentication-wrapper basic-authentication">
          <div className="authentication-inner">
            <div className="pt-[70px]">
              <div className="authentication-top text-center mb-[20px]">
                <Link href="#" className="authentication-logo logo-black">
                  <Image src={logoSvg} style={{ width: "100%", height: "auto" }} alt="logo" />
                </Link>
                <Link href="#" className="authentication-logo logo-white">
                  <Image src={logoWhite} style={{ width: "100%", height: "auto" }} alt="logo" />
                </Link>
                <h4 className="mb-[15px] mt-[5]">Your Best Decision Today!</h4>
                <p className="mb-[10px]">Fill the below forms with the accurate information, and join us today!</p>
              </div>
              {/* Sign up basic form */}
              <SignUpBasicForm />
              {/* Sign up basic form end*/}
            </div>
          </div>
        </div>
        {/* -- Sign Up area end-- */}
      </div>
    </>
  );
};

export default SignUpBasicMain;