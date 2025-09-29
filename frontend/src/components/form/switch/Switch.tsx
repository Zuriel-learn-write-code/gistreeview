import React, { useState, useEffect } from "react";

interface SwitchProps {
  label: string;
  defaultChecked?: boolean;
  disabled?: boolean;
  onChange?: (checked: boolean) => void;
  color?:
    | "blue"
    | "gray"
    | "red"
    | "orange"
    | "green"
    | "teal"
    | "purple"
    | "cyan";
  // If provided, component becomes controlled by this prop
  checked?: boolean;
}

const Switch: React.FC<SwitchProps> = ({
  label,
  defaultChecked = false,
  disabled = false,
  onChange,
  color = "blue", // Default to blue color
  checked,
}) => {
  // support both controlled and uncontrolled usage
  const isControlled = typeof checked !== "undefined";
  const [isChecked, setIsChecked] = useState<boolean>(
    isControlled ? (checked as boolean) : defaultChecked
  );

  // keep internal state in sync when controlled or when defaultChecked changes
  // (addresses cases where parent updates prop after mount)
  useEffect(() => {
    if (isControlled) {
      setIsChecked(checked as boolean);
    }
  }, [checked, isControlled]);

  useEffect(() => {
    if (!isControlled) {
      setIsChecked(defaultChecked);
    }
  }, [defaultChecked, isControlled]);

  const handleToggle = () => {
    if (disabled) return;
    const newCheckedState = !isChecked;
    if (!isControlled) setIsChecked(newCheckedState);
    if (onChange) {
      onChange(newCheckedState);
    }
  };

  let switchColors;
  switch (color) {
    case "cyan":
      switchColors = {
        background: isChecked
          ? "bg-cyan-500 dark:bg-cyan-300"
          : "bg-gray-200 dark:bg-white/10",
        knob: isChecked
          ? "translate-x-full bg-white dark:bg-gray-900"
          : "translate-x-0 bg-white dark:bg-gray-900",
      };
      break;
    case "red":
      switchColors = {
        background: isChecked
          ? "bg-red-500 dark:bg-red-300"
          : "bg-gray-200 dark:bg-white/10",
        knob: isChecked
          ? "translate-x-full bg-white dark:bg-gray-900"
          : "translate-x-0 bg-white dark:bg-gray-900",
      };
      break;
    case "orange":
      switchColors = {
        background: isChecked
          ? "bg-orange-500 dark:bg-orange-300"
          : "bg-gray-200 dark:bg-white/10",
        knob: isChecked
          ? "translate-x-full bg-white dark:bg-gray-900"
          : "translate-x-0 bg-white dark:bg-gray-900",
      };
      break;
    case "green":
      switchColors = {
        background: isChecked
          ? "bg-green-500 dark:bg-green-300"
          : "bg-gray-200 dark:bg-white/10",
        knob: isChecked
          ? "translate-x-full bg-white dark:bg-gray-900"
          : "translate-x-0 bg-white dark:bg-gray-900",
      };
      break;
    case "teal":
      switchColors = {
        background: isChecked
          ? "bg-teal-500 dark:bg-teal-300"
          : "bg-gray-200 dark:bg-white/10",
        knob: isChecked
          ? "translate-x-full bg-white dark:bg-gray-900"
          : "translate-x-0 bg-white dark:bg-gray-900",
      };
      break;
    case "purple":
      switchColors = {
        background: isChecked
          ? "bg-purple-500 dark:bg-purple-300"
          : "bg-gray-200 dark:bg-white/10",
        knob: isChecked
          ? "translate-x-full bg-white dark:bg-gray-900"
          : "translate-x-0 bg-white dark:bg-gray-900",
      };
      break;
    case "gray":
      switchColors = {
        background: isChecked
          ? "bg-gray-800 dark:bg-white/10"
          : "bg-gray-200 dark:bg-white/10",
        knob: isChecked
          ? "translate-x-full bg-white"
          : "translate-x-0 bg-white",
      };
      break;
    default:
      switchColors = {
        background: isChecked ? "bg-brand-500" : "bg-gray-200 dark:bg-white/10",
        knob: isChecked
          ? "translate-x-full bg-white"
          : "translate-x-0 bg-white",
      };
  }

  return (
    <label
      className={`flex cursor-pointer select-none items-center gap-3 text-sm font-medium ${
        disabled ? "text-gray-400" : "text-gray-700 dark:text-gray-400"
      }`}
    >
      {/* hidden checkbox so label is associated with a real form control */}
      <input
        type="checkbox"
        aria-hidden={false}
        className="sr-only"
        checked={isChecked}
        disabled={disabled}
        onChange={(e) => {
          const newChecked = e.target.checked;
          setIsChecked(newChecked);
          if (onChange) onChange(newChecked);
        }}
      />
      <div className="relative" onClick={handleToggle}>
        <div
          className={`block transition duration-150 ease-linear h-6 w-11 rounded-full ${
            disabled
              ? "bg-gray-100 pointer-events-none dark:bg-gray-800"
              : switchColors.background
          }`}
        ></div>
        <div
          className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full shadow-theme-sm duration-150 ease-linear transform ${switchColors.knob}`}
        ></div>
      </div>
      {label}
    </label>
  );
};

export default Switch;
