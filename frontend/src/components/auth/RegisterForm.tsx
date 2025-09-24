import { useState } from "react";
import { useTranslation } from 'react-i18next';
import { Link } from "react-router-dom";
import { EyeCloseIcon, EyeIcon } from "../../icons";
import { apiUrl } from "../../config/api";

export default function RegisterForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const data = {
      firstname: formData.get("firstname") as string,
      lastname: formData.get("lastname") as string,
      email: formData.get("email") as string,
      password: formData.get("password") as string,
    };
    try {
        const res = await fetch(apiUrl("/api/register"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errData = await res.json();
        setError(errData.error || "Registration failed");
      } else {
        setSuccess("Registration successful! Please login.");
        form.reset();
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  const { t } = useTranslation();
  return (
    <div className="flex flex-col flex-1">
      <div className="w-full max-w-md pt-10 mx-auto"></div>
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              {t('register.title')}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('register.enterDescription')}
            </p>
          </div>
          <div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-5"></div>
            <form onSubmit={handleSubmit}>
              <div className="space-y-5">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  {/* <!-- First Name --> */}
                  <div className="sm:col-span-1">
                    <label htmlFor="firstname" className="block text-sm mb-1 text-gray-700 dark:text-gray-200">
                      {t('register.firstName')}<span className="text-error-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="firstname"
                      name="firstname"
                      placeholder={t('register.placeholderFirst')}
                      className="w-full rounded-md border px-3 py-2 border-gray-200 bg-white text-gray-900 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500"
                    />
                  </div>
                  {/* <!-- Last Name --> */}
                  <div className="sm:col-span-1">
                    <label htmlFor="lastname" className="block text-sm mb-1 text-gray-700 dark:text-gray-200">
                      {t('register.lastName')}<span className="text-error-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="lastname"
                      name="lastname"
                      placeholder={t('register.placeholderLast')}
                      className="w-full rounded-md border px-3 py-2 border-gray-200 bg-white text-gray-900 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500"
                    />
                  </div>
                </div>
                {/* <!-- Email --> */}
                <div>
                  <label htmlFor="email" className="block text-sm mb-1 text-gray-700 dark:text-gray-200">
                    {t('login.email')}<span className="text-error-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                      placeholder={t('register.placeholderEmail')}
                    autoComplete="email"
                    className="w-full rounded-md border px-3 py-2 border-gray-200 bg-white text-gray-900 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500"
                  />
                </div>
                {/* <!-- Password --> */}
                <div>
                  <label htmlFor="register-password" className="block text-sm mb-1 text-gray-700 dark:text-gray-200">
                    {t('login.password')}<span className="text-error-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="register-password"
                      name="password"
                      placeholder={t('register.placeholderPassword')}
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                 className="w-full rounded-md border px-3 py-2 border-gray-200 bg-white text-gray-900 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500"
                    />
                    <span
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                    >
                      {showPassword ? (
                        <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      ) : (
                        <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      )}
                    </span>
                  </div>
                </div>
                {/* <!-- Checkbox and terms removed as requested --> */}
                {/* <!-- Button --> */}
                <div>
                  <button
                    type="submit"
                    className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white transition rounded-lg bg-brand-500 shadow-theme-xs hover:bg-brand-600"
                    disabled={loading}
                  >
                    {loading ? t('register.registering') : t('register.registerButton')}
                  </button>
                  {error && (
                    <div className="mt-2 text-sm text-red-600 dark:text-red-400 text-center">
                      {error}
                    </div>
                  )}
                  {success && (
                    <div className="mt-2 text-sm text-green-600 dark:text-green-400 text-center">
                      {success}
                    </div>
                  )}
                </div>
              </div>
            </form>

            <div className="mt-5">
              <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
                {t('auth.alreadyHaveAccount')} {""}
                <Link
                  to="/"
                  className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
                >
                  {t('login.title')}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
