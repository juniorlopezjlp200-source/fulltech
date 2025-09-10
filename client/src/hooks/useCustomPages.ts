import { useQuery } from "@tanstack/react-query";
import type { CustomPage } from "@shared/schema";

export function useCustomPages() {
  const { data: pages = [], isLoading, error } = useQuery<CustomPage[]>({
    queryKey: ["/api/custom-pages"],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Filter only pages that should show in menu
  const menuPages = pages.filter(page => page.showInMenu);

  // Group pages by menu section and sort by order
  const groupedPages = menuPages.reduce((acc, page) => {
    const section = page.menuSection || 'main';
    if (!acc[section]) {
      acc[section] = [];
    }
    acc[section].push(page);
    return acc;
  }, {} as Record<string, CustomPage[]>);

  // Sort pages within each section by order
  Object.keys(groupedPages).forEach(section => {
    groupedPages[section].sort((a, b) => (a.order || 0) - (b.order || 0));
  });

  return {
    pages,
    menuPages,
    groupedPages,
    isLoading,
    error
  };
}