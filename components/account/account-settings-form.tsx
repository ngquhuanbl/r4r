"use client";

import { Camera } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import type { User } from "@supabase/supabase-js";

import { deleteAccount, saveProfileIdentity } from "@/app/(protected)/account/actions";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useAppDispatch } from "@/lib/redux/hooks";
import { authActions } from "@/lib/redux/slices/auth";
import {
  getAvatarUrl,
  getDisplayName,
  getProviderBadge,
} from "@/lib/account/profile";
import { cn } from "@/lib/utils";
import { orDash } from "@/utils/display";

type Props = {
  user: User;
};

export function AccountSettingsForm({ user }: Props) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const initialName = useMemo(() => getDisplayName(user), [user]);
  const [displayName, setDisplayName] = useState(initialName);

  useEffect(() => {
    setDisplayName(getDisplayName(user));
  }, [user]);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [removeCustomAvatar, setRemoveCustomAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hadUploadedAvatar = Boolean(
    user.user_metadata &&
      typeof (user.user_metadata as { avatar_url?: string }).avatar_url ===
        "string" &&
      (user.user_metadata as { avatar_url?: string }).avatar_url!.length > 0,
  );

  const resolvedAvatarSrc = useMemo(() => {
    if (avatarPreview) return avatarPreview;
    const u = getAvatarUrl(user);
    return u;
  }, [avatarPreview, user]);

  const identityDirty =
    displayName.trim() !== initialName.trim() ||
    avatarFile !== null ||
    (removeCustomAvatar && hadUploadedAvatar);

  const [savingIdentity, setSavingIdentity] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const provider = getProviderBadge(user);

  const onAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setAvatarFile(f);
    setRemoveCustomAvatar(false);
    setAvatarPreview(URL.createObjectURL(f));
  };

  const discardIdentity = () => {
    setDisplayName(initialName);
    setAvatarFile(null);
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarPreview(null);
    setRemoveCustomAvatar(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const saveIdentity = async () => {
    const name = displayName.trim();
    if (!name) {
      toast.error("Display name is required.");
      return;
    }
    setSavingIdentity(true);
    try {
      const fd = new FormData();
      fd.set("displayName", name);
      if (avatarFile) fd.set("avatar", avatarFile);
      if (removeCustomAvatar) fd.set("removeCustomAvatar", "true");
      const res = await saveProfileIdentity(fd);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      dispatch(authActions.setCredentials(res.user));
      toast.success("Profile saved.");
      setAvatarFile(null);
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
      setAvatarPreview(null);
      setRemoveCustomAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      router.refresh();
    } finally {
      setSavingIdentity(false);
    }
  };

  const onDeleteConfirm = async () => {
    setDeleting(true);
    try {
      const res = await deleteAccount();
      if (res && !res.ok) {
        toast.error("Could not delete account", { description: res.error });
        setDeleting(false);
        setDeleteOpen(false);
      }
    } catch {
      setDeleting(false);
    }
  };

  const themeValue = mounted ? theme ?? "system" : "system";

  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <h2 className="text-sm font-medium text-muted-foreground">
          Account identity
        </h2>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <div className="relative shrink-0">
            <div
              className="relative h-20 w-20 overflow-hidden rounded-full border bg-muted"
              style={{ width: 80, height: 80 }}
            >
              {resolvedAvatarSrc ? (
                <Image
                  src={resolvedAvatarSrc}
                  alt=""
                  width={80}
                  height={80}
                  className="object-cover"
                  unoptimized={resolvedAvatarSrc.startsWith("blob:")}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                  No photo
                </div>
              )}
            </div>
            <button
              type="button"
              className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full border bg-background shadow-sm hover:bg-muted"
              aria-label="Upload profile photo"
              onClick={() => fileInputRef.current?.click()}
            >
              <Camera className="h-4 w-4" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={onAvatarChange}
            />
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <Label htmlFor="displayName">Display name</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              autoComplete="name"
              className="max-w-md"
            />
            <p className="text-xs text-muted-foreground">
              Shown to partners. Required so you do not appear as a generic
              placeholder.
            </p>
          </div>
        </div>

        <div className="space-y-1 pt-2">
          <Label className="text-muted-foreground">Email</Label>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm">{orDash(user.email)}</span>
            <Badge variant="secondary" className="font-normal">
              <span className="mr-1 font-semibold">[{provider.short}]</span>
              {provider.label} connected
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Email is your account key and cannot be changed here.
          </p>
        </div>

        {hadUploadedAvatar ? (
          <button
            type="button"
            className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
            onClick={() => {
              setRemoveCustomAvatar(true);
              setAvatarFile(null);
              if (avatarPreview) URL.revokeObjectURL(avatarPreview);
              setAvatarPreview(null);
              if (fileInputRef.current) fileInputRef.current.value = "";
            }}
          >
            Remove custom photo (use provider picture if available)
          </button>
        ) : null}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">
          Appearance
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-muted-foreground">Theme</span>
          <ToggleGroup
            type="single"
            value={themeValue}
            onValueChange={(v) => {
              if (v) setTheme(v);
            }}
            variant="outline"
            size="sm"
            disabled={!mounted}
            className="justify-start"
          >
            <ToggleGroupItem value="light" aria-label="Light theme">
              Light
            </ToggleGroupItem>
            <ToggleGroupItem value="dark" aria-label="Dark theme">
              Dark
            </ToggleGroupItem>
            <ToggleGroupItem value="system" aria-label="System theme">
              System
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </section>

      <section className="space-y-2 border-t pt-8">
        <h2 className="text-sm font-medium text-destructive">Danger zone</h2>
        <button
          type="button"
          className="text-sm text-destructive underline-offset-4 hover:underline"
          onClick={() => setDeleteOpen(true)}
        >
          Delete account
        </button>
      </section>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete account?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete your businesses and reputation
              history. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-2">
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={deleting}
              onClick={() => void onDeleteConfirm()}
            >
              {deleting ? "Deleting…" : "Delete permanently"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div
        className={cn(
          "fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full border bg-background/95 px-4 py-2 shadow-lg backdrop-blur transition-opacity",
          identityDirty ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        aria-hidden={!identityDirty}
      >
        <Button type="button" variant="ghost" size="sm" onClick={discardIdentity}>
          Discard
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={() => void saveIdentity()}
          disabled={savingIdentity || !displayName.trim()}
        >
          {savingIdentity ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </div>
  );
}
