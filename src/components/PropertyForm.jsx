// src/components/PropertyForm.jsx
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { DataStore } from "aws-amplify";
import { Property } from "../models";

/**
 * Props:
 *  - property   (optional): if passed, edits existing property
 *  - onSuccess  (required): callback after successful save
 *  - onCancel   (optional): cancel handler
 */
export default function PropertyForm({ property, onSuccess, onCancel }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  useEffect(() => {
    if (property) {
      reset({
        name: property.name || "",
        address: property.address || "",
        sleeps: property.sleeps || 1,
      });
    } else {
      reset({ name: "", address: "", sleeps: 1 });
    }
  }, [property, reset]);

  const onSubmit = async (data) => {
    try {
      // ✅ Create a clean, valid payload
      const cleanPayload = {
        name: String(data.name).trim(),
        address: String(data.address).trim(),
        sleeps: parseInt(data.sleeps, 10) || 1,
      };

      console.log("Final Property input (no ownerId):", cleanPayload);

      if (property) {
        await DataStore.save(
          Property.copyOf(property, (draft) => {
            draft.name = cleanPayload.name;
            draft.address = cleanPayload.address;
            draft.sleeps = cleanPayload.sleeps;
          })
        );
      } else {
        await DataStore.save(new Property(cleanPayload));
      }

      onSuccess();
    } catch (err) {
      console.error("Property save failed:", err);
      alert("Could not save property. See console for details.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-4">
      <div>
        <label className="block font-semibold mb-1">Name *</label>
        <input
          className="input w-full"
          {...register("name", { required: true, maxLength: 60 })}
        />
        {errors.name && <p className="text-red-500 text-sm">Required</p>}
      </div>

      <div>
        <label className="block font-semibold mb-1">Address *</label>
        <input
          className="input w-full"
          {...register("address", { required: true })}
        />
        {errors.address && <p className="text-red-500 text-sm">Required</p>}
      </div>

      <div>
        <label className="block font-semibold mb-1">Sleeps *</label>
        <input
          type="number"
          min="1"
          className="input w-full"
          {...register("sleeps", {
            required: true,
            valueAsNumber: true,
            min: 1,
          })}
        />
        {errors.sleeps && (
          <p className="text-red-500 text-sm">Enter number ≥ 1</p>
        )}
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn btn-primary"
        >
          {property ? "Save Changes" : "Add Property"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-secondary"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
