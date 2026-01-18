import { NextRequest, NextResponse } from "next/server";
import { admin, db, bucket } from "@/lib/firebase-admin";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    // Get the authorization header
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, message: "Unauthorized: No token provided" },
        { status: 401 },
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer '

    // Verify the token
    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(token);
    } catch (error) {
      return NextResponse.json(
        { success: false, message: "Unauthorized: Invalid token" },
        { status: 401 },
      );
    }

    const uid = decodedToken.uid;

    // Get user data to get companyId
    const userDoc = await db.collection("users").doc(uid).get();
    if (!userDoc.exists) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 },
      );
    }

    const userData = userDoc.data();
    const companyId = userData?.companyId;

    if (!companyId) {
      return NextResponse.json(
        { success: false, message: "User not associated with a company" },
        { status: 400 },
      );
    }

    const projectId = params.id;

    // Get the project
    const projectRef = db.collection("projects").doc(projectId);
    const projectDoc = await projectRef.get();
    if (!projectDoc.exists) {
      return NextResponse.json(
        { success: false, message: "Project not found" },
        { status: 404 },
      );
    }

    const projectData = projectDoc.data();

    // Check if project belongs to user's company
    if (projectData?.companyId !== companyId) {
      return NextResponse.json(
        { success: false, message: "Access denied" },
        { status: 403 },
      );
    }

    // Parse the multipart form data
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, message: "No files provided" },
        { status: 400 },
      );
    }

    const uploadedDocuments: any[] = [];

    // Upload each file to Firebase Storage
    for (const file of files) {
      const fileId = crypto.randomUUID();
      const fileName = `${fileId}_${file.name}`;
      const filePath = `projects/${projectId}/documents/${fileName}`;

      const fileBuffer = Buffer.from(await file.arrayBuffer());

      const fileUpload = bucket.file(filePath);
      await fileUpload.save(fileBuffer, {
        metadata: {
          contentType: file.type,
          metadata: {
            originalName: file.name,
            uploadedBy: uid,
            uploadedAt: new Date().toISOString(),
          },
        },
      });

      // Get download URL
      const [downloadURL] = await fileUpload.getSignedUrl({
        action: "read",
        expires: "03-09-2491", // Far future date
      });

      uploadedDocuments.push({
        id: fileId,
        fileName: file.name,
        type: file.type,
        size: file.size,
        uploadDate: new Date().toISOString(),
        url: downloadURL,
        uploadedBy: uid,
      });
    }

    // Update the project with new documents
    const currentDocuments = projectData?.attachedFiles || [];
    const updatedDocuments = [...currentDocuments, ...uploadedDocuments];

    await projectRef.update({
      attachedFiles: updatedDocuments,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return NextResponse.json(
      {
        success: true,
        message: `${files.length} document(s) uploaded successfully`,
        uploadedCount: files.length,
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Error uploading documents:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
