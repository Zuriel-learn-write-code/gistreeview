import React, { useState } from "react";
import { uploadUrl, apiUrl } from "../../config/api";
import Alert from "../../components/ui/alert/Alert";
interface Tree {
  id: string;
  species: string;
  age: number;
  trunk_diameter: number;
  lbranch_width: number;
  ownership: string;
  roadId?: string;
  road?: {
    id: string;
    nameroad: string;
    description?: string;
  };
  description: string;
  status: string;
  timestamp: string;
}
interface Report {
  id: string;
  userId: string;
  treeId: string;
  description: string;
  status: string;
  timestamp: string;
  verifiedById?: string | null;
  resolvedById?: string | null;
  resolvedAt?: string | null;
}
interface TreePicture {
  treeId: string;
  url: string;
}
interface ReportPicture {
  reportId: string;
  url: string;
}
interface User {
  id: string;
  firstname: string;
  lastname: string;
}
interface TreeReportDetailOfficerProps {
  tree: Tree;
  treePictures: TreePicture[];
  filteredReports: Report[];
  reportPictures: ReportPicture[];
  setPreviewImg: (url: string) => void;
  onUpdate?: () => void;
  users?: User[];
}
const TreeReportDetailOfficer: React.FC<TreeReportDetailOfficerProps> = ({
  tree,
  treePictures,
  filteredReports,
  reportPictures,
  setPreviewImg,
  onUpdate,
  users,
}) => {
  // State untuk status yang dipilih dan konfirmasi
  const [alert, setAlert] = useState<{
    show: boolean;
    variant: "success" | "error" | "warning" | "info";
    title: string;
    message: string;
  }>({ show: false, variant: "success", title: "", message: "" });
  const report = filteredReports.find((r) => r.treeId === tree.id);
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [showConfirm, setShowConfirm] = useState<boolean>(false);
  const [editDescription, setEditDescription] = useState<string>(
    report?.description || ""
  );
  const [treeResolvedStatus, setTreeResolvedStatus] = useState<string>("");

  const handleStatusChange = (status: string) => {
    setSelectedStatus(status);
    if (status === "resolved") {
      setTreeResolvedStatus("");
      setShowConfirm(false);
    } else {
      setShowConfirm(
        status !== report?.status && status !== "" && status !== undefined
      );
    }
  };

  const handleTreeResolvedStatusChange = (status: string) => {
    setTreeResolvedStatus(status);
    setShowConfirm(status !== "" && selectedStatus === "resolved");
  };

  // Get current user data from localStorage (match admin component)
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const currentUserId = currentUser?.id;

  const handleConfirm = async () => {
    let newTreeStatus = tree.status;
    if (selectedStatus === "approved") {
      newTreeStatus = "danger";
    } else if (selectedStatus === "resolved") {
      newTreeStatus = treeResolvedStatus || "good";
    }
    // Prepare report update payload
    const reportUpdate: Record<string, unknown> = {
      status: selectedStatus,
      description: editDescription,
    };
    if (selectedStatus === "approved" || selectedStatus === "rejected") {
      reportUpdate.verifiedById = currentUserId;
    } else if (selectedStatus === "pending") {
      reportUpdate.verifiedById = null;
    }
    if (selectedStatus === "resolved") {
      reportUpdate.resolvedById = currentUserId;
      reportUpdate.resolvedAt = new Date().toISOString();
    }
    // require login for status changes that write user id
    if (!currentUserId) {
      setAlert({
        show: true,
        variant: "error",
        title: "Error",
        message: "Anda harus login terlebih dahulu",
      });
      return;
    }

    try {
      // Update status report di backend (termasuk deskripsi, verifiedById, resolvedById, resolvedAt)
      const reportResponse = await fetch(apiUrl(`/api/reports/${report?.id}`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reportUpdate),
      });
      if (!reportResponse.ok) {
        const error = await reportResponse.json();
        throw new Error(
          error.details || error.error || "Failed to update report"
        );
      }

      // Update status pohon di backend (termasuk deskripsi)
      const treeResponse = await fetch(apiUrl(`/api/trees/${tree.id}`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newTreeStatus,
          description: editDescription,
        }),
      });
      if (!treeResponse.ok) {
        throw new Error("Failed to update tree status");
      }

      setAlert({
        show: true,
        variant: "success",
        title: "Berhasil",
        message:
          "Status report, deskripsi, dan status pohon berhasil diperbarui!",
      });

      // Trigger parent refresh if provided
      if (typeof onUpdate === "function") onUpdate();
    } catch (err) {
      const error = err as Error;
      setAlert({
        show: true,
        variant: "error",
        title: "Gagal",
        message: error.message || "Terjadi kesalahan saat memperbarui status.",
      });
    }
    setShowConfirm(false);
  };

  return (
    <div className="mt-8 w-full">
      {/* Alert */}
      {alert.show && (
        <div className="mb-4">
          <Alert
            variant={alert.variant}
            title={alert.title}
            message={alert.message}
            showProgress={true}
            duration={3000}
            isClosable={true}
            onClose={() => setAlert((prev) => ({ ...prev, show: false }))}
          />
        </div>
      )}
      <div className="flex flex-col md:flex-row gap-8">
        {/* Card Form tree */}
        <div className="w-full md:w-1/2 bg-white/90 dark:bg-gray-900/80 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 flex flex-col h-full transition-colors duration-300">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-start justify-between">
            <h3 className="text-lg font-bold text-gray-700 dark:text-gray-100">
              {tree.species || "Pohon"}
            </h3>
            <span
              className={
                `px-4 py-1 rounded-full text-md font-semibold border shadow ` +
                (tree.status === "good"
                  ? "bg-green-100 text-green-700 border-green-300 dark:bg-green-900 dark:text-green-200 dark:border-green-800"
                  : tree.status === "warning"
                  ? "bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-800"
                  : tree.status === "danger"
                  ? "bg-red-100 text-red-700 border-red-300 dark:bg-red-900 dark:text-red-200 dark:border-red-800"
                  : "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-800")
              }
            >
              {tree.status.charAt(0).toUpperCase() + tree.status.slice(1)}
            </span>
          </div>

          {/* Body */}
          <div className="flex-1 p-6">
            <form className="grid grid-cols-1 gap-4 text-sm">
              {/* ID */}
              <div className="flex items-center gap-4">
                <label className="w-32 font-semibold text-gray-700 dark:text-gray-100">
                  ID Pohon
                </label>
                <input
                  type="text"
                  className="flex-1 rounded border border-gray-200 dark:border-gray-700 px-2 py-1 text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800"
                  value={tree.id}
                  readOnly
                />
              </div>
              {/* Umur */}
              <div className="flex items-center gap-4">
                <label className="w-32 font-semibold text-gray-700 dark:text-gray-100">
                  Umur
                </label>
                <input
                  type="number"
                  className="flex-1 rounded border border-gray-200 dark:border-gray-700 px-2 py-1 text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800"
                  value={tree.age}
                  readOnly
                />
              </div>
              {/* Diameter Batang */}
              <div className="flex items-center gap-4">
                <label className="w-32 font-semibold text-gray-700 dark:text-gray-100">
                  Diameter Batang
                </label>
                <input
                  type="number"
                  className="flex-1 rounded border border-gray-200 dark:border-gray-700 px-2 py-1 text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800"
                  value={tree.trunk_diameter}
                  readOnly
                />
              </div>
              {/* Lebar Cabang */}
              <div className="flex items-center gap-4">
                <label className="w-32 font-semibold text-gray-700 dark:text-gray-100">
                  Lebar Cabang
                </label>
                <input
                  type="number"
                  className="flex-1 rounded border border-gray-200 dark:border-gray-700 px-2 py-1 text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800"
                  value={tree.lbranch_width}
                  readOnly
                />
              </div>
              {/* Kepemilikan */}
              <div className="flex items-center gap-4">
                <label className="w-32 font-semibold text-gray-700 dark:text-gray-100">
                  Kepemilikan
                </label>
                <input
                  type="text"
                  className="flex-1 rounded border border-gray-200 dark:border-gray-700 px-2 py-1 text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800"
                  value={tree.ownership}
                  readOnly
                />
              </div>
              {/* Nama Jalan */}
              <div className="flex items-center gap-4">
                <label className="w-32 font-semibold text-gray-700 dark:text-gray-100">
                  Nama Jalan
                </label>
                <input
                  type="text"
                  className="flex-1 rounded border border-gray-200 dark:border-gray-700 px-2 py-1 text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800"
                  value={tree.road?.nameroad || "Tidak ada nama jalan"}
                  readOnly
                />
              </div>
              {/* Deskripsi */}
              <div className="flex items-center gap-4">
                <label className="w-32 font-semibold text-gray-700 dark:text-gray-100">
                  Deskripsi
                </label>
                <textarea
                  className="flex-1 rounded border border-gray-200 dark:border-gray-700 px-2 py-1 text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800"
                  value={tree.description}
                  readOnly
                />
              </div>
              {/* Foto Pohon */}
              <div className="flex items-center gap-4">
                <label className="w-32 font-semibold text-gray-700 dark:text-gray-100">
                  Foto Pohon
                </label>
                <div className="flex gap-3">
                  {(Array.isArray(treePictures)
                    ? treePictures.filter((pic) => pic.treeId === tree.id)
                    : []
                  )
                    .slice(0, 3)
                    .map((pic, idx) => (
                      <div
                        key={idx}
                        className="relative group rounded-xl overflow-hidden border-2 border-gray-200 dark:border-gray-700 hover:border-blue-400 transition-all duration-200 shadow-sm"
                        style={{ width: 96, height: 96 }}
                      >
                        <img
                          src={uploadUrl(pic.url, "tree")}
                          alt={`Tree ${tree.id} - ${idx + 1}`}
                          className="w-full h-full object-cover rounded-xl cursor-pointer group-hover:scale-105 transition-transform duration-200"
                          onClick={() =>
                            setPreviewImg(uploadUrl(pic.url, "tree"))
                          }
                        />
                      </div>
                    ))}
                </div>
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 ml-auto">
            Data pohon terakhir diperbarui pada {tree.timestamp}
          </div>
        </div>

        {/* Card Form Report */}
        <div className="w-full md:w-1/2 bg-white/90 dark:bg-gray-900/80 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 flex flex-col h-full transition-colors duration-300">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-start justify-between">
            <h3 className="text-lg font-bold text-gray-700 dark:text-gray-100 ml-auto"></h3>
            {(() => {
              const report = filteredReports.find((r) => r.treeId === tree.id);
              if (!report) return null;
              return (
                <span
                  className={
                    `px-4 py-1 rounded-full text-md font-semibold border shadow ` +
                    (report.status === "pending"
                      ? "bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-800 dark:text-yellow-200 dark:border-yellow-800"
                      : report.status === "approved"
                      ? "bg-green-100 text-green-700 border-green-300 dark:bg-green-900 dark:text-green-200 dark:border-green-800"
                      : report.status === "rejected"
                      ? "bg-red-100 text-red-700 border-red-300 dark:bg-red-900 dark:text-red-200 dark:border-red-800"
                      : report.status === "resolved"
                      ? "bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-900 dark:text-gray-200 dark:border-gray-800"
                      : "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-800")
                  }
                >
                  {report.status.charAt(0).toUpperCase() +
                    report.status.slice(1)}
                </span>
              );
            })()}
          </div>

          {/* Body */}
          <div className="flex-1 p-6">
            <form className="grid grid-cols-1 gap-4 text-sm">
              {/* ID report*/}
              <div className="flex items-center gap-4">
                <label className="w-32 font-semibold text-gray-700 dark:text-gray-200">
                  ID Report
                </label>
                <input
                  type="text"
                  className="flex-1 rounded border border-gray-200 dark:border-gray-700 px-2 py-1 text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800"
                  value={
                    filteredReports.find((r) => r.treeId === tree.id)?.id || ""
                  }
                  readOnly
                />
              </div>
              {/* pelapor*/}
              <div className="flex items-center gap-4">
                <label className="w-32 font-semibold text-gray-700 dark:text-gray-200">
                  Pelapor
                </label>
                <input
                  type="text"
                  className="flex-1 rounded border border-gray-200 dark:border-gray-700 px-2 py-1 text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800"
                  value={(() => {
                    const userId = filteredReports.find(
                      (r) => r.treeId === tree.id
                    )?.userId;
                    if (!userId || !Array.isArray(users)) return userId || "";
                    const user = users.find((u) => u.id === userId);
                    return user ? `${user.firstname} ${user.lastname}` : userId;
                  })()}
                  readOnly
                />
              </div>
              {/* verified by */}
              <div className="flex items-center gap-4">
                <label className="w-32 font-semibold text-gray-700 dark:text-gray-200">
                  verified by
                </label>
                <input
                  type="text"
                  className="flex-1 rounded border border-gray-200 dark:border-gray-700 px-2 py-1 text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800"
                  value={(() => {
                    const verifiedById = filteredReports.find(
                      (r) => r.treeId === tree.id
                    )?.verifiedById;
                    if (!verifiedById || !Array.isArray(users))
                      return verifiedById || "";
                    const user = users.find((u) => u.id === verifiedById);
                    return user
                      ? `${user.firstname} ${user.lastname}`
                      : verifiedById;
                  })()}
                  readOnly
                />
              </div>
              {/* resolved by */}
              <div className="flex items-center gap-4">
                <label className="w-32 font-semibold text-gray-700 dark:text-gray-200">
                  resolved by
                </label>
                <input
                  type="text"
                  className="flex-1 rounded border border-gray-200 dark:border-gray-700 px-2 py-1 text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800"
                  value={(() => {
                    const resolvedById = filteredReports.find(
                      (r) => r.treeId === tree.id
                    )?.resolvedById;
                    if (!resolvedById || !Array.isArray(users))
                      return resolvedById || "";
                    const user = users.find((u) => u.id === resolvedById);
                    return user
                      ? `${user.firstname} ${user.lastname}`
                      : resolvedById;
                  })()}
                  readOnly
                />
              </div>
              {/*  resolved at */}
              <div className="flex items-center gap-4">
                <label className="w-32 font-semibold text-gray-700 dark:text-gray-200">
                  resolved at
                </label>
                <input
                  type="text"
                  className="flex-1 rounded border border-gray-200 dark:border-gray-700 px-2 py-1 text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800"
                  value={
                    filteredReports.find((r) => r.treeId === tree.id)
                      ?.resolvedAt ?? "-"
                  }
                  readOnly
                />
              </div>
              {/* Status report */}
              <div className="flex items-center gap-4">
                <label className="w-32 font-semibold text-gray-700 dark:text-gray-200">
                  Status report
                </label>
                <input
                  type="text"
                  className="flex-1 rounded border border-gray-200 dark:border-gray-700 px-2 py-1 text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800"
                  value={
                    filteredReports.find((r) => r.treeId === tree.id)?.status ||
                    ""
                  }
                  readOnly
                />
              </div>

              {/* Deskripsi report */}
              <div className="flex items-center gap-4">
                <label className="w-32 font-semibold text-gray-700 dark:text-gray-200">
                  Deskripsi report
                </label>
                <textarea
                  className="flex-1 rounded border border-gray-200 dark:border-gray-700 px-2 py-1 text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800"
                  value={
                    filteredReports.find((r) => r.treeId === tree.id)
                      ?.description || ""
                  }
                  readOnly
                />
              </div>
              {/* Foto report pohon */}
              <div className="flex items-center gap-4">
                <label className="w-32 font-semibold text-gray-700 dark:text-gray-200">
                  Foto report pohon
                </label>
                {(() => {
                  const report = filteredReports.find(
                    (r) => r.treeId === tree.id
                  );
                  if (!report) return null;
                  const images = Array.isArray(reportPictures)
                    ? reportPictures.filter((pic) => pic.reportId === report.id)
                    : [];
                  return images.length > 0 ? (
                    <div className="flex gap-3">
                      {images.slice(0, 3).map((pic, idx) => (
                        <div
                          key={idx}
                          className="relative group rounded-xl overflow-hidden border-2 border-gray-200 dark:border-gray-700 hover:border-blue-400 transition-all duration-200 shadow-sm"
                          style={{ width: 96, height: 96 }}
                        >
                          <img
                            src={uploadUrl(pic.url, "report")}
                            alt={`Report ${report.id} - ${idx + 1}`}
                            className="w-full h-full object-cover rounded-xl cursor-pointer group-hover:scale-105 transition-transform duration-200"
                            onClick={() =>
                              setPreviewImg(uploadUrl(pic.url, "report"))
                            }
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">
                      Tidak ada gambar
                    </span>
                  );
                })()}
              </div>

              {/* Update Deskripsi */}
              {report?.status !== "resolved" && (
                <div className="flex items-center gap-4 mt-5">
                  <label className="w-32 font-semibold text-gray-700 dark:text-gray-200">
                    Update Deskripsi
                  </label>
                  <textarea
                    className="flex-1 rounded border border-gray-200 dark:border-gray-700 px-2 py-1 text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800"
                    value={editDescription}
                    onChange={(e) => {
                      setEditDescription(e.target.value);
                      setShowConfirm(
                        e.target.value !== report?.description ||
                          selectedStatus !== report?.status
                      );
                    }}
                    placeholder="Tulis deskripsi baru..."
                    rows={2}
                  />
                </div>
              )}
            </form>
            {/* Ganti Status (Dropdown) dan Tombol Konfirmasi */}
            {report?.status !== "resolved" && (
              <div className="relative">
                <div className="flex items-center gap-4 mt-5">
                  <label className="w-32 font-semibold text-gray-700 dark:text-gray-200">
                    Ganti Status
                  </label>
                  <div>
                    <select
                      className="flex-1 rounded border border-gray-200 dark:border-gray-700 px-2 py-1 text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800"
                      value={selectedStatus}
                      onChange={(e) => handleStatusChange(e.target.value)}
                    >
                      <option value="">Pilih status</option>
                      <option value="approved">Approved</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </div>
                </div>
                {/* Jika memilih resolved, tampilkan dropdown status pohon */}
                {selectedStatus === "resolved" && (
                  <div className="flex items-center gap-4 mt-5">
                    <label className="w-32 font-semibold text-gray-700 dark:text-gray-200">
                      Status Pohon
                    </label>
                    <div>
                      <select
                        className="flex-1 rounded border border-gray-200 dark:border-gray-700 px-2 py-1 text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800"
                        value={treeResolvedStatus}
                        onChange={(e) =>
                          handleTreeResolvedStatusChange(e.target.value)
                        }
                      >
                        <option value="">Pilih status pohon</option>
                        <option value="good">Good</option>
                        <option value="warning">Warning</option>
                        <option value="danger">Danger</option>
                      </select>
                    </div>
                  </div>
                )}
                {/* Tombol konfirmasi muncul jika status sudah dipilih */}
                {((selectedStatus === "approved" && showConfirm) ||
                  (selectedStatus === "resolved" &&
                    treeResolvedStatus &&
                    showConfirm)) && (
                  <div className="absolute right-6 bottom-6">
                    <button
                      type="button"
                      className="text-md py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-800 dark:bg-blue-700 dark:hover:bg-blue-900 transition min-w-0 shadow-lg"
                      onClick={handleConfirm}
                    >
                      Confirm?
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 ml-auto">
            Data pohon terakhir diperbarui pada {tree.timestamp}
          </div>
        </div>
      </div>
    </div>
  );
};
export default TreeReportDetailOfficer;
