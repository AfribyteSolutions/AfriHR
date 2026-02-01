import { 
    collection, 
    addDoc, 
    updateDoc, 
    deleteDoc,
    doc, 
    getDocs, 
    getDoc,
    query, 
    where, 
    orderBy,
    onSnapshot,
    serverTimestamp,
    Timestamp
  } from 'firebase/firestore';
  import { db } from '@/lib/firebase';
  import { createNotification } from '../notification';
  import { 
    Announcement, 
    CreateAnnouncementData, 
    UpdateAnnouncementData,
    AnnouncementTarget 
  } from '@/types/announcement';
  
  const ANNOUNCEMENTS_COLLECTION = 'announcements';
  const USERS_COLLECTION = 'users';
  
  function convertTimestampToDate(timestamp: any): Date {
    if (timestamp instanceof Timestamp) {
      return timestamp.toDate();
    }
    return timestamp ? new Date(timestamp) : new Date();
  }
  
  async function getTargetUserIds(
    target: AnnouncementTarget,
    specificUserIds?: string[]
  ): Promise<string[]> {
    if (target === 'specific' && specificUserIds) {
      return specificUserIds;
    }
  
    const usersRef = collection(db, USERS_COLLECTION);
    let userQuery;
  
    if (target === 'all') {
      userQuery = query(usersRef);
    } else if (target === 'managers') {
      userQuery = query(usersRef, where('role', '==', 'manager'));
    } else if (target === 'employees') {
      userQuery = query(usersRef, where('role', '==', 'employee'));
    } else {
      return [];
    }
  
    const userSnap = await getDocs(userQuery);
    return userSnap.docs.map(doc => doc.id);
  }
  
  export async function createAnnouncementAndNotify(
    data: CreateAnnouncementData
  ): Promise<string> {
    try {
      const announcementRef = await addDoc(collection(db, ANNOUNCEMENTS_COLLECTION), {
        title: data.title,
        description: data.description,
        startDate: data.startDate,
        endDate: data.endDate,
        target: data.target,
        targetUserIds: data.targetUserIds || [],
        createdBy: data.createdBy,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
  
      const targetUserIds = await getTargetUserIds(data.target, data.targetUserIds);
  
      const notificationPromises = targetUserIds.map(userId => 
        createNotification({
          userId,
          title: 'New Announcement',
          message: data.title,
          category: 'system',
          link: '/announcement',
        })
      );
  
      await Promise.all(notificationPromises);
      return announcementRef.id;
    } catch (error) {
      console.error('Error creating announcement:', error);
      throw error;
    }
  }
  
  export async function updateAnnouncement(
    announcementId: string,
    data: UpdateAnnouncementData
  ): Promise<void> {
    try {
      const announcementRef = doc(db, ANNOUNCEMENTS_COLLECTION, announcementId);
      await updateDoc(announcementRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating announcement:', error);
      throw error;
    }
  }
  
  export async function deleteAnnouncement(announcementId: string): Promise<void> {
    try {
      const announcementRef = doc(db, ANNOUNCEMENTS_COLLECTION, announcementId);
      await deleteDoc(announcementRef);
    } catch (error) {
      console.error('Error deleting announcement:', error);
      throw error;
    }
  }
  
  export function subscribeToAnnouncements(
    callback: (announcements: Announcement[]) => void
  ): () => void {
    const q = query(
      collection(db, ANNOUNCEMENTS_COLLECTION),
      orderBy('createdAt', 'desc')
    );
  
    return onSnapshot(q, (snapshot) => {
      const announcements: Announcement[] = snapshot.docs.map(doc => {
        const data = doc.data({ serverTimestamps: 'estimate' });
        return {
          id: doc.id,
          title: data.title,
          description: data.description,
          startDate: convertTimestampToDate(data.startDate),
          endDate: convertTimestampToDate(data.endDate),
          target: data.target,
          targetUserIds: data.targetUserIds || [],
          createdBy: data.createdBy,
          createdAt: convertTimestampToDate(data.createdAt),
          updatedAt: data.updatedAt ? convertTimestampToDate(data.updatedAt) : undefined,
        };
      });
      callback(announcements);
    });
  }