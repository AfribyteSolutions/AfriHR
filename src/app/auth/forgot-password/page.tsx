import Image from "next/image";
import Link from "next/link";
import logoSvg from "../../../../public/assets/images/logo/logo.svg";
import logoWhite from "../../../../public/assets/images/logo/logo-white.svg";
import ForgotBasicForm from "@/form/auth/forgot-password/basic-form";

export default function ForgotPasswordPage() {
  return (
    <div className="container-xxl">
      <div className="authentication-wrapper basic-authentication">
        <div className="authentication-inner">
          <div className="card__wrapper">
            <div className="authentication-top text-center mb-[20px]">
              <Link href="/" className="authentication-logo logo-black">
                <Image style={{ width: "100%", height: "auto" }} src={logoSvg} alt="AfriHR" />
              </Link>
              <Link href="/" className="authentication-logo logo-white">
                <Image style={{ width: "100%", height: "auto" }} src={logoWhite} alt="AfriHR" />
              </Link>
              <h4 className="mb-[15px]">Forgot your password?</h4>
              <p className="mb-[15px]">Enter your email address and we will send you a secure reset link.</p>
            </div>
            <ForgotBasicForm />
          </div>
        </div>
      </div>
    </div>
  );
}
