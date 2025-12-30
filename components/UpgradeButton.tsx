"use client";

import { Crown, Sparkles } from "lucide-react";
import { LEMON_SQUEEZY_CHECKOUT_URL } from "@/lib/config/lemon-squeezy";

interface UpgradeButtonProps {
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function UpgradeButton({
  variant = "default",
  size = "md",
  className = "",
}: UpgradeButtonProps) {
  const handleUpgrade = () => {
    // Mở checkout link của Lemon Squeezy trong tab mới
    window.open(LEMON_SQUEEZY_CHECKOUT_URL, "_blank", "noopener,noreferrer");
  };

  const baseClasses = "inline-flex items-center gap-2 font-semibold rounded-lg transition-all transform hover:scale-105";
  
  const variantClasses = {
    default: "bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 hover:from-yellow-500 hover:via-yellow-600 hover:to-yellow-700 text-white shadow-lg hover:shadow-xl",
    outline: "border-2 border-yellow-500 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20",
    ghost: "text-yellow-600 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20",
  };

  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  };

  return (
    <button
      onClick={handleUpgrade}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      <Crown className="w-5 h-5" />
      <span>Upgrade to Premium</span>
      <Sparkles className="w-4 h-4" />
    </button>
  );
}

