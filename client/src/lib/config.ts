import { useQuery } from "@tanstack/react-query";

interface SiteConfig {
  id: string;
  key: string;
  value: string;
  description?: string;
  category: string;
  updatedAt: Date;
}

// Global config cache
let configCache: SiteConfig[] = [];

// Function to get a config value with fallback
export function getConfigValue(key: string, defaultValue: string = ""): string {
  const config = configCache.find(c => c.key === key);
  return config?.value || defaultValue;
}

// Hook to load configs and update cache
export function useConfigLoader() {
  const { data: configs = [] } = useQuery<SiteConfig[]>({
    queryKey: ["/api/site-configs"],
  });

  // Update cache when configs change
  if (configs.length > 0) {
    configCache = configs;
  }

  return configs;
}

// Function to initialize config cache (for components that don't use hooks)
export function initializeConfigCache(configs: SiteConfig[]) {
  configCache = configs;
}