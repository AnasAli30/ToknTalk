import { ReactNode, MouseEvent } from "react";

interface ButtonProps {
  children: ReactNode;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit" | "reset";
}

export function Button({
  children,
  onClick,
  disabled = false,
  className = "",
  type = "button",
}: ButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      type={type}
      className={`font-inherit rounded-lg bg-blue-600 px-5 py-3 text-base text-white transition-colors duration-200 hover:bg-blue-700 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${className}`.trim()}
    >
      {children}
    </button>
  );
}

export type { ButtonProps };
