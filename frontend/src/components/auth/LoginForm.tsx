import { useState } from "react";
import { useTranslation } from 'react-i18next';
import { EyeCloseIcon, EyeIcon } from "../../icons";
import Button from "../ui/button/Button";
import { Link } from "react-router-dom";
import { setUserData } from "../../utils/auth";
import { usePreloader } from "../../context/PreloaderContext";
import { apiUrl } from "../../config/api";

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { setShowPreloader } = usePreloader();
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const data = {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
    };
    try {
      console.log("Sending login request with data:", { email: data.email });
      const res = await fetch(apiUrl("/api/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      // Get response text first
      const responseText = await res.text();
      console.log("Server response:", responseText);

      if (!res.ok) {
        let errorMessage;
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.error || "Login failed";
        } catch {
          errorMessage = `Server error: ${responseText || res.statusText}`;
        }
        setError(errorMessage);
      } else {
        try {
          const user = JSON.parse(responseText);
          console.log("Login successful, user data:", user);

          if (!user.role) {
            throw new Error("User role not found in response");
          }

          // Simpan user data ke localStorage
          setUserData({
            id: user.id,
            role: user.role,
            email: user.email,
          });

          // Show preloader for 3 seconds then redirect everyone to /user/map
          setShowPreloader(true);
          setTimeout(() => {
            // Use relative navigation to work on deployed domains
            window.location.href = `/user/map`;
          }, 3000);
        } catch (e) {
          console.error("Error parsing user data:", e);
          setError("Invalid response from server");
        }
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              {t('login.title')}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('login.enterDescription')}
            </p>
          </div>
          <div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-5"></div>
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                <div>
                  <label htmlFor="login-email" className="block text-sm mb-1 text-gray-700 dark:text-gray-200">
                    {t('login.email')} <span className="text-error-500">*</span>
                  </label>
                  <input
                    id="login-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder={t('login.placeholderEmail')}
                    className="w-full rounded-md border px-3 py-2 border-gray-200 bg-white text-gray-900 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500"
                  />
                </div>
                <div>
                  <label htmlFor="login-password" className="block text-sm mb-1 text-gray-700 dark:text-gray-200">
                    {t('login.password')} <span className="text-error-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="login-password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder={t('login.placeholderPassword')}
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
                {/* Keep me logged in removed for lint clean */}
                <div>
                  <Button className="w-full" size="sm" disabled={loading}>
                    {loading ? t('login.loggingIn') : t('login.loginButton')}
                  </Button>
                  {error && (
                    <div className="mt-2 text-sm text-red-600 dark:text-red-400 text-center">
                      {error}
                    </div>
                  )}
                </div>
              </div>
            </form>

            <div className="mt-5">
              <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
                {t('auth.noAccount')} {""}
                <Link
                  to="/register"
                  className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
                >
                  {t('register.title')}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
