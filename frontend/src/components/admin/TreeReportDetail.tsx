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
  description: string;
  status: string;
  timestamp: string;
  road?: {
    id: string;
    nameroad: string;
    description?: string;
  } | null;
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
  email: string;
}

interface TreeReportDetailProps {
  tree: Tree;
  treePictures: TreePicture[];
  filteredReports: Report[];
  reportPictures: ReportPicture[];
  setPreviewImg: (url: string) => void;
  users?: User[];
  onUpdate?: () => void;
}

const TreeReportDetail: React.FC<TreeReportDetailProps> = ({
  tree,
  treePictures,
  filteredReports,
  reportPictures,
  setPreviewImg,
  users,
  onUpdate,
}) => {
  const [alert, setAlert] = useState<{
    show: boolean;
    variant: "success" | "error" | "warning" | "info";
    title: string;
    message: string;
  }>({ show: false, variant: "success", title: "", message: "" });

  const report = filteredReports.find((r) => r.treeId === tree.id);
  const [selectedStatus, setSelectedStatus] = useState<string>(
    report?.status || ""
  );
  const [showConfirm, setShowConfirm] = useState<boolean>(false);
  const [editDescription, setEditDescription] = useState<string>(
    report?.description || ""
  );

  const handleStatusChange = (status: string) => {
    setSelectedStatus(status);
    setShowConfirm(
      status !== report?.status || editDescription !== report?.description
    );
  };

  // Get current user data from localStorage
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const currentUserId = currentUser?.id;

  const handleConfirm = async () => {
    // Validasi user login
    if (!currentUserId) {
      setAlert({
        show: true,
        variant: "error",
        title: "Error",
        message: "Anda harus login terlebih dahulu",
      });
      return;
    }

    let newTreeStatus = tree.status;
    if (selectedStatus === "approved") {
      newTreeStatus = "danger";
    } else if (selectedStatus === "resolved") {
      newTreeStatus = "good";
    }

    // Prepare report update payload
    const reportUpdate: Partial<Report> = {
      status: selectedStatus,
      description: editDescription,
    };

    // Validasi status dan update fields
    if (selectedStatus === "approved" || selectedStatus === "rejected") {
      reportUpdate.verifiedById = currentUserId;
      reportUpdate.resolvedById = null;
      reportUpdate.resolvedAt = null;
    } else if (selectedStatus === "pending") {
      reportUpdate.verifiedById = null;
      reportUpdate.resolvedById = null;
      reportUpdate.resolvedAt = null;
    } else if (selectedStatus === "resolved") {
      reportUpdate.resolvedById = currentUserId;
      reportUpdate.resolvedAt = new Date().toISOString();
    }

    try {
      // Update status report di backend
      const reportResponse = await fetch(apiUrl(`/api/reports/${report?.id}`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reportUpdate),
      });

      if (!reportResponse.ok) {
        const error = await reportResponse.json();
        throw new Error(error.details || "Failed to update report");
      }

      // Update status pohon di backend
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

      // Trigger refresh data
      if (onUpdate) {
        onUpdate();
      }
    } catch (err) {
      const error = err as Error;
      console.error("Error updating:", error);
      setAlert({
        show: true,
        variant: "error",
        title: "Gagal",
        message: error.message || "Terjadi kesalahan saat memperbarui status.",
      });
    }
    setShowConfirm(false);
  };

  // Return JSX...
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
        <div className="w-full md:w-1/2 bg-white/90 dark:bg-gray-900/80 rounded-2xl shadow-lg flex border border-gray-200 dark:border-gray-700 flex-col h-full transition-colors duration-300">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h3 className="text-lg font-bold text-indigo-700 dark:text-indigo-200 tracking-wide">
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
                <label className="w-32 font-semibold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                  ID Pohon
                </label>
                <input
                  type="text"
                  className="flex-1 rounded border border-gray-300 dark:border-gray-700 px-2 py-1 text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 dark:focus:border-blue-400 dark:focus:ring-blue-900 transition-colors"
                  value={tree.id}
                  readOnly
                />
              </div>

              {/* Umur */}
              <div className="flex items-center gap-4">
                <label className="w-32 font-semibold text-gray-700 dark:text-gray-200">
                  Umur
                </label>
                <input
                  type="number"
                  className="flex-1 rounded border border-gray-300 dark:border-gray-700 px-2 py-1 text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 dark:focus:border-blue-400 dark:focus:ring-blue-900 transition-colors"
                  value={tree.age}
                  readOnly
                />
              </div>

              {/* Diameter Batang */}
              <div className="flex items-center gap-4">
                <label className="w-32 font-semibold text-gray-700 dark:text-gray-200">
                  Diameter Batang
                </label>
                <input
                  type="number"
                  className="flex-1 rounded border border-gray-300 dark:border-gray-700 px-2 py-1 text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 dark:focus:border-blue-400 dark:focus:ring-blue-900 transition-colors"
                  value={tree.trunk_diameter}
                  readOnly
                />
              </div>

              {/* Lebar Cabang */}
              <div className="flex items-center gap-4">
                <label className="w-32 font-semibold text-gray-700 dark:text-gray-200">
                  Lebar Cabang
                </label>
                <input
                  type="number"
                  className="flex-1 rounded border border-gray-300 dark:border-gray-700 px-2 py-1 text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 dark:focus:border-blue-400 dark:focus:ring-blue-900 transition-colors"
                  value={tree.lbranch_width}
                  readOnly
                />
              </div>

              {/* Kepemilikan */}
              <div className="flex items-center gap-4">
                <label className="w-32 font-semibold text-gray-700 dark:text-gray-200">
                  Kepemilikan
                </label>
                <input
                  type="text"
                  className="flex-1 rounded border border-gray-300 dark:border-gray-700 px-2 py-1 text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 dark:focus:border-blue-400 dark:focus:ring-blue-900 transition-colors"
                  value={tree.ownership}
                  readOnly
                />
              </div>

              {/* Nama Jalan */}
              <div className="flex items-center gap-4">
                <label className="w-32 font-semibold text-gray-700 dark:text-gray-200">
                  Nama Jalan
                </label>
                <input
                  type="text"
                  className="flex-1 rounded border border-gray-300 dark:border-gray-700 px-2 py-1 text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 dark:focus:border-blue-400 dark:focus:ring-blue-900 transition-colors"
                  value={tree.road?.nameroad || "-"}
                  readOnly
                />
              </div>

              {/* Deskripsi */}
              <div className="flex items-center gap-4">
                <label className="w-32 font-semibold text-gray-700 dark:text-gray-200">
                  Deskripsi
                </label>
                <textarea
                  className="flex-1 rounded border border-gray-300 dark:border-gray-700 px-2 py-1 text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 dark:focus:border-blue-400 dark:focus:ring-blue-900 transition-colors"
                  value={tree.description}
                  readOnly
                />
              </div>

              {/* Foto Pohon */}
              <div className="flex items-center gap-4">
                <label className="w-32 font-semibold text-gray-700 dark:text-gray-200">
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
                          onError={(e) => {
                            e.currentTarget.src = "/images/tree-default.jpg";
                          }}
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
            Data pohon di upload pada {tree.timestamp}
          </div>
        </div>

        {/* Card Form Report */}
        <div className="w-full md:w-1/2 bg-white/90 dark:bg-gray-900/80 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 flex flex-col h-full transition-colors duration-300">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h3 className="text-lg font-bold text-indigo-700 dark:text-indigo-200 tracking-wide">
              Report Form
            </h3>
            {(() => {
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
                <label className="w-32 font-semibold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                  ID Report
                </label>
                <input
                  type="text"
                  className="flex-1 rounded border border-gray-300 dark:border-gray-700 px-2 py-1 text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 dark:focus:border-blue-400 dark:focus:ring-blue-900 transition-colors"
                  value={report?.id || ""}
                  readOnly
                />
              </div>

              {/* pelapor*/}
              <div className="flex items-center gap-4">
                <label className="w-32 font-semibold text-gray-700 dark:text-gray-200">
                  Report by
                </label>
                <input
                  type="text"
                  className="flex-1 rounded border border-gray-300 dark:border-gray-700 px-2 py-1 text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 dark:focus:border-blue-400 dark:focus:ring-blue-900 transition-colors"
                  value={(() => {
                    if (!report?.userId || !Array.isArray(users))
                      return report?.userId || "";
                    const user = users.find((u) => u.id === report.userId);
                    return user
                      ? `${user.firstname} ${user.lastname}`
                      : report.userId;
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
                  className="flex-1 rounded border border-gray-300 dark:border-gray-700 px-2 py-1 text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 dark:focus:border-blue-400 dark:focus:ring-blue-900 transition-colors"
                  value={(() => {
                    if (!report?.verifiedById || !Array.isArray(users))
                      return report?.verifiedById || "";
                    const user = users.find(
                      (u) => u.id === report.verifiedById
                    );
                    return user
                      ? `${user.firstname} ${user.lastname}`
                      : report.verifiedById;
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
                  className="flex-1 rounded border border-gray-300 dark:border-gray-700 px-2 py-1 text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 dark:focus:border-blue-400 dark:focus:ring-blue-900 transition-colors"
                  value={(() => {
                    if (!report?.resolvedById || !Array.isArray(users))
                      return report?.resolvedById || "";
                    const user = users.find(
                      (u) => u.id === report.resolvedById
                    );
                    return user
                      ? `${user.firstname} ${user.lastname}`
                      : report.resolvedById;
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
                  className="flex-1 rounded border border-gray-300 dark:border-gray-700 px-2 py-1 text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 dark:focus:border-blue-400 dark:focus:ring-blue-900 transition-colors"
                  value={report?.resolvedAt ?? "-"}
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
                  className="flex-1 rounded border border-gray-300 dark:border-gray-700 px-2 py-1 text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 dark:focus:border-blue-400 dark:focus:ring-blue-900 transition-colors"
                  value={report?.status || ""}
                  readOnly
                />
              </div>

              {/* Deskripsi report */}
              <div className="flex items-center gap-4">
                <label className="w-32 font-semibold text-gray-700 dark:text-gray-200">
                  Deskripsi report
                </label>
                <textarea
                  className="flex-1 rounded border border-gray-300 dark:border-gray-700 px-2 py-1 text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 dark:focus:border-blue-400 dark:focus:ring-blue-900 transition-colors"
                  value={report?.description || ""}
                  readOnly
                />
              </div>

              {/* Foto report pohon */}
              <div className="flex items-center gap-4">
                <label className="w-32 font-semibold text-gray-700 dark:text-gray-200">
                  Foto report pohon
                </label>
                {(() => {
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
                            onError={(e) => {
                              e.currentTarget.src = "/images/report-default.jpg";
                            }}
                            onClick={() => setPreviewImg(uploadUrl(pic.url, "report"))}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">Tidak ada gambar</span>
                  );
                })()}
              </div>

              {/* Update Deskripsi */}
              <div className="flex items-center gap-4 mt-5">
                <label className="w-32 font-semibold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                  Update Deskripsi
                </label>
                <textarea
                  className="flex-1 rounded border border-gray-300 dark:border-gray-700 px-2 py-1 text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 dark:focus:border-blue-400 dark:focus:ring-blue-900 transition-colors"
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
            </form>

            {/* Ganti Status (Dropdown) */}
            <div className="flex items-center gap-4 mt-5">
              <label className="w-32 font-semibold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                Ganti Status
              </label>
              <div>
                {(() => {
                  let options: string[] = [];
                  if (report?.status === "pending") {
                    options = ["pending", "approved", "rejected"];
                  } else if (report?.status === "approved") {
                    options = ["pending", "approved", "resolved"];
                  } else if (report?.status === "rejected") {
                    options = ["pending", "rejected"];
                  } else if (report?.status === "resolved") {
                    options = ["resolved", "pending"];
                  }
                  return (
                    <select
                      className="rounded border border-gray-300 dark:border-gray-700 px-2 py-1 text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 dark:focus:border-blue-400 dark:focus:ring-blue-900 transition-colors"
                      value={selectedStatus}
                      onChange={(e) => handleStatusChange(e.target.value)}
                    >
                      {options.map((status) => (
                        <option key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </option>
                      ))}
                    </select>
                  );
                })()}
              </div>
            </div>

            {/* Tombol konfirmasi muncul jika status berubah */}
            {showConfirm && (
              <div className="mt-4">
                <button
                  type="button"
                  className="text-md py-2 px-4 bg-blue-600 text-white rounded shadow hover:bg-blue-800 dark:bg-blue-700 dark:hover:bg-blue-900 transition min-w-0 font-semibold"
                  onClick={handleConfirm}
                >
                  Confirm?
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 ml-auto">
            Data pohon di resolved pada {report?.resolvedAt ?? "-"}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TreeReportDetail;
