// scripts/addTestNotification.js
const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json'); // You'll need to download this

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function addTestNotification() {
  const userId = 'qoQhhB8fxOfKuSywOqjKpaRbnF72'; // Your UID
  
  try {
    const notificationRef = await db.collection('notifications').add({
      userId: userId,
      title: 'Test Notification',
      message: 'This is a test notification created from terminal',
      category: 'system',
      link: '/dashboard',
      image: null,
      isRead: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log('✅ Test notification created with ID:', notificationRef.id);
    console.log('📋 UserID used:', userId);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating notification:', error);
    process.exit(1);
  }
}

addTestNotification();