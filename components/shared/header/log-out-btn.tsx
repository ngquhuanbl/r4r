"use client";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

interface LogOutBtnProps {
  onClick: () => void;
}

export function LogOutBtn({ onClick }: LogOutBtnProps) {
  return (
    <DropdownMenuItem onSelect={() => onClick()}>Log out</DropdownMenuItem>
  );
}
