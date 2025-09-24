import React, { useEffect, useState } from "react";
import TableUsers from "../../components/tables/BasicTables/TableUsers";
import Switch from "../../components/form/switch/Switch";
import { SearchIcon } from '../../icons';
import { apiUrl } from "../../config/api";
import Alert from "../../components/ui/alert/Alert";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";

interface User {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
  userpic: string;
  bio: string;
  address: string;
  country: string;
  province: string;
  city: string;
  postalcode: string;
  role: 'admin' | 'officer' | 'user';
  timestamp: string;
}

export default function DataUser() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [roleFilters, setRoleFilters] = useState({ admin: true, officer: true, user: true });
  const [form, setForm] = useState<Partial<User>>({});
  // const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [alert, setAlert] = useState<{
    show: boolean;
    variant: "success" | "error";
    title: string;
    message: string;
  }>({ show: false, variant: "success", title: "", message: "" });
  const [page, setPage] = useState(1);
  const [entries, setEntries] = useState(10);
  const filteredUsers = users.filter(
    (user) =>
      ((user.firstname?.toLowerCase() || "").includes(search.toLowerCase()) ||
        (user.lastname?.toLowerCase() || "").includes(search.toLowerCase()) ||
        (user.email?.toLowerCase() || "").includes(search.toLowerCase()) ||
        (user.city?.toLowerCase() || "").includes(search.toLowerCase())) &&
      roleFilters[user.role]
  );
  const totalPages = Math.ceil(filteredUsers.length / entries);
  const pagedUsers = filteredUsers.slice(
    (page - 1) * entries,
    page * entries
  );

  useEffect(() => {
    // Fetch users on mount
    fetch(apiUrl("/api/profile/all"))
      .then((res) => res.json())
      .then((data) => setUsers(data));
  }, []);

  const handleEdit = (user: User) => {
    setEditId(user.id);
    setForm(user);
    // Open edit modal
  };

  // const handleAdd = () => {
  //   setEditId(null);
  //   setForm({});
  //   setShowModal(true);
  // };

  const handleDelete = (id: string) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (deleteId) {
      try {
        const res = await fetch(apiUrl(`/api/profile/${deleteId}`), {
          method: "DELETE",
        });
        if (!res.ok) throw new Error("Gagal menghapus user");
        setUsers((prev) => prev.filter((u) => u.id !== deleteId));
        setAlert({
          show: true,
          variant: "success",
          title: "Berhasil",
          message: "User berhasil dihapus.",
        });
      } catch {
        setAlert({
          show: true,
          variant: "error",
          title: "Gagal",
          message: "Gagal menghapus user.",
        });
      } finally {
        setDeleteId(null);
        setShowDeleteModal(false);
      }
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    if (editId) {
      // Update user
      try {
        const res = await fetch(apiUrl(`/api/profile/${editId}`), {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error("Gagal mengedit user");
        const updated = await res.json();
        setUsers((prev) => prev.map((u) => (u.id === editId ? updated : u)));
        setAlert({
          show: true,
          variant: "success",
          title: "Berhasil",
          message: "User berhasil diedit.",
        });
      } catch {
        setAlert({
          show: true,
          variant: "error",
          title: "Gagal",
          message: "Gagal mengedit user.",
        });
      } finally {
        setEditId(null);
        setForm({});
      }
    } else {
      // Add user
      try {
        const res = await fetch(apiUrl("/api/register"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error("Gagal menambah user");
        const created = await res.json();
        setUsers((prev) => [...prev, { ...form, ...created } as User]);
        setAlert({
          show: true,
          variant: "success",
          title: "Berhasil",
          message: "User berhasil ditambah.",
        });
      } catch {
        setAlert({
          show: true,
          variant: "error",
          title: "Gagal",
          message: "Gagal menambah user.",
        });
      } finally {
        setForm({});
      }
    }
  };

  return (
    <div>
      <PageMeta
        title="Data User"
        description="Tabel data user dan menu edit/tambah/hapus"
      />
      <PageBreadcrumb pageTitle="Data User" />
      <div className="rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12">
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
            {/* Role filter switches */}
            <Switch
              label="Admin"
              color="red"
              defaultChecked={roleFilters.admin}
              onChange={(checked) => setRoleFilters((prev) => ({ ...prev, admin: checked }))}
            />
            <Switch
              label="Officer"
              color="orange"
              defaultChecked={roleFilters.officer}
              onChange={(checked) => setRoleFilters((prev) => ({ ...prev, officer: checked }))}
            />
            <Switch
              label="User"
              color="green"
              defaultChecked={roleFilters.user}
              onChange={(checked) => setRoleFilters((prev) => ({ ...prev, user: checked }))}
            />
            <div className="relative w-full max-w-xs">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-400 pointer-events-none">
                <SearchIcon className="w-[18px] h-[18px] text-gray-400 dark:text-gray-400" />
              </span>
              <input
                type="text"
                className="h-11 w-full pl-10 pr-4 rounded-lg border appearance-none text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                placeholder="Search by Name or Email"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>
        </div>
        {/* TableUsers dengan data real user */}
        <div className="mt-8">
          <TableUsers
            users={pagedUsers}
            onEdit={(user) => handleEdit(user as User)}
            onDelete={(user) => handleDelete((user as User).id)}
          />
          {/* Info jumlah data seperti DataTable */}
          <div className="flex items-center justify-between mt-4">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Showing {filteredUsers.length === 0 ? 0 : (page - 1) * entries + 1} to {Math.min(page * entries, filteredUsers.length)} of {filteredUsers.length} entries
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
        </div>
        {/* Modal Edit User */}
        {editId && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/30 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-8 w-full max-w-2xl relative z-[10000] transition-colors duration-300">
              <button
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-2xl"
                onClick={() => {
                  setEditId(null);
                  setForm({});
                }}
                aria-label="Tutup"
              >
                &times;
              </button>
              <h4 className="mb-4 font-semibold text-lg text-gray-800 dark:text-white">
                Edit User
              </h4>
              <form
                className="grid grid-cols-2 gap-4"
                onSubmit={async (e) => {
                  e.preventDefault();
                  await handleSave();
                }}
              >
                <input
                  className="border border-gray-300 dark:border-gray-700 px-3 py-2 rounded bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 dark:focus:border-blue-400 dark:focus:ring-blue-900 transition-colors"
                  name="firstname"
                  placeholder="Nama Depan"
                  value={form.firstname || ""}
                  readOnly
                />
                <input
                  className="border border-gray-300 dark:border-gray-700 px-3 py-2 rounded bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 dark:focus:border-blue-400 dark:focus:ring-blue-900 transition-colors"
                  name="lastname"
                  placeholder="Nama Belakang"
                  value={form.lastname || ""}
                  readOnly
                />
                <input
                  className="border border-gray-300 dark:border-gray-700 px-3 py-2 rounded bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 dark:focus:border-blue-400 dark:focus:ring-blue-900 transition-colors"
                  name="email"
                  placeholder="Email"
                  value={form.email || ""}
                  readOnly
                />
                <input
                  className="border border-gray-300 dark:border-gray-700 px-3 py-2 rounded bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 dark:focus:border-blue-400 dark:focus:ring-blue-900 transition-colors"
                  name="phone"
                  placeholder="Telepon"
                  value={form.phone || ""}
                  readOnly
                />
                <input
                  className="border border-gray-300 dark:border-gray-700 px-3 py-2 rounded bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 dark:focus:border-blue-400 dark:focus:ring-blue-900 transition-colors"
                  name="city"
                  placeholder="Kota"
                  value={form.city || ""}
                  readOnly
                />
                <select
                  className="border border-gray-300 dark:border-gray-700 px-3 py-2 rounded bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 dark:focus:border-blue-400 dark:focus:ring-blue-900 transition-colors"
                  name="role"
                  value={form.role || "user"}
                  onChange={handleChange}
                >
                  <option value="admin">admin</option>
                  <option value="officer">officer</option>
                  <option value="user">user</option>
                </select>
                <div className="col-span-2 mt-4 flex gap-2">
                  <button
                    type="submit"
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 dark:bg-green-700 dark:hover:bg-green-900 transition"
                  >
                    Simpan
                  </button>
                  <button
                    type="button"
                    className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500 dark:bg-gray-700 dark:hover:bg-gray-900 transition"
                    onClick={() => {
                      setEditId(null);
                      setForm({});
                    }}
                  >
                    Batal
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* Modal Konfirmasi Hapus */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/20 dark:bg-black/50 backdrop-blur-sm">
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="hapus-title"
              className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-8 w-full max-w-md relative z-[10000] border border-gray-200 dark:border-gray-700 transition-colors"
            >
              <h4
                id="hapus-title"
                className="mb-4 font-semibold text-lg text-gray-800 dark:text-white"
              >
                Konfirmasi Hapus
              </h4>
              <p className="mb-6 text-gray-700 dark:text-gray-300">
                Apakah Anda yakin ingin menghapus user ini?
              </p>
              <div className="flex gap-2 justify-end">
                <button
                  aria-label="Konfirmasi hapus user"
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-300 dark:focus:ring-red-700"
                  onClick={confirmDelete}
                >
                  Ya, Hapus
                </button>
                <button
                  aria-label="Batalkan hapus user"
                  className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500 dark:bg-gray-700 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-700"
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
        {/* Alert */}
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
        {/* Pagination */}
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
      </div>
    </div>
  );
}
