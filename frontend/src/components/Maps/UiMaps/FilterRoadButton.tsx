import React from "react";
import BaseButton from "./BaseButton";

type FilterRoadButtonProps = {
  onToggle: () => void;
  active?: boolean;
  btnSize?: { w?: number; h?: number } | undefined;
};

const FilterRoadButton: React.FC<FilterRoadButtonProps> = ({ onToggle, active, btnSize }) => {
  return (
    <BaseButton
      onClick={onToggle}
      active={active}
      title={active ? "Close road filter" : "Filter roads"}
      btnSize={btnSize}
      className={active ? "ring-2 ring-blue-400" : ""}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M4 6h16M6 12h12M8 18h8"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </BaseButton>
  );
};

export default FilterRoadButton;