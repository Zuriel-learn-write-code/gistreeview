import React from "react";
import { apiUrl, uploadUrl } from "../../config/api";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
// Using native inputs/textarea as form components were removed
import Alert from "../../components/ui/alert/Alert";

export default function EditProfile() {
  const [form, setForm] = React.useState({
    firstname: "",
    lastname: "",
    email: "",
    phone: "",
    bio: "",
    address: "",
    country: "",
    cityState: "",
    postalCode: "",
    province: "",
    role: "",
    userpic: "",
  });
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");

  // Get user data from localStorage (set after login)
  const userData = JSON.parse(localStorage.getItem("user") || "{}");
  const userId = userData.id;

  React.useEffect(() => {
    if (!userId) return;
    setLoading(true);
    fetch(apiUrl(`/api/profile/${userId}`))
      .then((res) => {
        if (!res.ok) {
          console.error("Fetch error:", res.status, res.statusText);
        }
        return res.json();
      })
      .then((data) => {
        console.log("PROFILE DATA FROM BACKEND:", data);
        if (data.error) setError(data.error);
        else {
          setForm({
            firstname: data.firstname || "",
            lastname: data.lastname || "",
            email: data.email || "",
            phone: data.phone || "",
            bio: data.bio || "",
            address: data.address || "",
            country: data.country || "",
            cityState: data.city || "",
            postalCode: data.postalcode || "",
            province: data.province || "",
            role: data.role || "",
            userpic: data.userpic || "",
          });
        }
      })
      .catch((err) => {
        setError("Failed to load profile.");
        console.error("PROFILE FETCH ERROR:", err);
      })
      .finally(() => setLoading(false));
  }, [userId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleBioChange = (val: string) => {
    setForm((prev) => ({ ...prev, bio: val }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    // Make sure we're using the correct field names that match the database
    const payload = {
      firstname: form.firstname,
      lastname: form.lastname,
      email: form.email,
      phone: form.phone,
      bio: form.bio,
      address: form.address,
      country: form.country,
      city: form.cityState,
      postalcode: form.postalCode,
      province: form.province,
    };
    try {
      const res = await fetch(apiUrl(`/api/profile/${userId}`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || "Update failed");
      else setSuccess("Profile updated successfully.");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handler for avatar upload
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !userId) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("avatar", file);
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(apiUrl(`/api/profile/${userId}/avatar`), {
        method: "PATCH",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || "Upload failed");
      else {
        setForm((prev) => ({ ...prev, userpic: data.userpic }));
        setSuccess("Avatar updated successfully.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Meta & Breadcrumb */}
      <PageMeta
        title="Edit Profile | GISTREEVIEW"
        description="Halaman edit profile user."
      />
      <PageBreadcrumb pageTitle="Edit Profile" />
      {/* Main Card */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-8 mx-auto">
        <div className="space-y-8">
          {/* Profile Card */}
          <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-8 bg-gradient-to-br from-sky-200 via-white to-purple-300 dark:from-teal-800 dark:via-gray-700 dark:to-violet-900 transition-colors duration-300 max-w-3xl mx-auto">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
                <div
                  className="w-32 h-32 overflow-hidden border border-gray-200 rounded-full dark:border-gray-800 cursor-pointer group relative shadow"
                  onClick={() =>
                    document.getElementById("avatar-upload")?.click()
                  }
                >
                  <img
                    src={
                      form.userpic
                        ? uploadUrl(form.userpic, "avatar")
                        : "/images/user/avatar-profile.jpg"
                    }
                    alt="user"
                    className="group-hover:opacity-70 transition-opacity duration-200 object-cover object-center w-full h-full rounded-full"
                    style={{ aspectRatio: "1/1" }}
                  />
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                  {/* Overlay 1/3 bawah avatar */}
                  <svg
                    viewBox="0 0 100 100"
                    width="128"
                    height="128"
                    className="absolute left-0 top-0 w-full h-full"
                    style={{ pointerEvents: "none" }}
                  >
                    <path
                      d="M15,85 A50,50 0 0,1 85,85 L85,100 L15,100 Z"
                      fill="#000"
                      fillOpacity="0.8"
                    />
                  </svg>
                  <div
                    className="absolute left-1/2"
                    style={{
                      bottom: "calc(100% * 0.06)",
                      transform: "translate(-50%, 0)",
                      zIndex: 10,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="32"
                      height="32"
                      fill="white"
                      viewBox="0 0 24 24"
                      style={{ marginTop: "16px" }}
                    >
                      <path d="M5 20h14v-2H5v2zm7-14v6h3l-4 4-4-4h3V6h2z" />
                    </svg>
                  </div>
                </div>
                <div className="order-3 xl:order-2">
                  <h4 className="mb-1 text-xl font-bold text-center text-gray-800 dark:text-white xl:text-left transition-colors duration-300">
                    {form.firstname || form.lastname
                      ? `${form.firstname} ${form.lastname}`.trim()
                      : "User"}
                  </h4>
                  <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
                    <p className="text-sm text-gray-500 dark:text-gray-300 transition-colors duration-300">
                      {form.role
                        ? form.role.charAt(0).toUpperCase() + form.role.slice(1)
                        : "Role"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center order-2 gap-2 grow xl:order-3 xl:justify-end"></div>
              </div>
            </div>
          </div>

          {/* Info Card as Form */}
          <form
            className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-8 space-y-8 bg-gray-100/50 dark:bg-gray-900/80 shadow  max-w-3xl mx-auto"
            onSubmit={handleSubmit}
          >
            <h4 className="text-lg font-bold text-gray-800 dark:text-white mb-4 transition-colors duration-300">
              Personal Information
            </h4>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
              <div>
                <label htmlFor="firstname" className="block text-sm mb-1 text-gray-700 dark:text-gray-200">First Name</label>
                <input
                  id="firstname"
                  name="firstname"
                  type="text"
                  value={form.firstname}
                  onChange={handleChange}
                  className="w-full rounded-md border px-3 py-2 border-gray-200 bg-white text-gray-900 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500"
                  autoComplete="given-name"
                />
              </div>
              <div>
                <label htmlFor="lastname" className="block text-sm mb-1 text-gray-700 dark:text-gray-200">Last Name</label>
                <input
                  id="lastname"
                  name="lastname"
                  type="text"
                  value={form.lastname}
                  onChange={handleChange}
                  className="w-full rounded-md border px-3 py-2 border-gray-200 bg-white text-gray-900 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500"
                  autoComplete="family-name"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm mb-1 text-gray-700 dark:text-gray-200">Email address</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  className="w-full rounded-md border px-3 py-2 border-gray-200 bg-white text-gray-900 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500"
                  autoComplete="email"
                  disabled
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm mb-1 text-gray-700 dark:text-gray-200">Phone</label>
                <input
                  id="phone"
                  name="phone"
                  type="text"
                  value={form.phone}
                  onChange={handleChange}
                  className="w-full rounded-md border px-3 py-2 border-gray-200 bg-white text-gray-900 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500"
                  autoComplete="tel"
                />
              </div>
              <div className="lg:col-span-2">
                <label htmlFor="bio" className="block text-sm mb-1 text-gray-700 dark:text-gray-200">Bio</label>
                <textarea
                  id="bio"
                  name="bio"
                  rows={2}
                  value={form.bio}
                  onChange={(e) => handleBioChange(e.target.value)}
                  className="w-full rounded-md border px-3 py-2 border-gray-200 bg-white text-gray-900 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500"
                />
              </div>
            </div>
            <h4 className="text-lg font-bold text-gray-800 dark:text-white mb-4 mt-6 transition-colors duration-300">
              Address
            </h4>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
              <div>
                <label htmlFor="country" className="block text-sm mb-1 text-gray-700 dark:text-gray-200">Country</label>
                <input
                  id="country"
                  name="country"
                  type="text"
                  value={form.country}
                  onChange={handleChange}
                  className="w-full rounded-md border px-3 py-2 border-gray-200 bg-white text-gray-900 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500"
                  autoComplete="country"
                />
              </div>
              <div>
                <label htmlFor="cityState" className="block text-sm mb-1 text-gray-700 dark:text-gray-200">City/State</label>
                <input
                  id="cityState"
                  name="cityState"
                  type="text"
                  value={form.cityState}
                  onChange={handleChange}
                  className="w-full rounded-md border px-3 py-2 border-gray-200 bg-white text-gray-900 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500"
                  autoComplete="address-level2"
                  placeholder="City/State"
                />
              </div>
              <div>
                <label htmlFor="postalCode" className="block text-sm mb-1 text-gray-700 dark:text-gray-200">Postal Code</label>
                <input
                  id="postalCode"
                  name="postalCode"
                  type="text"
                  value={form.postalCode}
                  onChange={handleChange}
                  className="w-full rounded-md border px-3 py-2 border-gray-200 bg-white text-gray-900 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500"
                  autoComplete="postal-code"
                  placeholder="Postal Code"
                />
              </div>
              <div>
                <label htmlFor="province" className="block text-sm mb-1 text-gray-700 dark:text-gray-200">Province</label>
                <input
                  id="province"
                  name="province"
                  type="text"
                  value={form.province}
                  onChange={handleChange}
                  className="w-full rounded-md border px-3 py-2 border-gray-200 bg-white text-gray-900 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500"
                  autoComplete="address-level1"
                />
              </div>
              <div className="lg:col-span-2">
                <label htmlFor="address" className="block text-sm mb-1 text-gray-700 dark:text-gray-200">Address</label>
                <input
                  id="address"
                  name="address"
                  type="text"
                  value={form.address}
                  onChange={handleChange}
                  className="w-full rounded-md border px-3 py-2 border-gray-200 bg-white text-gray-900 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500"
                  autoComplete="street-address"
                  placeholder="Address"
                />
              </div>
            </div>
            <div className="flex flex-col justify-end pt-6 gap-2 border-gray-100 dark:border-gray-700 mt-6">
              <button
                type="submit"
                className="w-80 mx-auto px-6 py-3 rounded-2xl font-semibold shadow border border-blue-500 dark:border-blue-700 bg-gradient-to-br from-blue-500 via-blue-600 to-purple-500 dark:from-blue-700 dark:via-blue-800 dark:to-purple-800 text-white hover:from-blue-600 hover:via-blue-700 hover:to-purple-600 dark:hover:from-blue-800 dark:hover:via-blue-900 dark:hover:to-purple-900 transition-colors duration-300"
                disabled={loading}
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
              {(error || success) && (
                <Alert
                  variant={error ? "error" : "success"}
                  title={error ? "Error" : "Success"}
                  message={error || success}
                  position="top-center"
                  showProgress={true}
                  duration={3000}
                  isClosable={true}
                  onClose={() => (error ? setError("") : setSuccess(""))}
                />
              )}
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
