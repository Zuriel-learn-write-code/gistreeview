interface Props {
  loading: boolean;
  message?: string;
}

export default function LoadingStatus({ loading, message }: Props) {
  return (
    <div className="mb-4 px-2">
      {loading ? (
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
          <svg
            className="animate-spin h-4 w-4 text-gray-600"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            ></path>
          </svg>
          <span>{message || "Loading data..."}</span>
        </div>
      ) : (
        <div className="text-sm text-green-600 dark:text-green-400">
          Data loaded
        </div>
      )}
    </div>
  );
}
