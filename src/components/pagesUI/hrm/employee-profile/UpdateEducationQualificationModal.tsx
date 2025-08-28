import React, { useState, useEffect } from "react";
import { Dialog, DialogTitle, DialogContent } from "@mui/material";
import { useForm, useFieldArray } from "react-hook-form";
import InputField from "@/components/elements/SharedInputs/InputField";
import FormLabel from "@/components/elements/SharedInputs/FormLabel";
import { toast } from "sonner";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { IEmployee, IEducation } from "@/interface"; // Import IEducation

interface EducationFormData {
  education: IEducation[];
}

interface PropsType {
  open: boolean;
  setOpen: (open: boolean) => void;
  data: IEmployee; // Pass the entire employee data with uid
  educationList: IEducation[]; // Pass existing education data
}

const UpdateEducationQualificationModal = ({ open, setOpen, data, educationList }: PropsType) => {
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<EducationFormData>({
    defaultValues: {
      education: educationList.length > 0 ? educationList : [
        {
          id: '',
          institute: '',
          degree: '',
          yearStart: '',
          yearEnd: '',
          description: ''
        }
      ]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "education"
  });

  const handleToggle = () => setOpen(!open);

  // Reset form when educationList prop changes (e.g., when modal opens with new data)
  useEffect(() => {
    reset({
      education: educationList.length > 0 ? educationList : [
        {
          id: '',
          institute: '',
          degree: '',
          yearStart: '',
          yearEnd: '',
          description: ''
        }
      ]
    });
  }, [educationList, reset]);

  // Add new education entry
  const addEducation = () => {
    append({
      id: '',
      institute: '',
      degree: '',
      yearStart: '',
      yearEnd: '',
      description: ''
    });
  };

  // Remove education entry
  const removeEducation = (index: number) => {
    if (fields.length > 1) { // Ensure at least one field remains
      remove(index);
    }
  };

  // Handle form submission
  const onSubmit = async (formData: EducationFormData) => {
    try {
      setLoading(true);

      if (!data?.uid) {
        throw new Error("User UID is missing. Cannot update education.");
      }

      // Filter out empty education entries and prepare data
      const validEducation = formData.education
        .filter(edu => edu.institute.trim() || edu.degree.trim()) // Keep only entries with institute or degree
        .map(edu => ({
          id: edu.id || `edu_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          institute: edu.institute.trim(),
          degree: edu.degree.trim(),
          yearStart: edu.yearStart.trim(),
          yearEnd: edu.yearEnd.trim(),
          description: edu.description?.trim() || '',
        }));

      console.log("Updating education:", validEducation);

      // Reference the user document in the 'users' collection
      const userRef = doc(db, "users", data.uid);
      
      // Update the 'education' field in the user document
      await updateDoc(userRef, {
        education: validEducation,
        updatedAt: new Date(), // Add an updatedAt timestamp
      });

      toast.success("Education details updated successfully!");
      
      setTimeout(() => {
        setOpen(false); // Close modal after success
      }, 1500);
      
    } catch (error: any) {
      console.error("Error updating education:", error);
      
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
          <h5 className="modal-title">Update Education Qualification</h5>
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
                  Education {index + 1}
                </h6>
                {fields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeEducation(index)}
                    className="text-red-500 hover:text-red-700 p-2"
                    title="Remove this education entry"
                  >
                    <i className="fa-solid fa-trash"></i>
                  </button>
                )}
              </div>
              
              <div className="grid grid-cols-12 gap-x-6 maxXs:gap-x-0 gap-y-6">
                <div className="col-span-12 md:col-span-6">
                  <InputField
                    label="Institution Name"
                    id={`education.${index}.institute`}
                    type="text"
                    required={true} // Changed to required as it's a primary field
                    register={register(`education.${index}.institute`, { required: "Institution name is required" })}
                    error={errors.education?.[index]?.institute}
                  />
                </div>
                
                <div className="col-span-12 md:col-span-6">
                  <InputField
                    label="Degree/Major"
                    id={`education.${index}.degree`}
                    type="text"
                    required={true} // Changed to required
                    register={register(`education.${index}.degree`, { required: "Degree is required" })}
                    error={errors.education?.[index]?.degree}
                  />
                </div>
                
                <div className="col-span-12 md:col-span-6">
                  <InputField
                    label="Start Year"
                    id={`education.${index}.yearStart`}
                    type="text" // Can use 'number' type for input, but 'text' allows for flexible input
                    required={true}
                    register={register(`education.${index}.yearStart`, { required: "Start year is required" })}
                    error={errors.education?.[index]?.yearStart}
                  />
                </div>
                
                <div className="col-span-12 md:col-span-6">
                  <InputField
                    label="End Year"
                    id={`education.${index}.yearEnd`}
                    type="text" // Can use 'number' type for input
                    required={true}
                    register={register(`education.${index}.yearEnd`, { required: "End year is required" })}
                    error={errors.education?.[index]?.yearEnd}
                  />
                </div>

                <div className="col-span-12">
                  <InputField
                    label="Description (Optional)"
                    id={`education.${index}.description`}
                    type="textarea"
                    required={false}
                    register={register(`education.${index}.description`)}
                    error={errors.education?.[index]?.description}
                  />
                </div>
              </div>
            </div>
          ))}
          
          <div className="flex justify-center mb-6">
            <button
              type="button"
              onClick={addEducation}
              className="btn btn-outline-primary"
            >
              <i className="fa-solid fa-plus mr-2"></i>
              Add Another Education
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
                "Update Education"
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UpdateEducationQualificationModal;