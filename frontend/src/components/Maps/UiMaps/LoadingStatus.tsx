import React from 'react';

interface LoadingStatusProps {
  isLoadingRoads: boolean;
  isLoadingTrees: boolean;
}

const LoadingStatus: React.FC<LoadingStatusProps> = ({ isLoadingRoads, isLoadingTrees }) => {
  return (
    <div className="absolute left-3 bottom-6 z-[10002]">
      <div className={`transition-opacity duration-300 ${(isLoadingRoads || isLoadingTrees) ? 'opacity-100' : 'opacity-0'}`}>
        <div className="bg-white/90 dark:bg-gray-800/90 px-3 py-2 rounded-lg shadow-md">
          <div className="flex items-center space-x-3 text-sm text-gray-700 dark:text-gray-300">
            <svg className={`h-4 w-4 ${(isLoadingRoads || isLoadingTrees) ? 'animate-spin' : ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <div className="flex flex-col space-y-1">
              <div className="flex items-center space-x-2">
                <span className="font-medium">Roads:</span>
                <span className={isLoadingRoads ? '' : 'text-green-500'}>
                  {isLoadingRoads ? "Loading..." : "✓"}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-medium">Trees:</span>
                <span className={isLoadingTrees ? '' : 'text-green-500'}>
                  {isLoadingTrees ? "Loading..." : "✓"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingStatus;