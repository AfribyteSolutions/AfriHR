// components/UpdateExperienceDetailsModal.tsx
import React, { useState, useEffect } from "react";
import { Dialog, DialogTitle, DialogContent } from "@mui/material";
import { useForm, useFieldArray } from "react-hook-form";
import InputField from "@/components/elements/SharedInputs/InputField";
import FormLabel from "@/components/elements/SharedInputs/FormLabel";
import DatePicker from "react-datepicker";
import { toast } from "sonner";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { IEmployee, WorkExperience } from "@/interface"; // Centralized WorkExperience type

interface WorkExperienceFormData {
  experiences: WorkExperience[];
}

interface PropsType {
  open: boolean;
  setOpen: (open: boolean) => void;
  data: IEmployee;
  experiences: WorkExperience[];
}

const UpdateExperienceDetailsModal = ({ open, setOpen, data, experiences }: PropsType) => {
  const [loading, setLoading] = useState(false);
  
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
    watch,
  } = useForm<WorkExperienceFormData>({
    defaultValues: {
      experiences: experiences.length > 0 ? experiences : [
        {
          id: '',
          companyName: '',
          position: '',
          periodFrom: null,
          periodTo: null,
          description: '',
          isCurrentJob: false
        }
      ]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "experiences"
  });

  const handleToggle = () => setOpen(!open);

  // Helper function to convert Firestore timestamp to Date
  const convertTimestampToDate = (timestamp: any): Date | null => {
    if (!timestamp) return null;
    
    // Handle Firestore Timestamp objects
    if (timestamp && typeof timestamp.toDate === 'function') {
      return timestamp.toDate();
    }
    
    // Handle Date objects
    if (timestamp instanceof Date) {
      return timestamp;
    }
    
    // Handle string dates
    if (typeof timestamp === 'string') {
      return new Date(timestamp);
    }
    
    // Handle number timestamps
    if (typeof timestamp === 'number') {
      return new Date(timestamp);
    }
    
    return null;
  };

  // Reset form when experiences prop changes
  useEffect(() => {
    const formattedExperiences = experiences.length > 0 
      ? experiences.map(exp => ({
          ...exp,
          periodFrom: convertTimestampToDate(exp.periodFrom),
          periodTo: convertTimestampToDate(exp.periodTo),
        }))
      : [{
          id: '',
          companyName: '',
          position: '',
          periodFrom: null,
          periodTo: null,
          description: '',
          isCurrentJob: false
        }];
    
    reset({ experiences: formattedExperiences });
  }, [experiences, reset]);

  // Add new experience entry
  const addExperience = () => {
    append({
      id: '',
      companyName: '',
      position: '',
      periodFrom: null,
      periodTo: null,
      description: '',
      isCurrentJob: false
    });
  };

  // Remove experience entry
  const removeExperience = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  // Handle form submission
  const onSubmit = async (formData: WorkExperienceFormData) => {
    try {
      setLoading(true);

      if (!data?.uid) {
        throw new Error("Employee UID is missing");
      }

      // Filter out empty experiences and prepare data
      const validExperiences = formData.experiences
        .filter(exp => exp.companyName.trim() || exp.position.trim())
        .map(exp => ({
          id: exp.id || `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          companyName: exp.companyName.trim(),
          position: exp.position.trim(),
          periodFrom: exp.periodFrom,
          periodTo: exp.isCurrentJob ? null : exp.periodTo,
          description: exp.description?.trim() || '',
          isCurrentJob: exp.isCurrentJob,
          updatedAt: new Date()
        }));

      console.log("Updating work experiences:", validExperiences);

      // Update the 'users' document instead of 'employees'
      const userRef = doc(db, "users", data.uid);
      
      // Attempt to update the user document. If it doesn't exist, updateDoc will throw an error.
      // This assumes the user document always exists.
      await updateDoc(userRef, {
        workExperience: validExperiences,
        updatedAt: new Date(),
      });

      toast.success("Work experience updated successfully!");
      
      setTimeout(() => {
        setOpen(false);
      }, 1500);
      
    } catch (error: any) {
      console.error("Error updating work experience:", error);
      
      if (error.code === 'permission-denied') {
        toast.error("Permission denied. You may not have access to update this information.");
      } else if (error.code === 'not-found') {
        toast.error("User record not found. Please ensure the user account exists.");
      } else {
        toast.error(`Update failed: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleToggle} fullWidth maxWidth="lg">
      <DialogTitle>
        <div className="flex justify-between">
          <h5 className="modal-title">Update Work Experience</h5>
          <button
            onClick={handleToggle}
            type="button"
            className="bd-btn-close"
          >
            <i className="fa-solid fa-xmark-large"></i>
          </button>
        </div>
      </DialogTitle>
      
      <DialogContent className="common-scrollbar max-h-screen overflow-y-auto">
        <form onSubmit={handleSubmit(onSubmit)}>
          {fields.map((field, index) => (
            <div key={field.id} className="card__wrapper mb-[20px] relative">
              <div className="flex justify-between items-center mb-4">
                <h6 className="card__sub-title">
                  Work Experience {index + 1}
                </h6>
                {fields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeExperience(index)}
                    className="text-red-500 hover:text-red-700 p-2"
                    title="Remove this experience"
                  >
                    <i className="fa-solid fa-trash"></i>
                  </button>
                )}
              </div>
              
              <div className="grid grid-cols-12 gap-x-6 maxXs:gap-x-0 gap-y-6">
                <div className="col-span-12 md:col-span-6">
                  <InputField
                    label="Company Name"
                    id={`experiences.${index}.companyName`}
                    type="text"
                    required={false}
                    register={register(`experiences.${index}.companyName`)}
                    error={errors.experiences?.[index]?.companyName}
                  />
                </div>
                
                <div className="col-span-12 md:col-span-6">
                  <InputField
                    label="Position/Job Title"
                    id={`experiences.${index}.position`}
                    type="text"
                    required={false}
                    register={register(`experiences.${index}.position`)}
                    error={errors.experiences?.[index]?.position}
                  />
                </div>
                
                <div className="col-span-12 md:col-span-6">
                  <FormLabel
                    label="Start Date"
                    id={`experiences.${index}.periodFrom`}
                    optional={true}
                  />
                  <div className="datepicker-style">
                    <DatePicker
                      id={`experiences.${index}.periodFrom`}
                      selected={watch(`experiences.${index}.periodFrom`)}
                      onChange={(date) => {
                        register(`experiences.${index}.periodFrom`).onChange({
                          target: { value: date, name: `experiences.${index}.periodFrom` }
                        });
                      }}
                      showYearDropdown
                      showMonthDropdown
                      useShortMonthInDropdown
                      showPopperArrow={false}
                      peekNextMonth
                      dropdownMode="select"
                      isClearable
                      dateFormat="dd/MM/yyyy"
                      placeholderText="Start Date"
                      className="w-full"
                      maxDate={new Date()}
                    />
                  </div>
                </div>
                
                <div className="col-span-12 md:col-span-6">
                  <FormLabel
                    label="End Date"
                    id={`experiences.${index}.periodTo`}
                    optional={true}
                  />
                  <div className="datepicker-style">
                    <DatePicker
                      id={`experiences.${index}.periodTo`}
                      selected={watch(`experiences.${index}.isCurrentJob`) ? null : watch(`experiences.${index}.periodTo`)}
                      onChange={(date) => {
                        register(`experiences.${index}.periodTo`).onChange({
                          target: { value: date, name: `experiences.${index}.periodTo` }
                        });
                      }}
                      showYearDropdown
                      showMonthDropdown
                      useShortMonthInDropdown
                      showPopperArrow={false}
                      peekNextMonth
                      dropdownMode="select"
                      isClearable
                      dateFormat="dd/MM/yyyy"
                      placeholderText="End Date"
                      className="w-full"
                      maxDate={new Date()}
                      disabled={watch(`experiences.${index}.isCurrentJob`)}
                    />
                  </div>
                  
                  <div className="mt-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        className="mr-2"
                        {...register(`experiences.${index}.isCurrentJob`)}
                      />
                      <span className="text-sm">Currently working here</span>
                    </label>
                  </div>
                </div>
                
                <div className="col-span-12">
                  <InputField
                    label="Job Description (Optional)"
                    id={`experiences.${index}.description`}
                    type="textarea"
                    required={false}
                    register={register(`experiences.${index}.description`)}
                    error={errors.experiences?.[index]?.description}
                  />
                </div>
              </div>
            </div>
          ))}
          
          <div className="flex justify-center mb-6">
            <button
              type="button"
              onClick={addExperience}
              className="btn btn-outline-primary"
            >
              <i className="fa-solid fa-plus mr-2"></i>
              Add Another Experience
            </button>
          </div>
          
          <div className="submit__btn text-center">
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={isSubmitting || loading}
            >
              {isSubmitting || loading ? (
                <>
                  <i className="fa-solid fa-spinner animate-spin mr-2"></i>
                  Updating...
                </>
              ) : (
                "Update Work Experience"
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UpdateExperienceDetailsModal;