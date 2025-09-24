// import { useState } from "react"; // dihapus karena modal dihapus

import { useParams } from "react-router-dom";
import React from "react";
import { apiUrl, uploadUrl } from "../../config/api";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";

type User = {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  phone?: string;
  bio?: string;
  address?: string;
  country?: string;
  province?: string;
  city?: string;
  postalcode?: string;
  role?: string;
  userpic?: string;
};

export default function ViewProfile() {
  const { id } = useParams();
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(apiUrl(`/api/profile/${id}`))
      .then((res) => res.json())
      .then((data) => {
        console.log("Profile data received:", data); // Debug log
        if (data.error) setError(data.error);
        else setUser(data);
      })
      .catch(() => setError("Failed to load user profile."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;
  if (!user) return null;

  const avatarSrc = user.userpic
    ? user.userpic.startsWith('/uploads')
      ? uploadUrl(user.userpic.replace(/^\/uploads\//, ''), "avatar")
      : user.userpic
    : "/images/user/avatar-profile.jpg";

  return (
    <>
      <PageMeta
        title={`GISTREEVIEW | View Profile`}
        description="Halaman view profile user."
      />
      <div className="mb-6">
        <PageBreadcrumb pageTitle="My Profile" />
      </div>
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-8 mx-auto">
        <div className="space-y-8">
          {/* Profile Card */}
          <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-8 bg-gradient-to-br from-sky-200 via-white to-purple-300 dark:from-teal-800 dark:via-gray-700 dark:to-violet-900 transition-colors duration-300 max-w-3xl mx-auto">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
                <div className="w-32 h-32 overflow-hidden border border-gray-200 rounded-full dark:border-gray-800 relative shadow">
                  <img
                    src={avatarSrc}
                    alt="user"
                    className="object-cover object-center w-full h-full rounded-full"
                    style={{ aspectRatio: "1/1" }}
                    onError={(e) => {
                      e.currentTarget.src = "/images/user/avatar-profile.jpg";
                    }}
                  />
                </div>
                <div className="order-3 xl:order-2">
                  <h4 className="mb-1 text-xl font-bold text-center text-gray-800 dark:text-white xl:text-left transition-colors duration-300">
                    {user.firstname || user.lastname
                      ? `${user.firstname} ${user.lastname}`.trim()
                      : "User"}
                  </h4>
                  <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
                    <p className="text-sm text-gray-500 dark:text-gray-300 transition-colors duration-300">
                      {user.role
                        ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
                        : "Role"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center order-2 gap-2 grow xl:order-3 xl:justify-end"></div>
              </div>
            </div>
          </div>

          {/* Info Card */}
          <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-8 space-y-8 bg-gray-100/50 dark:bg-gray-900/80 shadow  max-w-3xl mx-auto">
            <h4 className="text-lg font-bold text-gray-800 dark:text-white mb-4 transition-colors duration-300">
              Personal Information
            </h4>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
              <div>
                <div className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">First Name</div>
                <div className="px-4 py-2.5 text-sm font-medium bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100">
                  {user.firstname || "-"}
                </div>
              </div>
              <div>
                <div className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">Last Name</div>
                <div className="px-4 py-2.5 text-sm font-medium bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100">
                  {user.lastname || "-"}
                </div>
              </div>
              <div>
                <div className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">Email address</div>
                <div className="px-4 py-2.5 text-sm font-medium bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100">
                  {user.email || "-"}
                </div>
              </div>
              <div>
                <div className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">Phone</div>
                <div className="px-4 py-2.5 text-sm font-medium bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100">
                  {user.phone || "-"}
                </div>
              </div>
              <div className="lg:col-span-2">
                <div className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">Bio</div>
                <div className="px-4 py-2.5 text-sm font-medium bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 min-h-[4rem] whitespace-pre-wrap">
                  {user.bio || "-"}
                </div>
              </div>
            </div>
            <h4 className="text-lg font-bold text-gray-800 dark:text-white mb-4 mt-6 transition-colors duration-300">
              Address
            </h4>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
              <div>
                <div className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">Country</div>
                <div className="px-4 py-2.5 text-sm font-medium bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100">
                  {user.country || "-"}
                </div>
              </div>
              <div>
                <div className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">City/State</div>
                <div className="px-4 py-2.5 text-sm font-medium bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100">
                  {user.city || "-"}
                </div>
              </div>
              <div>
                <div className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">Postal Code</div>
                <div className="px-4 py-2.5 text-sm font-medium bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100">
                  {user.postalcode || "-"}
                </div>
              </div>
              <div>
                <div className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">Province</div>
                <div className="px-4 py-2.5 text-sm font-medium bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100">
                  {user.province || "-"}
                </div>
              </div>
              <div className="lg:col-span-2">
                <div className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">Address</div>
                <div className="px-4 py-2.5 text-sm font-medium bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100">
                  {user.address || "-"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
