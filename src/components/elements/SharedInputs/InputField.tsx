import ErrorMessage from "@/components/error-message/ErrorMessage";
import React from "react";
import { FieldError } from "react-hook-form";

interface InputFieldProps {
  label?: string;
  id: string;
  type?: string;
  required?: boolean;
  // Using any here allows the component to accept registers from dynamic field arrays
  register?: any; 
  error?: FieldError;
  groupInput?: boolean;
  groupText?: string;
  isTextArea?: boolean;
  defaultValue?: string | number;
  placeholder?: string;
  readOnly?: boolean;
}

const InputField: React.FC<InputFieldProps> = ({
  label,
  id,
  type = "text",
  groupText = "FCFA",
  required = false,
  register,
  error,
  groupInput = false,
  isTextArea = false,
  defaultValue,
  placeholder,
  readOnly = false,
}) => {
  const inputClass = `form-control ${error ? "is-invalid" : ""}`;

  return (
    <div className="form__input-box">
      {label && (
        <div className="form__input-title">
          <label htmlFor={id}>
            {label} {required && <span className="text-danger">*</span>}
          </label>
        </div>
      )}
      
      {!isTextArea ? (
        <div className={groupInput ? "input-group" : "form__input"}>
          {groupInput && <span className="input-group-text">{groupText}</span>}
          <input
            className={inputClass}
            id={id}
            type={type}
            placeholder={placeholder}
            defaultValue={defaultValue}
            readOnly={readOnly}
            {...(register ? register : {})}
          />
        </div>
      ) : (
        <div className="form__input">
          <textarea
            id={id}
            className={inputClass}
            placeholder={placeholder}
            defaultValue={defaultValue}
            readOnly={readOnly}
            {...(register ? register : {})}
          ></textarea>
        </div>
      )}
      {error && <ErrorMessage error={error.message} />}
    </div>
  );
};

export default InputField;