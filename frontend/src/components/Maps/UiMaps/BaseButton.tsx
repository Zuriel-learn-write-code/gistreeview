import React from 'react';

export interface BaseButtonProps {
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  active?: boolean;
  title?: string;
  btnSize?: { w?: number; h?: number };
  children?: React.ReactNode;
  className?: string;
}

const BaseButton = React.forwardRef<HTMLButtonElement, BaseButtonProps>(
  ({ onClick, active, title, btnSize, children, className = "" }, ref) => {
    const baseStyle: React.CSSProperties = {
      width: btnSize?.w || 40,
      height: btnSize?.h || 40,
    };

    return (
      <button
        ref={ref}
        onClick={onClick}
        style={baseStyle}
        className={`
          flex items-center justify-center
          bg-white dark:bg-gray-800
          border border-gray-200 dark:border-gray-700
          rounded
          shadow-sm
          text-gray-700 dark:text-gray-300 text-2xl
          cursor-pointer
          transition-all
          hover:bg-gray-100
          ${active ? 'bg-gray-200 dark:bg-gray-700' : ''}
          ${className}
        `}
        title={title}
        type="button"
      >
        {children}
      </button>
    );
  }
);

BaseButton.displayName = 'BaseButton';

export default BaseButton;