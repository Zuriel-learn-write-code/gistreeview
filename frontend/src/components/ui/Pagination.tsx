import React from "react";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

function getPages(current: number, total: number) {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const pages = [];
  if (current > 3) pages.push(1);
  if (current > 4) pages.push("...");
  for (
    let i = Math.max(2, current - 1);
    i <= Math.min(total - 1, current + 1);
    i++
  ) {
    pages.push(i);
  }
  if (current < total - 3) pages.push("...");
  if (current < total - 2) pages.push(total);
  return pages;
}

const Pagination: React.FC<PaginationProps> = ({
  page,
  totalPages,
  onPageChange,
  className,
}) => {
  const pages = getPages(page, totalPages);
  return (
    <nav
      className={`flex items-center justify-center gap-1 select-none ${
        className || ""
      }`}
      aria-label="Pagination"
    >
      <button
        className="px-2 py-1 rounded bg-gray-200 dark:bg-gray-900 text-gray-700 dark:text-gray-200 border-gray-400 dark:border-gray-700 disabled:opacity-50"
        disabled={page === 1}
        onClick={() => onPageChange(page - 1)}
        aria-label="Previous"
      >
        &lt;
      </button>
      {pages.map((p, idx) =>
        p === "..." ? (
          <span key={idx} className="px-2 py-1">
            ...
          </span>
        ) : (
          <button
            key={p}
            className={`px-3 py-1 rounded-full bg-gray-200 dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-semibold ${
              p === page
                ? "bg-indigo-600 text-white dark:bg-indigo-500 border-indigo-600 dark:border-indigo-500"
                : "hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
            onClick={() => onPageChange(Number(p))}
            aria-current={p === page ? "page" : undefined}
          >
            {p}
          </button>
        )
      )}
      <button
        className="px-2 py-1 rounded bg-gray-200 dark:bg-gray-900 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-700 disabled:opacity-50"
        disabled={page === totalPages}
        onClick={() => onPageChange(page + 1)}
        aria-label="Next"
      >
        &gt;
      </button>
    </nav>
  );
};

export default Pagination;
