"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import {
  doctorRegisterSchema,
  type DoctorRegisterInput,
} from "@/lib/schemas/doctor";
import { useRegisterDoctorMutation } from "@/lib/hooks/useAuthMutations";
import { Button } from "@/components/ui/button";
import {
  FileText,
  ImageUp,
  Loader2,
  LockKeyhole,
  Stethoscope,
  UserRound,
} from "lucide-react";

const SPECIALIZATIONS = [
  "Cardiology",
  "Dermatology",
  "Neurology",
  "Orthopedics",
  "Pediatrics",
  "Psychiatry",
  "Radiology",
  "Surgery",
  "Internal Medicine",
  "Family Medicine",
  "Obstetrics & Gynecology",
  "Oncology",
  "Ophthalmology",
  "Otolaryngology",
  "Urology",
  "Gastroenterology",
  "Rheumatology",
  "Endocrinology",
];

export default function DoctorRegisterPage() {
  const registerMutation = useRegisterDoctorMutation();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setValue,
  } = useForm<DoctorRegisterInput>({
    resolver: zodResolver(doctorRegisterSchema),
  });

  const specializations = watch("specializations") || [];
  const profilePicture = watch("profilePicture");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setValue("profilePicture", (event.target?.result as string) || "");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSpecializationChange = (spec: string) => {
    const updated = specializations.includes(spec)
      ? specializations.filter((s) => s !== spec)
      : [...specializations, spec];
    setValue("specializations", updated);
  };

  const onSubmit = (data: DoctorRegisterInput) => {
    registerMutation.mutate(data);
  };

  const getFieldError = (field: keyof DoctorRegisterInput) =>
    errors[field]?.message;

  return (
    <div className="min-h-screen bg-linear-to-b from-blue-50 to-white py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Professional Profile
            </h1>
            <p className="text-gray-600">
              Please provide your verified medical credentials to begin your
              journey with PulseCare.
            </p>
          </div>

          {/* Registration Form */}
          <form
            onSubmit={handleSubmit(onSubmit)}
            method="POST"
            className="space-y-6"
          >
            {/* Professional Details */}
            <fieldset className="border-t pt-6">
              <legend className="mb-4 flex items-center text-sm font-semibold text-blue-600">
                <UserRound className="mr-2 h-4 w-4" />
                PROFESSIONAL DETAILS
              </legend>

              <div className="space-y-4">
                {/* First and Middle Name */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      placeholder="Jane"
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        getFieldError("firstName")
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                      {...register("firstName")}
                    />
                    {getFieldError("firstName") && (
                      <p className="text-red-600 text-sm mt-1">
                        {getFieldError("firstName")}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Middle Name (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="Marie"
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        getFieldError("middleName")
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                      {...register("middleName")}
                    />
                  </div>
                </div>

                {/* Last Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    placeholder="Smith"
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      getFieldError("lastName")
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                    {...register("lastName")}
                  />
                  {getFieldError("lastName") && (
                    <p className="text-red-600 text-sm mt-1">
                      {getFieldError("lastName")}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="jane.smith@example.com"
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      getFieldError("email")
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                    {...register("email")}
                  />
                  {getFieldError("email") && (
                    <p className="text-red-600 text-sm mt-1">
                      {getFieldError("email")}
                    </p>
                  )}
                </div>

                {/* Profile Picture */}
                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                    <ImageUp className="h-4 w-4" />
                    Profile Picture (Optional)
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                      id="profile-picture"
                    />
                    <label
                      htmlFor="profile-picture"
                      className="cursor-pointer text-gray-600 hover:text-gray-900"
                    >
                      <div className="text-2xl mb-2">📸</div>
                      <p className="text-sm">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">
                        PNG, JPG (max. 5MB)
                      </p>
                    </label>
                  </div>
                  {profilePicture && (
                    <p className="text-sm text-green-600 mt-2">
                      ✓ Image uploaded
                    </p>
                  )}
                </div>
              </div>
            </fieldset>

            {/* Specialization */}
            <fieldset className="border-t pt-6">
              <legend className="mb-4 flex items-center text-sm font-semibold text-blue-600">
                <Stethoscope className="mr-2 h-4 w-4" />
                SPECIALIZATION
              </legend>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Specialization(s) *
                </label>
                <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto p-4 border border-gray-300 rounded-lg">
                  {SPECIALIZATIONS.map((spec) => (
                    <label
                      key={spec}
                      className="flex items-center space-x-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={specializations.includes(spec)}
                        onChange={() => handleSpecializationChange(spec)}
                        className="w-4 h-4 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{spec}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Selected Specializations */}
              {specializations.length > 0 && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Selected Specialization(s):
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {specializations.map((spec) => (
                      <span
                        key={spec}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-200 text-blue-800"
                      >
                        {spec}
                        <button
                          type="button"
                          onClick={() => handleSpecializationChange(spec)}
                          className="ml-2 text-blue-600 hover:text-blue-900"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {getFieldError("specializations") && (
                <p className="text-red-600 text-sm mt-2">
                  {getFieldError("specializations")}
                </p>
              )}
            </fieldset>

            {/* Professional Bio */}
            <fieldset className="border-t pt-6">
              <legend className="mb-4 flex items-center text-sm font-semibold text-blue-600">
                <FileText className="mr-2 h-4 w-4" />
                PROFESSIONAL BIO (OPTIONAL)
              </legend>

              <div>
                <textarea
                  placeholder="Tell patients about your experience, approach to care, and what to expect..."
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${
                    getFieldError("bio") ? "border-red-500" : "border-gray-300"
                  }`}
                  rows={4}
                  {...register("bio")}
                />
                {getFieldError("bio") && (
                  <p className="text-red-600 text-sm mt-1">
                    {getFieldError("bio")}
                  </p>
                )}
              </div>
            </fieldset>

            {/* Authentication */}
            <fieldset className="border-t pt-6">
              <legend className="mb-4 flex items-center text-sm font-semibold text-blue-600">
                <LockKeyhole className="mr-2 h-4 w-4" />
                AUTHENTICATION
              </legend>

              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    getFieldError("password")
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                  {...register("password")}
                />
                {getFieldError("password") && (
                  <p className="text-red-600 text-sm mt-1">
                    {getFieldError("password")}
                  </p>
                )}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className={`w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      getFieldError("confirmPassword")
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                    {...register("confirmPassword")}
                  />
                  {getFieldError("confirmPassword") && (
                    <p className="mt-1 text-sm text-red-600">
                      {getFieldError("confirmPassword")}
                    </p>
                  )}
                </div>
              </div>
            </fieldset>

            {/* Terms Agreement */}
            <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg">
              <input
                type="checkbox"
                className="mt-1 w-4 h-4 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                {...register("agreeToTerms")}
              />
              <label className="text-sm text-gray-700">
                I agree to the{" "}
                <Link href="/terms" className="text-blue-600 hover:underline">
                  Terms of Service
                </Link>
                . I certify that the information provided is accurate and that I
                am a licensed healthcare professional.
              </label>
            </div>
            {getFieldError("agreeToTerms") && (
              <p className="text-red-600 text-sm">
                {getFieldError("agreeToTerms")}
              </p>
            )}

            {/* Submit Button */}
            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={registerMutation.isPending}
                className="flex-1"
                size="lg"
              >
                {registerMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Completing Registration...
                  </>
                ) : (
                  <>
                    Complete Registration
                    <span className="ml-2">→</span>
                  </>
                )}
              </Button>
              <Link href="/" className="flex-1">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  size="lg"
                >
                  Already have an account?
                </Button>
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
