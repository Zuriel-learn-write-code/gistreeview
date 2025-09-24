

import ActionMenu from "../../ui/dropdown/ActionMenu";
import { Link } from "react-router-dom";



export interface TableUserData {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  role: string;
  userpic: string;
}


interface TableUsersProps {
  users: TableUserData[];
  onEdit?: (user: TableUserData) => void;
  onDelete?: (user: TableUserData) => void;
}

const AVATAR_FALLBACK = "/images/user/avatar-profile.jpg";

const TableUsers: React.FC<TableUsersProps> = ({ users, onEdit, onDelete }) => {
  return (
    <table className="min-w-full text-sm">
      <thead>
        <tr className="bg-blue-50 dark:bg-blue-900">
          <th className="px-4 py-2 text-left text-gray-700 dark:text-gray-100 font-medium rounded-tl-xl">User</th>
          <th className="px-4 py-2 text-left text-gray-700 dark:text-gray-100 font-medium">Email</th>
          <th className="px-4 py-2 text-right text-gray-700 dark:text-gray-100 font-medium rounded-tr-xl">Action</th>
        </tr>
      </thead>
      <tbody>
        {users.map((user) => (
          <tr key={user.id} className="border-b dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors">
            <td className="px-4 py-2 text-gray-700 dark:text-gray-200">
              <div className="flex items-center gap-2">
                <img
                  src={user.userpic || AVATAR_FALLBACK}
                  alt={`${user.firstname} ${user.lastname}`}
                  width={40}
                  height={40}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = AVATAR_FALLBACK;
                  }}
                  className="w-8 h-8 rounded-full object-cover"
                />
                <div>
                  <Link
                    to={`/view/profile/${user.id}`}
                    className="block font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    {user.firstname} {user.lastname}
                  </Link>
                  <span
                    className={`block text-theme-xs font-semibold
                      ${user.role.toLowerCase() === 'admin' ? 'text-red-500 dark:text-red-300' : ''}
                      ${user.role.toLowerCase() === 'officer' ? 'text-orange-500 dark:text-orange-300' : ''}
                      ${user.role.toLowerCase() === 'user' ? 'text-green-500 dark:text-green-300' : ''}
                    `}
                  >
                    {user.role}
                  </span>
                </div>
              </div>
            </td>
            <td className="px-4 py-2 text-gray-700 dark:text-gray-200">{user.email}</td>
            <td className="px-4 py-2 text-right text-gray-700 dark:text-gray-200">
              <ActionMenu
                onView={() => onEdit && onEdit(user)}
                onDelete={() => onDelete && onDelete(user)}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default TableUsers;
