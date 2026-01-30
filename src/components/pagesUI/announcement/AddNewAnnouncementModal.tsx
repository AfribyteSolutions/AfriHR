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
import { collection, getDocs } from "firebase/firestore";
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

  // Fill form if editing, reset if creating new
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

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersRef = collection(db, 'users');
        const usersSnap = await getDocs(usersRef);
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
  }, [targetType]);

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleUserSelection = (u: User) => {
    setSelectedUsers(prev => 
      prev.some(item => item.id === u.id) ? prev.filter(item => item.id !== u.id) : [...prev, u]
    );
  };

  const onSubmit = async (data: AnnouncementFormData) => {
    if (!user?.uid) return toast.error("User not authenticated");
    
    setLoading(true);
    try {
      const finalData = {
        ...data,
        targetUserIds: data.target === 'specific' ? selectedUsers.map(u => u.id) : [],
      };

      if (editData?.id) {
        await updateAnnouncement(editData.id, finalData);
        toast.success("Announcement updated successfully!");
      } else {
        await createAnnouncementAndNotify({
          ...finalData,
          createdBy: user.uid,
        });
        toast.success("Announcement created!");
      }
      setOpen(false);
    } catch (error: any) {
      toast.error(error?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="md">
      <DialogTitle>
        <div className="flex justify-between">
          <h5 className="modal-title">{editData ? "Edit Announcement" : "Add New Announcement"}</h5>
          <button onClick={() => setOpen(false)} type="button" className="bd-btn-close">
            <i className="fa-solid fa-xmark-large"></i>
          </button>
        </div>
      </DialogTitle>
      <DialogContent className="common-scrollbar overflow-y-auto">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-12 gap-y-5 gap-x-5">
            <div className="col-span-12">
              <InputField
                label="Title"
                id="title"
                register={register("title", { required: "Title is required" })}
                error={errors.title}
              />
            </div>
            <div className="col-span-12 md:col-span-6">
              {/* FIXED: Added missing ID */}
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
                      className="w-full"
                    />
                  )}
                />
              </div>
            </div>
            <div className="col-span-12 md:col-span-6">
              {/* FIXED: Added missing ID */}
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
                      className="w-full"
                    />
                  )}
                />
              </div>
            </div>
            <div className="col-span-12">
              {/* FIXED: Added missing ID */}
              <FormLabel label="Target Audience" id="target" />
              <div className="grid grid-cols-2 gap-3 mt-2">
                {['all', 'managers', 'employees', 'specific'].map((target) => (
                  <label key={target} className="flex items-center gap-2 p-3 border rounded cursor-pointer">
                    <input type="radio" value={target} {...register("target")} />
                    <span className="capitalize">{target}</span>
                  </label>
                ))}
              </div>
            </div>
            {targetType === 'specific' && (
              <div className="col-span-12">
                {/* FIXED: Added missing ID */}
                <FormLabel label="Select Users" id="userSearch" />
                <input
                  type="text"
                  placeholder="Search users..."
                  className="w-full p-2 border rounded mb-2"
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <div className="max-h-40 overflow-y-auto border rounded">
                  {filteredUsers.map(u => (
                    <div key={u.id} onClick={() => toggleUserSelection(u)} className={`p-2 cursor-pointer ${selectedUsers.some(s => s.id === u.id) ? 'bg-blue-100' : ''}`}>
                      {u.name} ({u.role})
                    </div>
                  ))}
                </div>
              </div>
            )}
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
          <div className="flex justify-end gap-3 mt-5">
            <button className="btn btn-danger" type="button" onClick={() => setOpen(false)}>Cancel</button>
            <button className="btn btn-primary" type="submit" disabled={loading}>{loading ? "Saving..." : "Submit"}</button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddNewAnnouncementModal;