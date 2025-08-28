"use client";
import { useAuthUserContext } from "../context/UserAuthContext";

export default function useAuth() {
  return useAuthUserContext();
}
