import React from "react";
import { apiUrl, uploadUrl } from "../../config/api";
import { useParams } from "react-router-dom";
import PageMeta from "../../components/common/PageMeta";
// TextArea removed — using plain div for display
import NotFound from "../OtherPage/NotFound";
import Pagination from "../../components/ui/Pagination";

type User = { id: string; firstname: string; lastname: string };
type Road = { id: string; nameroad: string; description?: string };
type Tree = { id: string; species: string; road?: Road };
type ReportPicture = { id: string; reportId: string; url: string };
type Report = {
  id: string;
  userId: string;
  treeId?: string;
  description: string;
  status: string;
  timestamp: string;
  verifiedById?: string | null;
  resolvedById?: string | null;
  resolvedAt?: string | null;
  user?: User;
  tree?: Tree;
};

export default function ViewReport() {
  const { id } = useParams();
  const [report, setReport] = React.useState<Report | null>(null);
  const [pictures, setPictures] = React.useState<ReportPicture[]>([]);
  const [mainImgIdx, setMainImgIdx] = React.useState(0);
  const [thumbPage, setThumbPage] = React.useState(1);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [allUsers, setAllUsers] = React.useState<User[]>([]);

  React.useEffect(() => {
    if (!id || id.toLowerCase() === "viewreport") return;
    setLoading(true);
    Promise.all([
      fetch(apiUrl("/api/reports")).then((res) => res.json()),
      fetch(apiUrl("/api/reportpictures")).then((res) => res.json()),
      fetch(apiUrl("/api/profile/all")).then((res) => res.json()),
      fetch(apiUrl("/api/trees")).then((res) => res.json()),
    ])
      .then(([allReports, allPictures, allUsers, allTrees]) => {
        setAllUsers(allUsers);
        const foundReport = allReports.find((r: Report) => r.id === id);
        if (!foundReport) {
          setError("Report not found");
          setLoading(false);
          return;
        }
        foundReport.user = allUsers.find(
          (u: User) => u.id === foundReport.userId
        );
        if (foundReport.treeId) {
          foundReport.tree = allTrees.find(
            (t: Tree) => t.id === foundReport.treeId
          );
        }
        setReport(foundReport);
        setPictures(
          allPictures.filter((p: ReportPicture) => p.reportId === id)
        );
        setMainImgIdx(0);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load report data.");
        setLoading(false);
      });
  }, [id]);

  if (!id || id.toLowerCase() === "viewreport") return <NotFound />;
  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (error) return <NotFound />;
  if (!report) return null;

  return (
    <>
      <PageMeta
        title={`View Report | ${report.id}`}
        description={`Halaman view report ${report.id}`}
      />
      <div className="w-full max-w-5xl mx-auto my-8 relative">
        {/* Decorative circle for status - perfectly round, color based on status, support dark theme */}
        <div
          className={`absolute w-32 h-32 flex items-center justify-center rounded-full uppercase font-bold text-white text-md -right-4 -top-4 z-10 
            ${
              report.status?.toLowerCase() === "pending"
                ? "bg-gradient-to-br from-yellow-400 to-yellow-600 dark:from-yellow-600 dark:to-yellow-800"
                : ""
            }
            ${
              report.status?.toLowerCase() === "rejected"
                ? "bg-gradient-to-br from-red-400 to-red-700 dark:from-red-700 dark:to-red-900"
                : ""
            }
            ${
              report.status?.toLowerCase() === "verified"
                ? "bg-gradient-to-br from-green-400 to-green-700 dark:from-green-700 dark:to-green-900"
                : ""
            }
            ${
              report.status?.toLowerCase() === "resolved"
                ? "bg-gradient-to-br from-blue-400 to-blue-700 dark:from-blue-700 dark:to-blue-900"
                : ""
            }
            ${
              !["pending", "rejected", "verified", "resolved"].includes(
                report.status?.toLowerCase() || ""
              )
                ? "bg-gray-500 dark:bg-gray-700"
                : ""
            }
          `}
        >
          {report.status}
        </div>

        <div className="rounded-2xl border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] shadow-md pb-6 lg:pb-8">
          <div className="p-8 lg:p-12 flex flex-col md:flex-row gap-8 items-start">
            <div className="md:w-1/2 w-full flex flex-col items-center gap-4">
              <div className="w-full aspect-square rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
                {(() => {
                  const defaultSrc = "/images/report-default.jpg";
                  if (pictures.length === 0) {
                    return (
                      <img
                        src={defaultSrc}
                        alt={`Default report image for ${report.id}`}
                        className="object-cover w-full h-full dark:opacity-80 dark:mix-blend-multiply"
                      />
                    );
                  }

                  const safeIdx = Math.max(
                    0,
                    Math.min(mainImgIdx, pictures.length - 1)
                  );
                  const pic = pictures[safeIdx];
                  let src = defaultSrc;
                  if (pic && pic.url) {
                    src = uploadUrl(pic.url, 'report');
                  }

                  return (
                    <img
                      src={src}
                      alt={`Report image ${safeIdx + 1} of ${pictures.length}`}
                      className="object-cover w-full h-full"
                      onError={(e) => {
                        if (e.currentTarget.src !== defaultSrc) {
                          e.currentTarget.src = defaultSrc;
                        }
                      }}
                    />
                  );
                })()}
              </div>
              {pictures.length > 1 && (
                <div className="flex flex-col items-center w-full">
                  <div className="flex gap-2 flex-wrap justify-center mt-2">
                    {(() => {
                      const pageSize = 6;
                      const startIdx = (thumbPage - 1) * pageSize;
                      const endIdx = startIdx + pageSize;
                      return pictures
                        .slice(startIdx, endIdx)
                        .map((pic, idx) => {
                          const globalIdx = startIdx + idx;
                          const thumbSrc = pic && pic.url ? uploadUrl(pic.url, 'report') : "/images/report-default.jpg";

                          return (
                            <img
                              key={pic.id}
                              src={thumbSrc}
                              alt="report"
                              className={`w-16 h-16 object-cover rounded-lg border cursor-pointer transition-all duration-150 ${
                                mainImgIdx === globalIdx
                                  ? "border-blue-500 dark:border-blue-400 ring-2 ring-blue-300 dark:ring-blue-600"
                                  : "border-gray-200 dark:border-gray-700"
                              } bg-white dark:bg-gray-900`}
                              onClick={() => setMainImgIdx(globalIdx)}
                            />
                          );
                        });
                    })()}
                  </div>
                  {pictures.length > 6 && (
                    <div className="mt-2">
                      <Pagination
                        page={thumbPage}
                        totalPages={Math.ceil(pictures.length / 6)}
                        onPageChange={setThumbPage}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="md:w-1/2 w-full flex flex-col gap-4">
              <h2 className="font-bold text-2xl mb-2 text-gray-800 dark:text-white ">
                Report Detail
              </h2>
              <div className="grid grid-cols-1 gap-2 py-5">
                <table className="w-full mb-4">
                  <tbody>
                    <tr>
                      <td className="text-xs text-gray-500 min-w-[90px] py-1 pr-2 text-right align-top">
                        Report ID :
                      </td>
                      <td className="py-1">
                        <button
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
                          title="Lihat detail report"
                          onClick={() =>
                            window.open(`/view/report/${report.id}`, "_blank")
                          }
                        >
                          {report.id}
                        </button>
                      </td>
                    </tr>
                    <tr>
                      <td className="text-xs text-gray-500 min-w-[90px] py-1 pr-2 text-right align-top">
                        Report Date :
                      </td>
                      <td className="py-1">
                        <span className="text-sm font-medium text-gray-800 dark:text-white/90">
                          {report.timestamp}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="text-xs text-gray-500 min-w-[90px] py-1 pr-2 text-right align-top">
                        Tree :
                      </td>
                      <td className="py-1">
                        {report.tree ? (
                          <button
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
                            title="Lihat detail tree"
                            onClick={() =>
                              window.open(
                                `/view/tree/${report.tree?.id}`,
                                "_blank"
                              )
                            }
                          >
                            {report.tree.species || report.tree.id}
                          </button>
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="text-xs text-gray-500 min-w-[90px] py-1 pr-2 text-right align-top">
                        Road :
                      </td>
                      <td className="py-1">
                        {report.tree && report.tree.road ? (
                          <button
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
                            title="Lihat detail road"
                            onClick={() =>
                              window.open(
                                report.tree?.road?.id
                                  ? `/view/road/${report.tree.road.id}`
                                  : "#",
                                "_blank"
                              )
                            }
                          >
                            {report.tree.road.nameroad || report.tree.road.id}
                          </button>
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="text-xs text-gray-500 min-w-[90px] py-1 pr-2 text-right align-top">
                        Description :
                      </td>
                      <td className="py-1">
                        <div className="w-full text-gray-800 dark:text-white/90 whitespace-pre-wrap">{report.description}</div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          {/* Footer Card Section benar-benar di bawah */}
          <div className="border-t-4 pt-4 text-xs border-gray-200 dark:border-gray-900">
            <table className="w-full">
              <tbody>
                <tr>
                  <td className="text-gray-500 min-w-[90px] py-1 pr-2 text-right align-top">
                    Report By:
                  </td>
                  <td className="py-1">
                    {report.user ? (
                      <button
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                        title="Lihat profile user"
                        onClick={() =>
                          window.open(
                            report.user?.id
                              ? `/view/profile/${report.user.id}`
                              : "#",
                            "_blank"
                          )
                        }
                      >
                        {`${report.user.firstname} ${report.user.lastname}`}
                      </button>
                    ) : (
                      <span className="font-medium text-gray-800 dark:text-white/90">
                        {report.userId}
                      </span>
                    )}
                  </td>
                  <td className="text-gray-500 min-w-[90px] py-1 pr-2 text-right align-top">
                    Resolved By:
                  </td>
                  <td className="py-1">
                    {report.resolvedById ? (
                      (() => {
                        const user = allUsers.find(
                          (u) => u.id === report.resolvedById
                        );
                        return user ? (
                          <button
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                            title="Lihat profile user"
                            onClick={() =>
                              window.open(`/view/profile/${user.id}`, "_blank")
                            }
                          >
                            {`${user.firstname} ${user.lastname}`}
                          </button>
                        ) : (
                          <span className="font-medium text-gray-800 dark:text-white/90">
                            {report.resolvedById}
                          </span>
                        );
                      })()
                    ) : (
                      <span className="font-medium text-gray-800 dark:text-white/90">
                        -
                      </span>
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="text-gray-500 min-w-[90px] py-1 pr-2 text-right align-top">
                    Verified By:
                  </td>
                  <td className="py-1">
                    {report.verifiedById ? (
                      (() => {
                        const user = allUsers.find(
                          (u) => u.id === report.verifiedById
                        );
                        return user ? (
                          <button
                            className="text-blue-600 underline hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                            title="Lihat profile user"
                            onClick={() =>
                              window.open(`/view/profile/${user.id}`, "_blank")
                            }
                          >
                            {`${user.firstname} ${user.lastname}`}
                          </button>
                        ) : (
                          <span className="font-medium text-gray-800 dark:text-white/90">
                            {report.verifiedById}
                          </span>
                        );
                      })()
                    ) : (
                      <span className="font-medium text-gray-800 dark:text-white/90">
                        -
                      </span>
                    )}
                  </td>

                  <td className="text-gray-500 min-w-[90px] py-1 pr-2 text-right align-top">
                    Resolved At:
                  </td>
                  <td className="py-1">
                    <span className="font-medium text-gray-800 dark:text-white/90">
                      {report.resolvedAt || "-"}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
