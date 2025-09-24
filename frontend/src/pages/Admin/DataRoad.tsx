import { useEffect, useState } from "react";
import Switch from "../../components/form/switch/Switch";
import Alert from "../../components/ui/alert/Alert";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { apiUrl } from "../../config/api";
import TableRoads from "../../components/tables/BasicTables/TableRoads";

interface Road {
  id: string;
  nameroad: string;
  description: string;
  status?: "primary" | "secondary" | "tertiary" | "unknown";
}

export default function DataRoad() {
  const [roadSearch, setRoadSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [roadPictures, setRoadPictures] = useState<{ id: string; url: string; roadId: string }[]>([]);
  // toggles for road status filtering - default: primary on
  const [showPrimary, setShowPrimary] = useState(true);
  const [showSecondary, setShowSecondary] = useState(false);
  const [showTertiary, setShowTertiary] = useState(false);
  const [showUnknown, setShowUnknown] = useState(false);
  // previewImg removed (image column removed)
  const [alert, setAlert] = useState<{
    show: boolean;
    variant: "success" | "error";
    title: string;
    message: string;
  }>({ show: false, variant: "success", title: "", message: "" });
  // State untuk modal konfirmasi hapus
  // delete modal/state removed (action buttons removed)
  const [roads, setRoads] = useState<Road[]>([]);
  // edit/form state removed (no add/edit modal)
  const [page, setPage] = useState(1);
  // pageSize now in state
  // Filtering roads using search input and status toggles
  const activeStatuses = new Set<string>();
  if (showPrimary) activeStatuses.add("primary");
  if (showSecondary) activeStatuses.add("secondary");
  if (showTertiary) activeStatuses.add("tertiary");
  if (showUnknown) activeStatuses.add("unknown");

  const filteredRoads = roads.filter((r) => {
    const nameMatches = ((r.nameroad || "").toLowerCase()).includes(
      roadSearch.toLowerCase().trim()
    );
    const status = (r.status || "unknown").toLowerCase();
    const statusMatches = activeStatuses.has(status);
    return nameMatches && statusMatches;
  });
  const pagedRoads = filteredRoads.slice((page - 1) * pageSize, page * pageSize);

  // road pictures removed (image column removed)

  // Fetch data from backend
  useEffect(() => {
    fetch(apiUrl("/api/roads"))
      .then((res) => res.json())
      .then((data) => setRoads(data));
    fetch(apiUrl("/api/roadpictures"))
      .then((res) => res.json())
      .then((data) => setRoadPictures(data));
  }, []);

  // delete handlers removed (actions removed)

  // add/edit functions and modal state removed

  return (
    <div>
      {alert.show && (
        <Alert
          variant={alert.variant}
          title={alert.title}
          message={alert.message}
          position="top-center"
          showProgress={true}
          duration={3000}
          isClosable={true}
          onClose={() => setAlert((prev) => ({ ...prev, show: false }))}
        />
      )}
      {/* image preview removed */}
      <PageMeta
        title="Data Road"
        description="Tabel data jalan dan menu edit/tambah/hapus"
      />
      <PageBreadcrumb pageTitle="Data Road" />
      {/* delete confirmation removed (no action buttons) */}
      {/* Card wrapper untuk filter bar dan tabel, lebar mengikuti tabel */}
  <div className="rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12">
        {/* Filter bar ala DataTree */}
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
            <Switch label="Primary" color="cyan" defaultChecked={showPrimary} onChange={setShowPrimary} />
            <Switch label="Secondary" color="teal" defaultChecked={showSecondary} onChange={setShowSecondary} />
            <Switch label="Tertiary" color="purple" defaultChecked={showTertiary} onChange={setShowTertiary} />
            <Switch label="Unknown" color="orange" defaultChecked={showUnknown} onChange={setShowUnknown} />
            <div className="relative w-full max-w-xs">
              <input
                className="h-11 w-full pl-10 pr-4 rounded-lg border appearance-none text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                placeholder="Search by Name or Description"
                value={roadSearch}
                onChange={e => {
                  setRoadSearch(e.target.value);
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
          <TableRoads
            roads={pagedRoads}
            page={page}
            setPage={setPage}
            entries={pageSize}
            total={filteredRoads.length}
            roadPictures={roadPictures}
          />
        </div>
        {/* add/edit modal removed per user request */}
      </div>
      {/* add/edit modal removed per user request */}
    </div>
  );
}
