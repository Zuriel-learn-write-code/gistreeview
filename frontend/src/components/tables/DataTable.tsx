import { SearchIcon } from '../../icons';
import React, { useState } from "react";

interface DataRow {
  id: number;
  user: {
    image: string;
    name: string;
  };
  position: string;
  office: string;
  age: number;
  startDate: string;
  salary: string;
}

const initialData: DataRow[] = [
  {
    id: 1,
    user: { image: "/images/user/user-20.jpg", name: "Abram Schleifer" },
    position: "Sales Assistant",
    office: "Edinburgh",
    age: 57,
    startDate: "25 Apr, 2027",
    salary: "$89,500",
  },
  {
    id: 2,
    user: { image: "/images/user/user-21.jpg", name: "Carla George" },
    position: "Sales Assistant",
    office: "London",
    age: 45,
    startDate: "11 May, 2027",
    salary: "$15,500",
  },
  {
    id: 3,
    user: { image: "/images/user/user-22.jpg", name: "Ekstrom Bothman" },
    position: "Sales Assistant",
    office: "San Francisco",
    age: 53,
    startDate: "15 Nov, 2027",
    salary: "$19,200",
  },
  {
    id: 4,
    user: { image: "/images/user/user-23.jpg", name: "Emery Culhane" },
    position: "Sales Assistant",
    office: "New York",
    age: 45,
    startDate: "29 Jun, 2027",
    salary: "$23,500",
  },
  // Tambahan dummy data untuk uji pagination
  {
    id: 5,
    user: { image: "/images/user/user-24.jpg", name: "User Five" },
    position: "Developer",
    office: "Tokyo",
    age: 30,
    startDate: "01 Jan, 2027",
    salary: "$50,000",
  },
  {
    id: 6,
    user: { image: "/images/user/user-25.jpg", name: "User Six" },
    position: "Designer",
    office: "Berlin",
    age: 28,
    startDate: "12 Feb, 2027",
    salary: "$45,000",
  },
  {
    id: 7,
    user: { image: "/images/user/user-26.jpg", name: "User Seven" },
    position: "Manager",
    office: "Paris",
    age: 40,
    startDate: "23 Mar, 2027",
    salary: "$70,000",
  },
  {
    id: 8,
    user: { image: "/images/user/user-27.jpg", name: "User Eight" },
    position: "QA",
    office: "Madrid",
    age: 32,
    startDate: "14 Apr, 2027",
    salary: "$48,000",
  },
  {
    id: 9,
    user: { image: "/images/user/user-28.jpg", name: "User Nine" },
    position: "Support",
    office: "Rome",
    age: 29,
    startDate: "05 May, 2027",
    salary: "$42,000",
  },
  {
    id: 10,
    user: { image: "/images/user/user-29.jpg", name: "User Ten" },
    position: "Sales",
    office: "Lisbon",
    age: 35,
    startDate: "16 Jun, 2027",
    salary: "$55,000",
  },
  {
    id: 11,
    user: { image: "/images/user/user-30.jpg", name: "User Eleven" },
    position: "HR",
    office: "Vienna",
    age: 38,
    startDate: "27 Jul, 2027",
    salary: "$60,000",
  },
  {
    id: 12,
    user: { image: "/images/user/user-31.jpg", name: "User Twelve" },
    position: "Finance",
    office: "Prague",
    age: 41,
    startDate: "08 Aug, 2027",
    salary: "$65,000",
  },
  {
    id: 13,
    user: { image: "/images/user/user-32.jpg", name: "User Thirteen" },
    position: "Marketing",
    office: "Budapest",
    age: 36,
    startDate: "19 Sep, 2027",
    salary: "$58,000",
  },
  {
    id: 14,
    user: { image: "/images/user/user-33.jpg", name: "User Fourteen" },
    position: "Sales",
    office: "Warsaw",
    age: 33,
    startDate: "30 Oct, 2027",
    salary: "$53,000",
  },
  {
    id: 15,
    user: { image: "/images/user/user-34.jpg", name: "User Fifteen" },
    position: "Developer",
    office: "Brussels",
    age: 27,
    startDate: "11 Nov, 2027",
    salary: "$47,000",
  },
  {
    id: 16,
    user: { image: "/images/user/user-35.jpg", name: "User Sixteen" },
    position: "Designer",
    office: "Amsterdam",
    age: 26,
    startDate: "22 Dec, 2027",
    salary: "$44,000",
  },
  {
    id: 17,
    user: { image: "/images/user/user-36.jpg", name: "User Seventeen" },
    position: "Manager",
    office: "Copenhagen",
    age: 39,
    startDate: "02 Jan, 2028",
    salary: "$72,000",
  },
  {
    id: 18,
    user: { image: "/images/user/user-37.jpg", name: "User Eighteen" },
    position: "QA",
    office: "Stockholm",
    age: 31,
    startDate: "13 Feb, 2028",
    salary: "$49,000",
  },
  {
    id: 19,
    user: { image: "/images/user/user-38.jpg", name: "User Nineteen" },
    position: "Support",
    office: "Oslo",
    age: 34,
    startDate: "24 Mar, 2028",
    salary: "$43,000",
  },
  {
    id: 20,
    user: { image: "/images/user/user-39.jpg", name: "User Twenty" },
    position: "Sales",
    office: "Helsinki",
    age: 37,
    startDate: "05 Apr, 2028",
    salary: "$56,000",
  },
];

const PAGE_SIZE = 10;

const DataTable: React.FC = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [entries, setEntries] = useState(PAGE_SIZE);

  const filtered = initialData.filter(
    (row) =>
      row.user.name.toLowerCase().includes(search.toLowerCase()) ||
      row.position.toLowerCase().includes(search.toLowerCase()) ||
      row.office.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / entries);
  const paged = filtered.slice((page - 1) * entries, page * entries);

  return (
    <div className="rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] p-6">
      <div className="flex flex-wrap items-center justify-between mb-4 gap-2 px-2 md:px-4">
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
        <div className="relative w-full max-w-xs ml-auto">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-400 pointer-events-none">
            <SearchIcon className="w-[18px] h-[18px] text-gray-400 dark:text-gray-400" />
          </span>
          <input
            className="h-11 w-full pl-10 pr-4 rounded-lg border appearance-none text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
            placeholder="Search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-800">
              <th className="px-4 py-2 text-left text-gray-500 dark:text-gray-400">User</th>
              <th className="px-4 py-2 text-left text-gray-500 dark:text-gray-400">Position</th>
              <th className="px-4 py-2 text-left text-gray-500 dark:text-gray-400">Office</th>
              <th className="px-4 py-2 text-left text-gray-500 dark:text-gray-400">Age</th>
              <th className="px-4 py-2 text-left text-gray-500 dark:text-gray-400">Start date</th>
              <th className="px-4 py-2 text-left text-gray-500 dark:text-gray-400">Salary</th>
            </tr>
          </thead>
          <tbody>
            {paged.map((row) => (
              <tr key={row.id} className="border-b dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors">
                <td className="px-4 py-2 flex items-center gap-2 text-gray-700 dark:text-gray-200">
                  <img
                    src={row.user.image}
                    alt={row.user.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <span>{row.user.name}</span>
                </td>
                <td className="px-4 py-2 text-gray-700 dark:text-gray-200">{row.position}</td>
                <td className="px-4 py-2 text-gray-700 dark:text-gray-200">{row.office}</td>
                <td className="px-4 py-2 text-gray-700 dark:text-gray-200">{row.age}</td>
                <td className="px-4 py-2 text-gray-700 dark:text-gray-200">{row.startDate}</td>
                <td className="px-4 py-2 text-gray-700 dark:text-gray-200">{row.salary}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between mt-4">
        <span className="text-sm text-gray-500 dark:text-gray-400">
          Showing {filtered.length === 0 ? 0 : (page - 1) * entries + 1} to {Math.min(page * entries, filtered.length)} of {filtered.length} entries
        </span>
        <div className="flex gap-2">
          <button
            className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            &lt;
          </button>
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              className={`px-3 py-1 rounded ${page === i + 1 ? "bg-blue-500 text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200"}`}
              onClick={() => setPage(i + 1)}
            >
              {i + 1}
            </button>
          ))}
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
  );
};

export default DataTable;
