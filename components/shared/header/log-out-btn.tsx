"use client";

import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

interface LogOutBtnProps {
  onClick: () => void;
}

export function LogOutBtn({ onClick }: LogOutBtnProps) {
  return (
    <DropdownMenuItem variant="destructive" onSelect={() => onClick()}>Log out</DropdownMenuItem>
  );
}
