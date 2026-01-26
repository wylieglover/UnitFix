// src/pages/SignUp.tsx
import { Link } from "react-router-dom";
import { RegisterOrganizationForm } from "../features/organizations/components/RegisterOrganizationForm";

export const SignUp = () => {
  return (
    <div className="flex flex-1 flex-col items-center justify-center py-12 px-6">
      <section className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Start your{" "}
            <span className="bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
              free trial
            </span>
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Create your organization and get started in minutes.
          </p>
        </div>

        <RegisterOrganizationForm />

        <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link to="/signin" className="font-semibold text-blue-600 hover:text-blue-700 underline-offset-4 hover:underline">
            Sign in
          </Link>
        </p>
      </section>
    </div>
  );
};