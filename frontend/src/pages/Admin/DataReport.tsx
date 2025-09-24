import { useEffect, useState } from "react";
import Switch from "../../components/form/switch/Switch";
import TableReport from "../../components/tables/BasicTables/TableReport";
import { apiUrl } from "../../config/api";
import Alert from "../../components/ui/alert/Alert";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";

interface ReportPicture {
  id: string;
  url: string;
}

interface Report {
  id: string;
  treeId?: string | null;
  roadId?: string | null;
  description?: string | null;
  status?: string | null;
  reportDate?: string | null;
  reporter?: { id: string; firstname: string; lastname: string } | null;
  verifiedBy?: { id: string; firstname: string; lastname: string } | null;
  resolvedBy?: { id: string; firstname: string; lastname: string } | null;
  resolvedAt?: string | null;
  image?: string | null;
  user?: { id: string; firstname: string; lastname: string } | null;
  reportPictures?: ReportPicture[];
}
export default function DataReport() {
  const [reports, setReports] = useState<Report[]>([]);
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [showPending, setShowPending] = useState(true);
  const [showRejected, setShowRejected] = useState(true);
  const [showVerified, setShowVerified] = useState(true);
  const [showResolved, setShowResolved] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [alert, setAlert] = useState<{
    show: boolean;
    variant: "success" | "error";
    title: string;
    message: string;
  }>({ show: false, variant: "success", title: "", message: "" });

  const [page, setPage] = useState(1);

  useEffect(() => {
    fetch(apiUrl("/api/reports"))
      .then((res) => res.json())
      .then((data) => setReports(data))
      .catch(() => setReports([]));
  }, []);


  const filtered = reports.filter((r) => {
    const q = search.toLowerCase();
    const status = (r.status || '').toLowerCase();
    const statusMatches =
      (showPending && status === 'pending') ||
      (showRejected && status === 'rejected') ||
      (showVerified && status === 'verified') ||
      (showResolved && status === 'resolved') ||
      (!r.status && (showPending || showRejected || showVerified || showResolved));
    return (
      statusMatches && (
        r.description?.toLowerCase().includes(q) ||
        r.treeId?.toLowerCase().includes(q) ||
        r.roadId?.toLowerCase().includes(q) ||
        r.reporter?.firstname.toLowerCase().includes(q) ||
        r.reporter?.lastname.toLowerCase().includes(q)
      )
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleDelete = (id: string) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(apiUrl(`/api/reports/${deleteId}`), {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      setReports((prev) => prev.filter((p) => p.id !== deleteId));
      setAlert({
        show: true,
        variant: "success",
        title: "Berhasil",
        message: "Laporan berhasil dihapus.",
      });
    } catch {
      setAlert({
        show: true,
        variant: "error",
        title: "Gagal",
        message: "Gagal menghapus laporan.",
      });
    } finally {
      setShowDeleteModal(false);
      setDeleteId(null);
    }
  };

  return (
    <div>
      <PageMeta title="Data Report" description="Tabel laporan" />
      <PageBreadcrumb pageTitle="Data Report" />
  <div className="rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12">
        {/* Filter bar ala DataTree/DataRoad */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 px-2 md:px-4">
          <div className="flex items-center gap-3 md:gap-4">
            <span className="text-gray-500 dark:text-gray-400">Show</span>
            <div className="relative">
              <select
                className="h-11 w-20 pl-4 pr-8 rounded-lg border appearance-none text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                value={pageSize}
                onChange={e => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
              >
                {[10, 25, 50].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6"/></svg>
              </span>
            </div>
            <span className="text-gray-500 dark:text-gray-400">entries</span>
          </div>
          <div className="flex items-center gap-4 ml-auto">
            <Switch label="Pending" color="orange" defaultChecked={showPending} onChange={setShowPending} />
            <Switch label="Rejected" color="red" defaultChecked={showRejected} onChange={setShowRejected} />
            <Switch label="Verified" color="green" defaultChecked={showVerified} onChange={setShowVerified} />
            <Switch label="Resolved" color="cyan" defaultChecked={showResolved} onChange={setShowResolved} />
            <div className="relative w-full max-w-xs">
              <input
                className="h-11 w-full pl-10 pr-4 rounded-lg border appearance-none text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                placeholder="Search by Description, Tree, Road, Reporter"
                value={search}
                onChange={e => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                style={{ paddingLeft: 36 }}
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-400 pointer-events-none">
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"/></svg>
              </span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <TableReport
            reports={paged.map(r => {
              const idSuffix = r.id ? r.id.slice(-5) : '';
              const reportName = `Report_${idSuffix}`;
              let imageUrl = undefined;
              if (Array.isArray(r.reportPictures) && r.reportPictures.length > 0) {
                imageUrl = r.reportPictures[0]?.url;
              } else if (r.image) {
                imageUrl = r.image;
              }
              return {
                id: r.id,
                reportName,
                status: r.status || undefined,
                image: imageUrl,
                reportBy: r.user ? `${r.user.firstname} ${r.user.lastname}` : undefined,
                reportById: r.user?.id,
                verifiedByName: r.verifiedBy ? `${r.verifiedBy.firstname} ${r.verifiedBy.lastname}` : undefined,
                verifiedById: r.verifiedBy?.id,
                resolvedByName: r.resolvedBy ? `${r.resolvedBy.firstname} ${r.resolvedBy.lastname}` : undefined,
                resolvedById: r.resolvedBy?.id,
                reportedAt: (r as { timestamp?: string }).timestamp || '',
                resolvedAt: r.resolvedAt || '',
                onDelete: handleDelete,
              };
            })}
            page={page}
            setPage={setPage}
            entries={pageSize}
            total={filtered.length}
          />
        </div>

        {totalPages > 1 && (
          <div className="mt-4 flex justify-center gap-2">
            <button
              className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              Prev
            </button>
            <span className="px-3 py-1 text-gray-700 dark:text-gray-200">
              Halaman {page} dari {totalPages}
            </span>
            <button
              className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </button>
          </div>
        )}

        {showDeleteModal && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/30 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 w-full max-w-md relative border border-gray-200 dark:border-gray-700">
              <h4 className="mb-4 font-semibold text-gray-800 dark:text-white">
                Konfirmasi Hapus
              </h4>
              <p className="mb-6 text-gray-700 dark:text-gray-200">
                Apakah Anda yakin ingin menghapus laporan ini?
              </p>
              <div className="flex gap-2 justify-end">
                <button
                  className="px-4 py-2 rounded font-semibold shadow bg-red-500 hover:bg-red-600 text-white border border-red-500 transition-colors dark:bg-red-600 dark:hover:bg-red-700 dark:border-red-600"
                  onClick={confirmDelete}
                >
                  Ya, Hapus
                </button>
                <button
                  className="px-4 py-2 rounded font-semibold shadow bg-gray-400 hover:bg-gray-500 text-white border border-gray-400 transition-colors dark:bg-gray-700 dark:hover:bg-gray-600 dark:border-gray-700"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteId(null);
                  }}
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        )}

        {alert.show && (
          <Alert
            variant={alert.variant}
            title={alert.title}
            message={alert.message}
            position="top-center"
            showProgress
            duration={3000}
            isClosable
            onClose={() => setAlert((p) => ({ ...p, show: false }))}
          />
        )}
      </div>
    </div>
  );
}
