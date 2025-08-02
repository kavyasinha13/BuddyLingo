import { create } from "zustand";

export const useThemeStore = create((set) => ({
  theme: localStorage.getItem("buddyLingo-theme") || "coffee",
  setTheme: (theme) => {
    localStorage.setItem("buddyLingo-theme", theme);
    set({ theme });
  },
}));
