import type { ReactNode } from 'react';

export interface ControlNavigationItem {
  id: string;
  label: string;
  icon: ReactNode;
  disabled?: boolean;
}
