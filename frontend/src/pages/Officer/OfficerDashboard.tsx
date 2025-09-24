import React from "react";
import { apiUrl } from "../../config/api";
import TreeReportDetailOfficer from "../../components/officer/TreeReportDetailOfficer";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import UserMaps from "../../components/Maps/UserMaps";

interface User {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  role?: string;
}

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
  latitude: number;
  longitude: number;
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

interface ReportPicture {
  id: string;
  reportId: string;
  url: string;
  filename?: string;
  uploadedAt?: string;
  description?: string;
}

interface TreePicture {
  id: string;
  treeId: string;
  url: string;
  filename?: string;
  uploadedAt?: string;
  description?: string;
}

export default function OfficerDashboard() {
  // State declarations
  const [users, setUsers] = React.useState<User[]>([]);
  const [trees, setTrees] = React.useState<Tree[]>([]);
  const [treePictures, setTreePictures] = React.useState<TreePicture[]>([]);
  const [reports, setReports] = React.useState<Report[]>([]);
  const [focusTreeCoords, setFocusTreeCoords] = React.useState<
    [number, number] | null
  >(null);
  const [reportPictures, setReportPictures] = React.useState<ReportPicture[]>(
    []
  );
  const [verifiedCount, setVerifiedCount] = React.useState(0);
  const [resolvedCount, setResolvedCount] = React.useState(0);
  const [selectedStatus, setSelectedStatus] =
    React.useState<string>("verified");
  const [selectedTree, setSelectedTree] = React.useState<Tree | null>(null);
  const [previewImg, setPreviewImg] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState({
    users: false,
    trees: false,
    reports: false,
    pictures: false,
  });

  // Fetch functions
  const fetchUsers = React.useCallback(async () => {
    setLoading((prev) => ({ ...prev, users: true }));
    try {
      const res = await fetch(apiUrl("/api/profile/all"));
      const data = await res.json();
      setUsers(data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading((prev) => ({ ...prev, users: false }));
    }
  }, []);

  const fetchTrees = React.useCallback(async () => {
    setLoading((prev) => ({ ...prev, trees: true }));
    try {
      const res = await fetch(apiUrl("/api/trees"));
      const data = await res.json();
      setTrees(data || []);
    } catch (error) {
      console.error("Error fetching trees:", error);
    } finally {
      setLoading((prev) => ({ ...prev, trees: false }));
    }
  }, []);

  const fetchTreePictures = React.useCallback(async () => {
    setLoading((prev) => ({ ...prev, pictures: true }));
    try {
      const res = await fetch(apiUrl("/api/treepictures"));
      const data = await res.json();
      setTreePictures(data || []);
    } catch (error) {
      console.error("Error fetching tree pictures:", error);
    } finally {
      setLoading((prev) => ({ ...prev, pictures: false }));
    }
  }, []);

  const fetchReportPictures = React.useCallback(async () => {
    try {
      const res = await fetch(apiUrl("/api/reportpictures"));
      const data = await res.json();
      setReportPictures(data || []);
    } catch (error) {
      console.error("Error fetching report pictures:", error);
    }
  }, []);

  const fetchReports = React.useCallback(async () => {
    setLoading((prev) => ({ ...prev, reports: true }));
    try {
      // Selalu ambil semua report
      const res = await fetch(apiUrl("/api/reports"));
      const data = await res.json();
      setReports(data || []);
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setLoading((prev) => ({ ...prev, reports: false }));
    }
  }, []);

  // Effect untuk menghitung jumlah reports berdasarkan status
  React.useEffect(() => {
    const approved = reports.filter((r) => r.status === "approved");
    const resolved = reports.filter((r) => r.status === "resolved");

    setVerifiedCount(approved.length || 0);
    setResolvedCount(resolved.length || 0);
  }, [reports]);

  // Refresh all data
  const refreshData = React.useCallback(async () => {
    await Promise.all([
      fetchUsers(),
      fetchTrees(),
      fetchTreePictures(),
      fetchReportPictures(),
      fetchReports(),
    ]);
  }, [
    fetchUsers,
    fetchTrees,
    fetchTreePictures,
    fetchReportPictures,
    fetchReports,
  ]);

  // Initial data fetch and auto-refresh
  React.useEffect(() => {
    refreshData();

    // Set up auto-refresh every minute
    const intervalId = setInterval(refreshData, 60000);

    // Cleanup on unmount
    return () => clearInterval(intervalId);
  }, [refreshData]);

  const filteredReports: Report[] = React.useMemo(() => {
    let filtered = [...reports];
    if (selectedStatus === "verified") {
      filtered = filtered.filter((r) => r.status === "approved");
    } else if (selectedStatus === "resolved") {
      filtered = filtered.filter((r) => r.status === "resolved");
    }
    return filtered.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [reports, selectedStatus]);

  return (
    <>
      {/* Modal Preview Gambar */}
      {previewImg && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-99999"
          onClick={() => setPreviewImg(null)}
        >
          <img
            src={previewImg}
            alt="Preview Pohon"
            className="max-w-[90vw] max-h-[90vh] rounded-2xl shadow-2xl border-4 border-white"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
      <div>
        <PageMeta
          title="Officer Dashboard | GISTREEVIEW"
          description="Halaman dashboard khusus Officer."
        />
        <PageBreadcrumb pageTitle="Dashboard Officer" />
        <div className="min-h-screen rounded-2xl bg-white px-5 py-7 dark:bg-white/[0.03] xl:px-10 xl:py-12">
          {/* ====== CARD STATUS ====== */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            {/* Card Verified */}
            <div
              className="relative flex items-center justify-center bg-gradient-to-br from-green-400 to-green-700 rounded-xl py-4 px-4 cursor-pointer transition-colors duration-200 hover:from-green-500 hover:to-green-800 shadow-lg min-h-[100px]"
              onClick={() => {
                setSelectedStatus("verified");
                setSelectedTree(null);
              }}
            >
              {/* Logo kiri atas */}
              <svg
                className="absolute left-4 top-4 w-10 h-10 text-green-100 opacity-90"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              {/* Text tengah, hidden di <1024px */}
              <span className="text-lg font-semibold text-white z-10 text-center w-full hidden lg:inline">
                Verified
              </span>
              {/* Angka kanan bawah */}
              <div className="absolute right-4 bottom-2 text-2xl font-bold text-white z-10">
                {verifiedCount}
              </div>
            </div>
            {/* Card Resolved */}
            <div
              className="relative flex items-center justify-center bg-gradient-to-br from-blue-400 to-blue-700 rounded-xl py-4 px-4 cursor-pointer transition-colors duration-200 hover:from-blue-500 hover:to-blue-800 shadow-lg min-h-[100px]"
              onClick={() => {
                setSelectedStatus("resolved");
                setSelectedTree(null);
              }}
            >
              {/* Logo kiri atas */}
              <svg
                className="absolute left-4 top-4 w-10 h-10 text-blue-100 opacity-90"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 17v-2a4 4 0 118 0v2m-4 4a4 4 0 01-4-4h8a4 4 0 01-4 4z"
                />
              </svg>
              {/* Text tengah, hidden di <1024px */}
              <span className="text-lg font-semibold text-white z-10 text-center w-full hidden lg:inline">
                Resolved
              </span>
              {/* Angka kanan bawah */}
              <div className="absolute right-4 bottom-2 text-2xl font-bold text-white z-10">
                {resolvedCount}
              </div>
            </div>
          </div>
          {/* ====== END CARD STATUS ====== */}
          <div className="flex w-full h-full gap-6">
            {/* Bagian Kiri: Map */}
            <div
              className="flex-1 rounded-2xl overflow-hidden shadow-md"
              style={{ maxHeight: "460px" }}
            >
              <UserMaps
                height="460px"
                onMapReady={(map) => {
                  // expose map in the same global used elsewhere
                  try {
                    // set a minimally typed global to avoid 'any' lint rules
                    (window as unknown as { __gistreeview_map?: { flyTo: (coords: [number, number], z?: number) => void } }).__gistreeview_map =
                      (map as unknown) as { flyTo: (coords: [number, number], z?: number) => void };
                    if (focusTreeCoords && typeof map.flyTo === 'function') {
                      map.flyTo(focusTreeCoords, 20);
                    }
                  } catch (e) {
                    console.debug('OfficerDashboard: failed to set global map', e);
                  }
                }}
              />
            </div>
            {/* Bagian Kanan: Info/Konten Officer */}
            <div
              className="w-full max-w-[400px] rounded-2xl bg-gray-100/90 dark:bg-gray-900/80 border border-gray-200 dark:border-gray-700 p-8 py-10 shadow-lg flex flex-col flex-1 overflow-auto transition-colors duration-300"
              style={{ maxHeight: "460px" }}
            >
              {loading.reports ? (
                <div className="flex items-center justify-center h-40">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : filteredReports.length > 0 ? (
                <ul className="text-left w-full text-xs dark:text-gray-200">
                  {filteredReports.map((r) => (
                    <li
                      key={r.id}
                      className="mb-4 cursor-pointer group rounded px-2 py-2 transition-colors duration-200 bg-white/70 dark:bg-gray-800/70 border border-gray-100 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                      onClick={() => {
                        const tree = trees.find((t) => t.id === r.treeId);
                        setSelectedTree(tree || null);
                        if (tree && tree.latitude && tree.longitude) {
                          setFocusTreeCoords([tree.latitude, tree.longitude]);
                        }
                      }}
                    >
                      <span className="font-bold text-gray-700 dark:text-gray-100 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors duration-200">
                        {r.description}
                      </span>
                      <br />
                      <span className="text-[10px] text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
                        Status: {r.status}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Tidak ada laporan
                </p>
              )}
            </div>
          </div>
          {/* Form data pohon di bawah map dan card */}
          {selectedTree &&
            (() => {
              // Debug: log data for troubleshooting
              console.log("selectedTree:", selectedTree);
              console.log("reports:", reports);
              console.log("filteredReports:", filteredReports);
              console.log("reportPictures:", reportPictures);
              const report = filteredReports.find(
                (r) => r.treeId === selectedTree.id
              );
              if (report) {
                const images = Array.isArray(reportPictures)
                  ? reportPictures.filter((pic) => pic.reportId === report.id)
                  : [];
                console.log("Selected report:", report);
                console.log("Report pictures for this report:", images);
              }
              return (
                <div className="mt-8 mx-auto w-full">
                  <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-900/80 shadow-lg p-6 transition-colors duration-300">
                    <TreeReportDetailOfficer
                      tree={selectedTree}
                      treePictures={treePictures}
                      filteredReports={filteredReports}
                      reportPictures={reportPictures}
                      setPreviewImg={setPreviewImg}
                      users={users}
                      onUpdate={refreshData}
                    />
                  </div>
                </div>
              );
            })()}
        </div>
      </div>
    </>
  );
}
