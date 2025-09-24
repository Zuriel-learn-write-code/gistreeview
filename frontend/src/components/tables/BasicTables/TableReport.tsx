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
// Inline TrashIcon agar bisa diberi props
const TrashIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg width={props.width || 20} height={props.height || 20} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M6.54142 3.7915C6.54142 2.54886 7.54878 1.5415 8.79142 1.5415H11.2081C12.4507 1.5415 13.4581 2.54886 13.4581 3.7915V4.0415H15.6252H16.666C17.0802 4.0415 17.416 4.37729 17.416 4.7915C17.416 5.20572 17.0802 5.5415 16.666 5.5415H16.3752V8.24638V13.2464V16.2082C16.3752 17.4508 15.3678 18.4582 14.1252 18.4582H5.87516C4.63252 18.4582 3.62516 17.4508 3.62516 16.2082V13.2464V8.24638V5.5415H3.3335C2.91928 5.5415 2.5835 5.20572 2.5835 4.7915C2.5835 4.37729 2.91928 4.0415 3.3335 4.0415H4.37516H6.54142V3.7915ZM14.8752 13.2464V8.24638V5.5415H13.4581H12.7081H7.29142H6.54142H5.12516V8.24638V13.2464V16.2082C5.12516 16.6224 5.46095 16.9582 5.87516 16.9582H14.1252C14.5394 16.9582 14.8752 16.6224 14.8752 16.2082V13.2464ZM8.04142 4.0415H11.9581V3.7915C11.9581 3.37729 11.6223 3.0415 11.2081 3.0415H8.79142C8.37721 3.0415 8.04142 3.37729 8.04142 3.7915V4.0415ZM8.3335 7.99984C8.74771 7.99984 9.0835 8.33562 9.0835 8.74984V13.7498C9.0835 14.1641 8.74771 14.4998 8.3335 14.4998C7.91928 14.4998 7.5835 14.1641 7.5835 13.7498V8.74984C7.5835 8.33562 7.91928 7.99984 8.3335 7.99984ZM12.4168 8.74984C12.4168 8.33562 12.081 7.99984 11.6668 7.99984C11.2526 7.99984 10.9168 8.33562 10.9168 8.74984V13.7498C10.9168 14.1641 11.2526 14.4998 11.6668 14.4998C12.081 14.4998 12.4168 14.1641 12.4168 13.7498V8.74984Z"
      fill="currentColor"
    />
  </svg>
);

interface Report {
  id: string;
  reportName: string;
  title?: string;
  createdAt?: string;
  status?: string;
  image?: string;
  reportBy?: string;
  reportById?: string;
  verifiedByName?: string;
  verifiedById?: string;
  resolvedByName?: string;
  resolvedById?: string;
  reportedAt?: string;
  resolvedAt?: string;
  onDelete?: (id: string) => void;
}

interface TableReportProps {
  reports: Report[];
  page: number;
  setPage: (n: number) => void;
  entries: number;
  total: number;
}

const TableReport: React.FC<TableReportProps> = ({ reports = [], page, setPage, entries, total }) => {
  const totalPages = Math.ceil((total || 0) / entries);
  const paged = reports;
  const startIndex = total === 0 ? 0 : (page - 1) * entries + 1;
  const endIndex = Math.min(page * entries, total);

  return (
    <>
      <table className="min-w-full text-sm">
        <thead>
          <tr className="bg-blue-50 dark:bg-blue-900">
            <th className="px-4 py-2 text-left text-gray-700 dark:text-gray-100 font-medium rounded-tl-xl">Report Name</th>
            <th className="px-4 py-2 text-left text-gray-700 dark:text-gray-100 font-medium">Report By</th>
            <th className="px-4 py-2 text-left text-gray-700 dark:text-gray-100 font-medium">Verified By</th>
            <th className="px-4 py-2 text-left text-gray-700 dark:text-gray-100 font-medium">Resolved By</th>
            <th className="px-4 py-2 text-left text-gray-700 dark:text-gray-100 font-medium">Reported At</th>
            <th className="px-4 py-2 text-left text-gray-700 dark:text-gray-100 font-medium">Resolved At</th>
            <th className="px-4 py-2 text-left text-gray-700 dark:text-gray-100 font-medium rounded-tr-xl">Action</th>
          </tr>
        </thead>
        <tbody>
          {paged.map((report) => (
            <tr key={report.id} className="border-b dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors">
              <td className="px-4 py-2 text-gray-700 dark:text-gray-200">
                <div className="flex items-center gap-2">
                  <img
                    src={report.image || '/images/report-default.jpg'}
                    alt="Report"
                    className="w-8 h-8 object-cover rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                  />
                  <div className="flex flex-col">
                    <a
                      href={`/view/report/${report.id}`}
                      className="block font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                    >
                      {report.reportName || '-'}
                    </a>
                    {report.status && (
                      <span
                        className={`block mt-1 text-xs font-semibold
                          ${report.status === 'pending' ? 'text-orange-500 dark:text-orange-300' : ''}
                          ${report.status === 'rejected' ? 'text-red-500 dark:text-red-300' : ''}
                          ${report.status === 'verified' ? 'text-green-500 dark:text-green-300' : ''}
                          ${report.status === 'resolved' ? 'text-cyan-500 dark:text-cyan-300' : ''}
                          ${!['pending','rejected','verified','resolved'].includes((report.status||'').toLowerCase()) ? 'text-gray-500 dark:text-gray-300' : ''}
                        `}
                      >
                        {report.status}
                      </span>
                    )}
                  </div>
                </div>
              </td>
              <td className="px-4 py-2 text-gray-700 dark:text-gray-200">
                {report.reportById && report.reportBy ? (
                  <a
                    href={`/view/profile/${report.reportById}`}
                    className="text-blue-600 dark:text-blue-300 hover:underline cursor-pointer"
                  >
                    {report.reportBy}
                  </a>
                ) : (report.reportBy || '-')}
              </td>
              <td className="px-4 py-2 text-gray-700 dark:text-gray-200">
                {report.verifiedById && report.verifiedByName ? (
                  <a
                    href={`/view/profile/${report.verifiedById}`}
                    className="text-blue-600 dark:text-blue-300 hover:underline cursor-pointer"
                  >
                    {report.verifiedByName}
                  </a>
                ) : (report.verifiedByName || '-')}
              </td>
              <td className="px-4 py-2 text-gray-700 dark:text-gray-200">
                {report.resolvedById && report.resolvedByName ? (
                  <a
                    href={`/view/profile/${report.resolvedById}`}
                    className="text-blue-600 dark:text-blue-300 hover:underline cursor-pointer"
                  >
                    {report.resolvedByName}
                  </a>
                ) : (report.resolvedByName || '-')}
              </td>
              {/* Status sudah di bawah nama, kolom status dihapus */}
              <td className="px-4 py-2 text-gray-700 dark:text-gray-200">{report.reportedAt ? formatDate(report.reportedAt) : '-'}</td>
              <td className="px-4 py-2 text-gray-700 dark:text-gray-200">{report.resolvedAt ? formatDate(report.resolvedAt) : '-'}</td>
              <td className="px-4 py-2 text-gray-700 dark:text-gray-200">
                <button
                  type="button"
                  className="p-2 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500"
                  title="Delete"
                  onClick={() => report.onDelete && report.onDelete(report.id)}
                >
                  <span className="sr-only">Delete</span>
                  <TrashIcon width={20} height={20} />
                </button>
              </td>
            </tr>
          ))}
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

export default TableReport;
