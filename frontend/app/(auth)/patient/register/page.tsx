"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState } from "react";
import {
  patientRegisterSchema,
  type PatientRegisterInput,
} from "@/lib/schemas/patient";
import { useRegisterPatientMutation } from "@/lib/hooks/useAuthMutations";
import { Button } from "@/components/ui/button";
import {
  Cake,
  HeartPulse,
  ImageUp,
  Loader2,
  LockKeyhole,
  MapPin,
  Phone,
  Ruler,
  Scale,
  ShieldAlert,
  UserRound,
} from "lucide-react";

export default function PatientRegisterPage() {
  const registerMutation = useRegisterPatientMutation();
  const [profileFile, setProfileFile] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PatientRegisterInput>({
    resolver: zodResolver(patientRegisterSchema),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileFile(file);
    }
  };

  const onSubmit = (data: PatientRegisterInput) => {
    registerMutation.mutate({
      ...data,
      profileFile,
    });
  };

  const getFieldError = (field: keyof PatientRegisterInput) =>
    errors[field]?.message;

  return (
    <div className="min-h-screen bg-linear-to-b from-blue-50 to-white py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Patient Registration
            </h1>
            <p className="text-gray-600">
              Please provide your details to create your secure clinical
              account.
            </p>
          </div>

          {/* Registration Form */}
          <form
            onSubmit={handleSubmit(onSubmit)}
            method="POST"
            className="space-y-6"
          >
            {/* Identity Details */}
            <fieldset className="border-t pt-6">
              <legend className="mb-4 flex items-center text-sm font-semibold text-blue-600">
                <UserRound className="mr-2 h-4 w-4" />
                IDENTITY DETAILS
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
                      placeholder="Jonathan"
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
                      placeholder="Michael"
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
                    placeholder="Doe"
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

                {/* Date of Birth */}
                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Cake className="h-4 w-4" />
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      getFieldError("birthday")
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                    {...register("birthday")}
                  />
                  {getFieldError("birthday") && (
                    <p className="text-red-600 text-sm mt-1">
                      {getFieldError("birthday")}
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
                  {profileFile && (
                    <p className="text-sm text-green-600 mt-2">
                      ✓ {profileFile.name}
                    </p>
                  )}
                </div>
              </div>
            </fieldset>

            {/* Contact Information */}
            <fieldset className="border-t pt-6">
              <legend className="mb-4 flex items-center text-sm font-semibold text-blue-600">
                <Phone className="mr-2 h-4 w-4" />
                CONTACT INFORMATION
              </legend>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="09XXXXXXXXXX or +639XXXXXXXXXX"
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      getFieldError("phone")
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                    {...register("phone")}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="j.doe@example.com"
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
              </div>
            </fieldset>

            {/* Health Information */}
            <fieldset className="border-t pt-6">
              <legend className="mb-4 flex items-center text-sm font-semibold text-blue-600">
                <HeartPulse className="mr-2 h-4 w-4" />
                HEALTH INFORMATION
              </legend>

              <div className="space-y-4">
                {/* Weight and Height */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                      <Scale className="h-4 w-4" />
                      Weight (kg)
                    </label>
                    <input
                      type="number"
                      placeholder="70"
                      step="0.1"
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        getFieldError("weight")
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                      min="1"
                      {...register("weight", { valueAsNumber: true })}
                    />
                  </div>
                  <div>
                    <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                      <Ruler className="h-4 w-4" />
                      Height (cm)
                    </label>
                    <input
                      type="number"
                      placeholder="175"
                      step="0.1"
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        getFieldError("height")
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                      min="1"
                      {...register("height", { valueAsNumber: true })}
                    />
                  </div>
                </div>

                {/* Medical History */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Medical History (Optional)
                  </label>
                  <textarea
                    placeholder="Enter conditions separated by commas (e.g., Diabetes, Hypertension)"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={3}
                    {...register("medicalHistory")}
                  />
                </div>

                {/* Address */}
                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                    <MapPin className="h-4 w-4" />
                    Address (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="123 Main St, City, State 12345"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    {...register("address")}
                  />
                </div>
              </div>
            </fieldset>

            {/* Emergency Contact */}
            <fieldset className="border-t pt-6">
              <legend className="mb-4 flex items-center text-sm font-semibold text-blue-600">
                <ShieldAlert className="mr-2 h-4 w-4" />
                EMERGENCY CONTACT (OPTIONAL)
              </legend>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Emergency Contact Name
                  </label>
                  <input
                    type="text"
                    placeholder="John Smith"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    {...register("emergencyName")}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Emergency Contact Phone
                  </label>
                  <input
                    type="tel"
                    placeholder="09XXXXXXXXXX or +639XXXXXXXXXX"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    {...register("emergencyPhone")}
                  />
                </div>
              </div>
            </fieldset>

            {/* Authentication */}
            <fieldset className="border-t pt-6">
              <legend className="mb-4 flex items-center text-sm font-semibold text-blue-600">
                <LockKeyhole className="mr-2 h-4 w-4" />
                AUTHENTICATION
              </legend>

              <div className="space-y-4">
                <div>
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
                </div>
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
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-blue-600 hover:underline">
                  Privacy Policy
                </Link>
                . I understand that my health information will be protected with
                HIPAA compliance.
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
                    Creating Account...
                  </>
                ) : (
                  "Create Account"
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
