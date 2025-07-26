import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Form validation utilities
export const validators = {
  email: (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },
  
  phone: (phone: string) => {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  },
  
  required: (value: string | undefined | null) => {
    return value !== undefined && value !== null && value.trim().length > 0;
  },
  
  minLength: (value: string, min: number) => {
    return value.trim().length >= min;
  },
  
  maxLength: (value: string, max: number) => {
    return value.trim().length <= max;
  }
};

// Loading state helpers
export const getLoadingMessage = (context: string) => {
  const messages = {
    rooms: "Loading rooms...",
    properties: "Loading properties...", 
    users: "Loading users...",
    tasks: "Loading tasks...",
    inventory: "Loading inventory...",
    default: "Loading..."
  };
  return messages[context as keyof typeof messages] || messages.default;
};
