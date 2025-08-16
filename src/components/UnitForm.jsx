// src/components/UnitForm.jsx
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { DataStore } from "aws-amplify";
import { Unit } from "../models";

/**
 * Props:
 *  - unit        (optional) existing Unit object → edit mode
 *  - propertyID  (required when creating) ID of parent Property
 *  - onSuccess   (optional) callback after save
 *  - onCancel    (optional) cancel handler
 */
export default function UnitForm({ unit, propertyID, onSuccess, onCancel }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  // Pre-fill when editing
  useEffect(() => {
    if (unit) {
      reset({
        name: unit.name,
        sleeps: unit.sleeps,
        icalURL: unit.icalURL ?? "",
      });
    }
  }, [unit, reset]);

  // ────────────────────────── Save handler
  const onSubmit = async (data) => {
    try {
      if (unit) {
        // Edit existing
        await DataStore.save(
          Unit.copyOf(unit, (draft) => {
            draft.name = data.name;
            draft.sleeps = parseInt(data.sleeps, 10);
            draft.icalURL = data.icalURL;
          })
        );
      } else {
        // Create new
        await DataStore.save(
          new Unit({
            name: data.name,
            sleeps: parseInt(data.sleeps, 10),
            icalURL: data.icalURL,
            propertyID, // comes from parent page
          })
        );
      }
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error("Unit save failed:", err);
      alert("Sorry, something went wrong saving this unit.");
    }
  };

  // ────────────────────────── UI
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-4">
      <div>
        <label className="block font-semibold mb-1">Name *</label>
        <input
          className="input w-full"
          {...register("name", { required: true, maxLength: 60 })}
        />
        {errors.name && (
          <p className="text-red-500 text-sm">Name is required.</p>
        )}
      </div>

      <div>
        <label className="block font-semibold mb-1">Sleeps *</label>
        <input
          className="input w-full"
          type="number"
          min="1"
          {...register("sleeps", {
            required: true,
            min: 1,
            valueAsNumber: true,
          })}
        />
        {errors.sleeps && (
          <p className="text-red-500 text-sm">Enter a number ≥ 1.</p>
        )}
      </div>

      <div>
        <label className="block font-semibold mb-1">iCal URL *</label>
        <input
          className="input w-full"
          placeholder="https://calendar.airbnb.com/…"
          {...register("icalURL", { required: true })}
        />
        {errors.icalURL && (
          <p className="text-red-500 text-sm">iCal URL is required.</p>
        )}
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn btn-primary"
        >
          {unit ? "Save Changes" : "Add Unit"}

