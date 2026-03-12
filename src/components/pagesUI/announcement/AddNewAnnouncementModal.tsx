"use client";
import React, { useState, useEffect } from "react";
import { Dialog, DialogTitle, DialogContent } from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import InputField from "@/components/elements/SharedInputs/InputField";
import FormLabel from "@/components/elements/SharedInputs/FormLabel";
import DatePicker from "react-datepicker";
import { statePropsType } from "@/interface/common.interface";
import { toast } from "sonner";
import { createAnnouncementAndNotify, updateAnnouncement } from "@/lib/firebase/announcements";
import { useAuthUserContext } from "@/context/UserAuthContext";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Announcement, AnnouncementTarget } from "@/types/announcement";

// This interface adds editData to the default modal props
interface AddNewAnnouncementModalProps extends statePropsType {
  editData?: Announcement | null;
}

interface AnnouncementFormData {
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  target: AnnouncementTarget;
  targetUserIds: string[];
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

const AddNewAnnouncementModal = ({ open, setOpen, editData }: AddNewAnnouncementModalProps) => {
  // We only destructure 'user' because your context defines the profile data there
  const { user } = useAuthUserContext();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors },
  } = useForm<AnnouncementFormData>({
    defaultValues: {
      title: "",
      description: "",
      startDate: new Date(),
      endDate: new Date(),
      target: 'all',
      targetUserIds: [],
    }
  });

  const targetType = watch('target');

  // Sync form with editData when modal opens
  useEffect(() => {
    if (open) {
      if (editData) {
        reset({
          title: editData.title,
          description: editData.description,
          startDate: editData.startDate,
          endDate: editData.endDate,
          target: editData.target,
          targetUserIds: editData.targetUserIds || [],
        });
      } else {
        reset({
          title: "",
          description: "",
          startDate: new Date(),
          endDate: new Date(),
          target: 'all',
          targetUserIds: [],
        });
        setSelectedUsers([]);
      }
    }
  }, [editData, open, reset]);

  // Fetch users for 'specific' target audience
  useEffect(() => {
    const fetchUsers = async () => {
      // Use user.companyId from your context
      if (!user?.companyId) return;
      
      try {
        const usersRef = collection(db, 'users');
        // Filter users by the current manager's companyId
        const q = query(usersRef, where('companyId', '==', user.companyId));
        const usersSnap = await getDocs(q);
        
        setUsers(usersSnap.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name || doc.data().email,
          email: doc.data().email,
          role: doc.data().role,
        })));
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };
    
    if (targetType === 'specific') fetchUsers();
  }, [targetType, user?.companyId]);

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleUserSelection = (u: User) => {
    setSelectedUsers(prev => 
      prev.some(item => item.id === u.id) 
        ? prev.filter(item => item.id !== u.id) 
        : [...prev, u]
    );
  };

  const onSubmit = async (data: AnnouncementFormData) => {
    // Basic auth check
    if (!user?.uid || !user?.companyId) {
      return toast.error("User authentication or company data missing");
    }
    
    setLoading(true);
    try {
      const finalData = {
        ...data,
        targetUserIds: data.target === 'specific' ? selectedUsers.map(u => u.id) : [],
      };

      if (editData?.id) {
        // Update existing announcement
        await updateAnnouncement(editData.id, finalData);
        toast.success("Announcement updated successfully!");
      } else {
        // Create new announcement and send notifications
        await createAnnouncementAndNotify({
          ...finalData,
          createdBy: user.uid,
          companyId: user.companyId, // Tagging with the current tenant's ID
        });
        toast.success("Announcement created and sent!");
      }
      setOpen(false);
    } catch (error: any) {
      toast.error(error?.message || "Something went wrong while saving");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="md">
      <DialogTitle>
        <div className="flex justify-between items-center">
          <h5 className="modal-title m-0">
            {editData ? "Edit Announcement" : "Add New Announcement"}
          </h5>
          <button 
            onClick={() => setOpen(false)} 
            type="button" 
            className="bd-btn-close bg-transparent border-0"
          >
            <i className="fa-solid fa-xmark-large text-slate-500"></i>
          </button>
        </div>
      </DialogTitle>
      <DialogContent className="common-scrollbar overflow-y-auto">
        <form onSubmit={handleSubmit(onSubmit)} className="mt-2">
          <div className="grid grid-cols-12 gap-y-5 gap-x-5">
            {/* Title */}
            <div className="col-span-12">
              <InputField
                label="Title"
                id="title"
                register={register("title", { required: "Title is required" })}
                error={errors.title}
              />
            </div>

            {/* Start Date */}
            <div className="col-span-12 md:col-span-6">
              <FormLabel label="Start Date" id="startDate" />
              <div className="datepicker-style">
                <Controller
                  name="startDate"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      selected={field.value}
                      onChange={(date) => field.onChange(date)}
                      dateFormat="dd/MM/yyyy"
                      className="w-full p-2 border rounded"
                    />
                  )}
                />
              </div>
            </div>

            {/* End Date */}
            <div className="col-span-12 md:col-span-6">
              <FormLabel label="End Date" id="endDate" />
              <div className="datepicker-style">
                <Controller
                  name="endDate"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      selected={field.value}
                      onChange={(date) => field.onChange(date)}
                      dateFormat="dd/MM/yyyy"
                      className="w-full p-2 border rounded"
                    />
                  )}
                />
              </div>
            </div>

            {/* Target Audience */}
            <div className="col-span-12">
              <FormLabel label="Target Audience" id="target" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                {['all', 'managers', 'employees', 'specific'].map((t) => (
                  <label 
                    key={t} 
                    className={`flex items-center gap-2 p-3 border rounded-xl cursor-pointer transition-colors ${
                      targetType === t ? 'bg-blue-50 border-blue-400' : 'bg-white'
                    }`}
                  >
                    <input type="radio" value={t} {...register("target")} className="w-4 h-4" />
                    <span className="capitalize text-sm font-medium">{t}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Specific User Selection */}
            {targetType === 'specific' && (
              <div className="col-span-12 animate-in fade-in duration-300">
                <FormLabel label="Select Specific Users" id="userSearch" />
                <input
                  type="text"
                  placeholder="Search users by name or email..."
                  className="w-full p-3 border rounded-xl mb-3 mt-2 outline-none focus:ring-2 focus:ring-blue-500/20"
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <div className="max-h-48 overflow-y-auto border rounded-xl divide-y">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map(u => (
                      <div 
                        key={u.id} 
                        onClick={() => toggleUserSelection(u)} 
                        className={`p-3 flex justify-between items-center cursor-pointer hover:bg-slate-50 transition-colors ${
                          selectedUsers.some(s => s.id === u.id) ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div>
                          <p className="text-sm font-bold m-0">{u.name}</p>
                          <p className="text-[11px] text-slate-500 m-0 uppercase tracking-tight">{u.role}</p>
                        </div>
                        {selectedUsers.some(s => s.id === u.id) && (
                          <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                            <i className="fa-solid fa-check text-white text-[10px]"></i>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="p-4 text-center text-slate-400 text-sm italic">No users found</p>
                  )}
                </div>
                <p className="text-[11px] text-blue-600 mt-2 font-bold uppercase">
                  Selected: {selectedUsers.length} users
                </p>
              </div>
            )}

            {/* Description */}
            <div className="col-span-12">
              <InputField
                label="Description"
                id="description"
                isTextArea={true}
                register={register("description", { required: "Description is required" })}
                error={errors.description}
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 mt-8">
            <button 
              className="btn bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-2.5 rounded-xl font-bold text-sm transition-all" 
              type="button" 
              onClick={() => setOpen(false)}
            >
              Cancel
            </button>
            <button 
              className="btn btn-primary px-8 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20" 
              type="submit" 
              disabled={loading}
            >
              {loading ? "Processing..." : (editData ? "Update Announcement" : "Post Announcement")}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddNewAnnouncementModal;