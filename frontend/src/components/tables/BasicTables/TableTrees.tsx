// Format tanggal dd-Mon-yyyy
function formatDate(dateStr?: string) {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '-';
  const day = String(date.getDate()).padStart(2, '0');
  const month = date.toLocaleString('en-US', { month: 'short' });
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

import React from "react";

interface Tree {
  id: string;
  species: string;
  age: number;
  road?: { nameroad?: string } | null;
  timestamp: string;
  status?: string; // allow any string (parent may use broader type)
}
interface TreePicture {
  id: string;
  url: string;
  treeId: string;
}

interface TableTreesProps {
  trees?: Tree[]; // already paged rows to render
  treePictures?: TreePicture[];
  page: number;
  setPage: (n: number) => void;
  entries: number;
  total: number; // total filtered rows count
}

const AVATAR_FALLBACK = "/images/tree-default.jpg";

const TableTrees: React.FC<TableTreesProps> = ({ trees = [], treePictures = [], page, setPage, entries, total }) => {
  // Props-driven: parent handles filtering and paging
  const totalPages = Math.ceil((total || 0) / entries);
  const paged = trees;
  const startIndex = total === 0 ? 0 : (page - 1) * entries + 1;
  const endIndex = Math.min(page * entries, total);

  return (
    <>
      {/* Table header & rows are rendered below. Controls are handled by parent. */}
      {/* Table tanpa card kecil */}
      <table className="min-w-full text-sm">
        <thead>
          <tr className="bg-blue-50 dark:bg-blue-900">
            <th className="px-4 py-2 text-left text-gray-700 dark:text-gray-100 font-medium rounded-tl-xl">Tree Name</th>
            <th className="px-4 py-2 text-left text-gray-700 dark:text-gray-100 font-medium">Age</th>
            <th className="px-4 py-2 text-left text-gray-700 dark:text-gray-100 font-medium">Location</th>
            <th className="px-4 py-2 text-left text-gray-700 dark:text-gray-100 font-medium rounded-tr-xl">Date Added</th>
          </tr>
        </thead>
        <tbody>
          {paged.map((tree) => {
            const pic = treePictures.find((p) => p.treeId === tree.id);
            const treeImgUrl = pic?.url || AVATAR_FALLBACK;
            return (
              <tr key={tree.id} className="border-b dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors">
                <td className="px-4 py-2 text-gray-700 dark:text-gray-200">
                  <div className="flex items-center gap-2">
                    <img
                      src={treeImgUrl}
                      alt={tree.species}
                      width={40}
                      height={40}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = AVATAR_FALLBACK;
                      }}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <div>
                      <a
                        href={`/view/tree/${tree.id}`}
                        className="block font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                      >
                        {tree.species}
                      </a>
                      {tree.status && (
                        <span
                          className={`block text-theme-xs font-semibold
                            ${tree.status.toLowerCase() === 'good' ? 'text-green-500 dark:text-green-300' : ''}
                            ${tree.status.toLowerCase() === 'warning' ? 'text-orange-500 dark:text-orange-300' : ''}
                            ${tree.status.toLowerCase() === 'danger' ? 'text-red-500 dark:text-red-300' : ''}
                          `}
                        >
                          {tree.status}
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-2 text-gray-700 dark:text-gray-200">{tree.age ? `${tree.age} tahun` : '-'}</td>
                <td className="px-4 py-2 text-gray-700 dark:text-gray-200">{tree.road?.nameroad || '-'}</td>
                <td className="px-4 py-2 text-gray-700 dark:text-gray-200">{tree.timestamp ? formatDate(tree.timestamp) : '-'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {/* Showing entries & pagination */}
      <div className="flex items-center justify-between mt-4">
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

export default TableTrees;
