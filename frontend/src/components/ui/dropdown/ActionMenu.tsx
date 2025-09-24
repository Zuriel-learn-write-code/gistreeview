import React, { useState, useRef, useEffect } from "react";
import { createPopper, Instance } from '@popperjs/core';

interface ActionMenuProps {
  onView?: () => void;
  onDelete?: () => void;
}

const ActionMenu: React.FC<ActionMenuProps> = ({ onView, onDelete }) => {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
  let popperInstance: Instance | undefined;
    if (open && btnRef.current && menuRef.current) {
      popperInstance = createPopper(btnRef.current, menuRef.current, {
        placement: 'bottom-end',
        modifiers: [
          { name: 'flip', options: { fallbackPlacements: ['top-end'] } },
          { name: 'preventOverflow', options: { boundary: 'viewport' } },
        ],
      });
    }
    return () => {
      if (popperInstance) popperInstance.destroy();
    };
  }, [open]);
  return (
    <div className="relative flex justify-end">
      <button
        ref={btnRef}
        className="dropdown-toggle p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none"
        onClick={() => setOpen((v) => !v)}
        tabIndex={0}
        aria-label="Open actions"
      >
        <span className="inline-block w-6 h-6 flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="4" cy="10" r="1.5" fill="currentColor" />
            <circle cx="10" cy="10" r="1.5" fill="currentColor" />
            <circle cx="16" cy="10" r="1.5" fill="currentColor" />
          </svg>
        </span>
      </button>
      {open && (
        <div
          ref={menuRef}
          className="z-50 mt-2 w-40 rounded-xl border border-gray-200 bg-white shadow-theme-lg dark:border-gray-800 dark:bg-gray-900 py-2 overflow-visible"
          onMouseLeave={() => setOpen(false)}
          style={{ position: 'absolute' }}
        >
          <button
            className="block w-full text-left px-5 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition"
            onClick={() => {
              setOpen(false);
              void (onView && onView());
            }}
          >
            Edit
          </button>
          <button
            className="block w-full text-left px-5 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition"
            onClick={() => {
              setOpen(false);
              void (onDelete && onDelete());
            }}
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
};

export default ActionMenu;
