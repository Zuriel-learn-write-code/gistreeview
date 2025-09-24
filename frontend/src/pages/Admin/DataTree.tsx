import { useEffect, useState } from "react";
import Switch from "../../components/form/switch/Switch";
import { apiUrl } from "../../config/api";
import Alert from "../../components/ui/alert/Alert";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import TableTrees from '../../components/tables/BasicTables/TableTrees';

// (String similarity helpers removed; not needed after modal/form removal)

// Interface/type definitions
// RoadOption interface removed
interface Tree {
  id: string;
  latitude: number;
  longitude: number;
  species: string;
  age: number;
  trunk_diameter: number;
  lbranch_width: number;
  ownership: string;
  road: {
    id: string;
    nameroad: string;
    description?: string;
  } | null;
  roadId?: string | null;
  description: string;
  status: string;
  timestamp: string;
  groupedIds?: string[]; // Add this field for grouped trees
}
// TreePicture interface removed (image column removed)

export default function DataTree() {
  // State
  // Removed unused roads state
  // Removed unused states: roadSearch, showRoadDropdown, searchQuery, selectedRoadFilter

  const [uiAlert, setUiAlert] = useState<{
    show: boolean;
    variant: "success" | "error";
    title: string;
    message: string;
  }>({ show: false, variant: "success", title: "", message: "" });
  const [trees, setTrees] = useState<Tree[]>([]);
  const [treePictures, setTreePictures] = useState<{ id: string; url: string; treeId: string }[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilters, setStatusFilters] = useState({ good: true, warning: true, danger: true });
  const [entries, setEntries] = useState(10);
  const [page, setPage] = useState(1);

  // Removed unused state: page

  // Removed unused pageSize

  // Filter logic removed (search & road filter not used)
  const initialFilteredTrees = trees;

  // Then group the filtered trees by species
  const groupedTrees = initialFilteredTrees.reduce((acc, tree) => {
    try {
      // Normalize species name
      const speciesName = !tree.species || tree.species.toLowerCase() === 'unknown' || tree.species.trim() === '' 
        ? 'Unknown'
        : tree.species;

      // If we haven't seen this species before, create a new entry
      if (!acc[speciesName]) {
        acc[speciesName] = {
          ...tree,
          species: speciesName,
          // Keep track of all IDs for this species group
          groupedIds: [tree.id]
        };
      } else {
        // If we've seen this species before, update the grouped IDs
        acc[speciesName].groupedIds.push(tree.id);
      }
      return acc;
    } catch (error) {
      console.error("Error grouping tree:", tree, error);
      return acc;
    }
  }, {} as Record<string, Tree & { groupedIds: string[] }>);

  // Convert grouped trees back to array
  const groupedArray = Object.values(groupedTrees);

  // Apply search and status filters (search covers species and road name)
  const filteredTrees = groupedArray.filter((tree) => {
    const query = search.trim().toLowerCase();
    const matchesSearch =
      !query ||
      (tree.species || "").toLowerCase().includes(query) ||
      (tree.road?.nameroad || "").toLowerCase().includes(query) ||
      (tree.description || "").toLowerCase().includes(query);
    const statusOk = tree.status ? statusFilters[tree.status as 'good' | 'warning' | 'danger'] : true;
    return matchesSearch && statusOk;
  });

  const total = filteredTrees.length;
  const pagedTrees = filteredTrees.slice((page - 1) * entries, page * entries);
  
  // Removed unused variables: totalPages, pagedTrees

  // Removed fetch roads effect

  // picture fetching removed

  // Fetch trees
  useEffect(() => {
    fetch(apiUrl("/api/trees"))
      .then((res) => res.json())
      .then((data) => {
        setTrees(data);
      });
    fetch(apiUrl("/api/treepictures"))
      .then((res) => res.json())
      .then((data) => {
        setTreePictures(data);
      });
  }, []);

  

  // delete handlers removed (action buttons removed)

  // Modal-related functions removed (add/edit modal removed)

  // Auto close alert after 3 seconds
  useEffect(() => {
    if (uiAlert.show) {
      const timer = setTimeout(
        () => setUiAlert((a) => ({ ...a, show: false })),
        3000
      );
      return () => clearTimeout(timer);
    }
  }, [uiAlert.show]);

  // Close road dropdowns when clicking outside
  useEffect(() => {
    // Removed road dropdown outside click logic
  }, []);

  return (
    <div>
      {uiAlert.show && (
        <Alert
          variant={uiAlert.variant}
          title={uiAlert.title}
          message={uiAlert.message}
          position="top-center"
          showProgress={true}
          duration={3000}
          isClosable={true}
          onClose={() => setUiAlert((prev) => ({ ...prev, show: false }))}
        />
      )}
      {/* image preview removed */}
      <PageMeta
        title="Data Tree"
        description="Tabel data pohon dan menu edit/tambah/hapus"
      />
      <PageBreadcrumb pageTitle="Data Tree" />
  <div className="rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12">
        {/* Control bar: Show entries left, status switches + search right */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 px-2 md:px-4">
          <div className="flex items-center gap-3 md:gap-4">
            <span className="text-gray-500 dark:text-gray-400">Show</span>
            <div className="relative">
              <select
                className="h-11 w-20 pl-4 pr-8 rounded-lg border appearance-none text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                value={entries}
                onChange={(e) => {
                  setEntries(Number(e.target.value));
                  setPage(1);
                }}
              >
                {[10, 25, 50].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6"/></svg>
              </span>
            </div>
            <span className="text-gray-500 dark:text-gray-400">entries</span>
          </div>
          <div className="flex items-center gap-4 ml-auto">
            <Switch
              label="Good"
              color="green"
              defaultChecked={statusFilters.good}
              onChange={(checked) => setStatusFilters((prev) => ({ ...prev, good: checked }))}
            />
            <Switch
              label="Warning"
              color="orange"
              defaultChecked={statusFilters.warning}
              onChange={(checked) => setStatusFilters((prev) => ({ ...prev, warning: checked }))}
            />
            <Switch
              label="Danger"
              color="red"
              defaultChecked={statusFilters.danger}
              onChange={(checked) => setStatusFilters((prev) => ({ ...prev, danger: checked }))}
            />
            <div className="relative w-full max-w-xs">
              <input
                className="h-11 w-full pl-10 pr-4 rounded-lg border appearance-none text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                placeholder="Search by Name or Description"
                value={search}
                onChange={(e) => {
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

  <TableTrees trees={pagedTrees} treePictures={treePictures} page={page} setPage={setPage} entries={entries} total={total} />
      </div>
    </div>
  );
}
