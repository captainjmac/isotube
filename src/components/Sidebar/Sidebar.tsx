import * as React from 'react';
import {cn} from '@/lib/utils';

interface SidebarProps {
  children?: React.ReactNode;
  className?: string;
}

export function Sidebar({children, className}: SidebarProps) {
  return (
    <aside className={cn('h-full glass flex flex-col border-r border-border overflow-y-auto', className)}>
      {children}
    </aside>
  );
}
