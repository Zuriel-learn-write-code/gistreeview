import React from "react";
import { apiUrl, uploadUrl } from "../../config/api";
import Pagination from "../../components/ui/Pagination";
import { useParams } from "react-router-dom";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
// TextArea removed — using plain div for description display
import NotFound from "../OtherPage/NotFound";

type Road = {
  id: string;
  nameroad: string;
  description?: string;
};
type Tree = {
  id: string;
  species: string;
  age: number;
  trunk_diameter: number;
  lbranch_width: number;
  ownership: string;
  road?: Road;
  roadId?: string;
  description: string;
  status: string;
  timestamp: string;
};
type TreePicture = { id: string; treeId: string; url: string };
type User = { id: string; firstname: string; lastname: string; email: string };
type Report = {
  id: string;
  userId: string;
  treeId: string;
  description: string;
  status: string;
  timestamp: string;
  verifiedById?: string | null;
  resolvedById?: string | null;
  resolvedAt?: string | null;
  user?: User;
};

export default function ViewTree() {
  const { id } = useParams();
  const [tree, setTree] = React.useState<Tree | null>(null);
  const [pictures, setPictures] = React.useState<TreePicture[]>([]);
  const [reports, setReports] = React.useState<Report[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [thumbPage, setThumbPage] = React.useState(1);
  const [mainImgIdx, setMainImgIdx] = React.useState(0);

  React.useEffect(() => {
    if (!id || id.toLowerCase() === "viewtree") return;
    setLoading(true);
    Promise.all([
      fetch(apiUrl("/api/trees")).then((res) => res.json()),
      fetch(apiUrl("/api/treepictures")).then((res) => res.json()),
      fetch(apiUrl("/api/reports")).then((res) => res.json()),
      fetch(apiUrl("/api/profile/all")).then((res) => res.json()),
      fetch(apiUrl("/api/roads")).then((res) => res.json()),
    ])
      .then(([trees, allPictures, allReports, allUsers, allRoads]) => {
        const foundTree = trees.find((t: Tree) => t.id === id);
        if (!foundTree) {
          setError("Tree not found");
          setLoading(false);
          return;
        }
        // Attach road info if available
        if (foundTree.road && foundTree.road.id) {
          foundTree.road =
            allRoads.find((r: Road) => r.id === foundTree.road.id) ||
            foundTree.road;
        } else if (foundTree.roadId) {
          foundTree.road = allRoads.find(
            (r: Road) => r.id === foundTree.roadId
          );
        }
        setTree(foundTree);
        const filteredPics = allPictures.filter(
          (p: TreePicture) => p.treeId === id
        );
        setPictures(filteredPics);
        setMainImgIdx(0);
        // Attach user info to each report
        const treeReports = allReports.filter((r: Report) => r.treeId === id);
        treeReports.forEach((r: Report) => {
          r.user = allUsers.find((u: User) => u.id === r.userId);
        });
        setReports(treeReports);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load tree data.");
        setLoading(false);
      });
  }, [id]);

  if (!id || id.toLowerCase() === "viewtree") return <NotFound />;
  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (error) return <NotFound />;
  if (!tree) return null;

  return (
    <>
      <PageMeta
        title={`GISTREEVIEW | View Tree`}
        description={`Halaman view tree ${tree.species}`}
      />
      <PageBreadcrumb pageTitle="View Tree" />
      <div className="w-full max-w-5xl mx-auto my-8 relative">
        <div
          className={`absolute w-32 h-32 flex items-center justify-center rounded-full uppercase font-bold text-white text-md -right-4 -top-4 z-10 
    ${
      tree.status?.toLowerCase() === "good"
        ? "bg-gradient-to-br from-green-400 to-green-700 dark:from-green-700 dark:to-green-900"
        : ""
    }
    ${
      tree.status?.toLowerCase() === "warning"
        ? "bg-gradient-to-br from-yellow-400 to-yellow-600 dark:from-yellow-600 dark:to-yellow-800"
        : ""
    }
    ${
      tree.status?.toLowerCase() === "danger"
        ? "bg-gradient-to-br from-red-400 to-red-700 dark:from-red-700 dark:to-red-900"
        : ""
    }
    ${
      !["good", "warning", "danger"].includes(tree.status?.toLowerCase() || "")
        ? "bg-gray-500 dark:bg-gray-700"
        : ""
    }
  `}
        >
          {tree.status}
        </div>
        <div className="rounded-2xl border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] shadow-xl pb-6 lg:pb-8">
          <div className="p-8 lg:p-12 flex flex-col md:flex-row gap-8 items-start">
            <div className="md:w-1/2 w-full flex flex-col items-center gap-4">
              <div className="w-full aspect-square rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
                {(() => {
                  const defaultSrc = "/images/tree-default.jpg";
                  if (pictures.length === 0) {
                    return (
                      <img
                        src={defaultSrc}
                        alt={`Default tree image for ${tree.species}`}
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
                    // If the url already looks like a full URL (Cloudinary or external), use it as-is
                    if (/^https?:\/\//i.test(pic.url)) {
                      src = pic.url;
                    } else {
                      // Otherwise assume it's a filename stored on backend under `${uploadUrl}/tree/`
                      src = uploadUrl(pic.url, "tree");
                    }
                  }

                  return (
                    <img
                      src={src}
                      alt={`Tree image ${safeIdx + 1} of ${
                        pictures.length
                      } for ${tree.species}`}
                      className="object-cover w-full h-full"
                      onError={(e) => {
                        // fallback to default if image fails to load
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
                          const thumbSrc =
                            pic && pic.url
                              ? /^https?:\/\//i.test(pic.url)
                                ? pic.url
                                : uploadUrl(pic.url, "tree")
                              : "/images/tree-default.jpg";

                          return (
                            <img
                              key={pic.id}
                              src={thumbSrc}
                              alt="tree"
                              className={`w-16 h-16 object-cover rounded-lg border cursor-pointer transition-all duration-150 ${
                                mainImgIdx === globalIdx
                                  ? "border-blue-500 dark:border-blue-400 ring-2 ring-blue-300 dark:ring-blue-600"
                                  : "border-gray-200 dark:border-gray-700"
                              } bg-white dark:bg-gray-900`}
                              onClick={() => setMainImgIdx(globalIdx)}
                              onError={(e) => {
                                if (
                                  e.currentTarget.src !==
                                  "/images/tree-default.jpg"
                                ) {
                                  e.currentTarget.src =
                                    "/images/tree-default.jpg";
                                }
                              }}
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
                Tree Detail
              </h2>
              <div className="grid grid-cols-1 gap-2 py-5">
                <table className="w-full mb-4">
                  <tbody>
                    <tr>
                      <td className="text-xs text-gray-500 min-w-[90px] py-1 pr-2 text-right align-top">
                        Tree ID :
                      </td>
                      <td className="py-1">
                        <button className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium">
                          {tree.id}
                        </button>
                      </td>
                    </tr>

                    <tr>
                      <td className="text-xs text-gray-500 min-w-[90px] py-1 pr-2 text-right align-top">
                        Species :
                      </td>
                      <td className="py-1 text-sm font-medium text-gray-800 dark:text-white/90">
                        {tree.species}
                      </td>
                    </tr>
                    <tr>
                      <td className="text-xs text-gray-500 min-w-[90px] py-1 pr-2 text-right align-top">
                        Road :
                      </td>
                      <td className="py-1">
                        {tree.road ? (
                          <button
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
                            title="Lihat detail road"
                            onClick={() =>
                              window.open(
                                `/view/road/${tree.road?.id}`,
                                "_blank"
                              )
                            }
                          >
                            {tree.road.nameroad || tree.road.id}
                          </button>
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="text-xs text-gray-500 min-w-[90px] py-1 pr-2 text-right align-top">
                        Age :
                      </td>
                      <td className="py-1 text-sm font-medium text-gray-800 dark:text-white/90">
                        {tree.age}
                      </td>
                    </tr>
                    <tr>
                      <td className="text-xs text-gray-500 min-w-[90px] py-1 pr-2 text-right align-top">
                        Trunk Diameter :
                      </td>
                      <td className="py-1 text-sm font-medium text-gray-800 dark:text-white/90">
                        {tree.trunk_diameter}
                      </td>
                    </tr>
                    <tr>
                      <td className="text-xs text-gray-500 min-w-[90px] py-1 pr-2 text-right align-top">
                        Branch Width :
                      </td>
                      <td className="py-1 text-sm font-medium text-gray-800 dark:text-white/90">
                        {tree.lbranch_width}
                      </td>
                    </tr>
                    <tr>
                      <td className="text-xs text-gray-500 min-w-[90px] py-1 pr-2 text-right align-top">
                        Ownership :
                      </td>
                      <td className="py-1 text-sm font-medium text-gray-800 dark:text-white/90">
                        {tree.ownership}
                      </td>
                    </tr>
                    {/* Removed Street Name row, replaced by Road above */}

                    <tr>
                      <td className="text-xs text-gray-500 min-w-[90px] py-1 pr-2 text-right align-top">
                        Description :
                      </td>
                      <td className="py-1">
                        <div className="w-full text-gray-800 dark:text-white/90 whitespace-pre-wrap">{tree.description}</div>
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
                    Last Updated:
                  </td>
                  <td className="py-1 font-medium text-gray-800 dark:text-white/90">
                    {tree.timestamp}
                  </td>
                  <td className="text-gray-500 min-w-[90px] py-1 pr-2 text-right align-top">
                    Ownership:
                  </td>
                  <td className="py-1 font-medium text-gray-800 dark:text-white/90">
                    {tree.ownership}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Reports Table */}
        <div className="w-full max-w-5xl mx-auto my-8">
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] shadow-xl p-8 lg:p-12">
            <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-6">
              Reports for this Tree
            </h4>
            {reports.length === 0 ? (
              <div className="text-gray-500 text-sm">
                Belum ada laporan untuk pohon ini.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden text-xs bg-white dark:bg-gray-900">
                  <thead className="bg-gray-100 dark:bg-gray-800">
                    <tr>
                      <th className="px-3 py-2 text-gray-700 dark:text-gray-200">
                        Report ID
                      </th>
                      <th className="px-3 py-2 text-gray-700 dark:text-gray-200">
                        Report By
                      </th>
                      <th className="px-3 py-2 text-gray-700 dark:text-gray-200">
                        Status
                      </th>
                      <th className="px-3 py-2 text-gray-700 dark:text-gray-200">
                        Description
                      </th>
                      <th className="px-3 py-2 text-gray-700 dark:text-gray-200">
                        Report Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900">
                    {reports.map((r) => (
                      <tr
                        key={r.id}
                        className="border-b border-gray-200 dark:border-gray-700"
                      >
                        <td className="px-3 py-2 text-gray-800 dark:text-gray-100">
                          <button
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-xs font-medium"
                            title="Lihat detail report"
                            onClick={() =>
                              window.open(`/view/report/${r.id}`, "_blank")
                            }
                          >
                            {r.id}
                          </button>
                        </td>
                        <td className="px-3 py-2 text-gray-800 dark:text-gray-100">
                          {r.user?.id ? (
                            <button
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-xs font-medium"
                              title="Lihat profile user"
                              onClick={() =>
                                window.open(
                                  `/view/profile/${r.user?.id}`,
                                  "_blank"
                                )
                              }
                            >
                              {r.user?.firstname ?? ""} {r.user?.lastname ?? ""}
                            </button>
                          ) : (
                            r.userId
                          )}
                        </td>
                        <td className="px-3 py-2 text-gray-800 dark:text-gray-100">
                          {r.status}
                        </td>
                        <td className="px-3 py-2 text-gray-800 dark:text-gray-100">
                          {r.description}
                        </td>
                        <td className="px-3 py-2 text-gray-800 dark:text-gray-100">
                          {r.timestamp}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
