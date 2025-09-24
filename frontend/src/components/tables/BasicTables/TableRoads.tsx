import React from "react";

export interface Road {
  id: string;
  nameroad: string;
  description: string;
  status?: "primary" | "secondary" | "tertiary" | "unknown";
}

interface RoadPicture {
  id: string;
  url: string;
  roadId: string;
}

interface TableRoadsProps {
  roads: Road[];
  page: number;
  setPage: (n: number) => void;
  entries: number;
  total: number;
  roadPictures?: RoadPicture[];
}

const AVATAR_FALLBACK = "/images/road-default.jpg";
const TableRoads: React.FC<TableRoadsProps> = ({ roads, page, setPage, entries, total, roadPictures = [] }) => {
  const totalPages = Math.ceil((total || 0) / entries);
  const paged = roads;
  const startIndex = total === 0 ? 0 : (page - 1) * entries + 1;
  const endIndex = Math.min(page * entries, total);

  return (
    <>
      {/* Table tanpa card kecil, konsisten dengan TableTrees */}
      <table className="min-w-full text-sm">
        <thead>
          <tr className="bg-blue-50 dark:bg-blue-900">
            <th className="px-4 py-2 text-left text-gray-700 dark:text-gray-100 font-medium rounded-tl-xl">Road Name</th>
            <th className="px-4 py-2 text-left text-gray-700 dark:text-gray-100 font-medium">ID</th>
            <th className="px-4 py-2 text-left text-gray-700 dark:text-gray-100 font-medium rounded-tr-xl">Description</th>
          </tr>
        </thead>
        <tbody>
          {paged.map((road) => (
            <tr key={road.id} className="border-b dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors">
              <td className="px-4 py-2 text-gray-700 dark:text-gray-200">
                <div className="flex items-center gap-2">
                  <img
                    src={roadPictures.find((p) => p.roadId === road.id)?.url || AVATAR_FALLBACK}
                    alt={road.nameroad}
                    width={40}
                    height={40}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = AVATAR_FALLBACK;
                    }}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <div>
                    <a
                      href={`/view/road/${road.id}`}
                      className="block font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                    >
                      {road.nameroad && road.nameroad.trim() ? road.nameroad : 'Unnamed Road'}
                    </a>
                    <span className={`block text-theme-xs font-semibold
                      ${road.status === 'primary' ? 'text-cyan-500 dark:text-cyan-300' : ''}
                      ${road.status === 'secondary' ? 'text-teal-500 dark:text-teal-300' : ''}
                      ${road.status === 'tertiary' ? 'text-purple-500 dark:text-purple-300' : ''}
                      ${!road.status || road.status === 'unknown' ? 'text-orange-500 dark:text-orange-300' : ''}
                    `}>
                      {road.status === 'primary' && 'Primary'}
                      {road.status === 'secondary' && 'Secondary'}
                      {road.status === 'tertiary' && 'Tertiary'}
                      {(!road.status || road.status === 'unknown') && 'Unknown'}
                    </span>
                  </div>
                </div>
              </td>
              <td className="px-4 py-2 text-gray-700 dark:text-gray-200">{road.id}</td>
              <td className="px-4 py-2 text-gray-700 dark:text-gray-200">{road.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* Showing entries & pagination di luar card */}
      <div className="flex items-center justify-between mt-4 px-2 md:px-4">
        <span className="text-sm text-gray-500 dark:text-gray-400">
          Showing {startIndex} to {endIndex} of {total} entries
        </span>
        <div className="flex gap-2">
          <button
            className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            &lt;
          </button>
          {(() => {
            const pages = [];
            const maxPagesToShow = 5;
            let start = Math.max(1, page - 2);
            let end = Math.min(totalPages, page + 2);
            if (page <= 3) {
              start = 1;
              end = Math.min(totalPages, maxPagesToShow);
            } else if (page >= totalPages - 2) {
              start = Math.max(1, totalPages - maxPagesToShow + 1);
              end = totalPages;
            }
            // Always show page 1
            pages.push(
              <button key={1} className={`px-3 py-1 rounded ${page === 1 ? "bg-blue-500 text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200"}`} onClick={() => setPage(1)}>
                1
              </button>
            );
            if (start > 2) pages.push(<span key="start-ellipsis" className="px-2 text-gray-500 dark:text-gray-300">...</span>);
            for (let i = start; i <= end; i++) {
              if (i === 1 || i === totalPages) continue;
              pages.push(
                <button
                  key={i}
                  className={`px-3 py-1 rounded ${page === i ? "bg-blue-500 text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200"}`}
                  onClick={() => setPage(i)}
                >
                  {i}
                </button>
              );
            }
            if (end < totalPages - 1) pages.push(<span key="end-ellipsis" className="px-2 text-gray-500 dark:text-gray-300">...</span>);
            if (totalPages > 1) {
              pages.push(
                <button key={totalPages} className={`px-3 py-1 rounded ${page === totalPages ? "bg-blue-500 text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200"}`} onClick={() => setPage(totalPages)}>
                  {totalPages}
                </button>
              );
            }
            return pages;
          })()}
          <button
            className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={page === totalPages || totalPages === 0}
            onClick={() => setPage(page + 1)}
          >
            &gt;
          </button>
        </div>
      </div>
    </>
  );
};

export default TableRoads;
