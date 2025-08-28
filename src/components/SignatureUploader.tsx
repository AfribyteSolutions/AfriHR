"use client";

import React, { useState } from "react";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

type SignatureKind = "logo" | "signature1" | "signature2";

type Props = {
  companyId: string;
  /** What are we uploading? company logo or one of the signatures */
  type: SignatureKind;
  /** Called with the public download URL after successful upload */
  onUpload: (url: string) => void;
};

const SignatureUploader: React.FC<Props> = ({ companyId, type, onUpload }) => {
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const storage = getStorage();
      // Example path: companies/<id>/logo.png or signature1.png / signature2.png
      const storageRef = ref(storage, `companies/${companyId}/${type}.png`);
      await uploadBytes(storageRef, file);
      const url: string = await getDownloadURL(storageRef);
      onUpload(url);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("❌ Upload error:", err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <label className="cursor-pointer inline-block px-3 py-2 border rounded bg-gray-100 hover:bg-gray-200">
      {uploading ? "Uploading..." : `Upload ${type}`}
      <input
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </label>
  );
};

export default SignatureUploader;
