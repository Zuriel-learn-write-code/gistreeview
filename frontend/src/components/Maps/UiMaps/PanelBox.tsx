import React from 'react';

type PanelBoxProps = React.PropsWithChildren<{ className?: string; width?: string }>;

const PanelBox: React.FC<PanelBoxProps> = ({ children, className = '', width = 'w-64' }) => {
  return (
    <div className={`${width} bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded shadow p-3 border border-gray-200 dark:border-gray-700 ${className}`}>
      {children}
    </div>
  );
};

export default PanelBox;
