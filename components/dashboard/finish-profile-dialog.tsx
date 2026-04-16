"use client";

import { Loader2Icon, Plus } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import type { User } from "@supabase/supabase-js";

import { saveProfileIdentity } from "@/app/(protected)/account/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { needsFinishProfile } from "@/lib/account/profile";
import { useAppDispatch } from "@/lib/redux/hooks";
import { authActions } from "@/lib/redux/slices/auth";
import { cn } from "@/lib/utils";

type Props = {
  user: User;
};

export function FinishProfileDialog({ user }: Props) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(() => needsFinishProfile(user));
  const [displayName, setDisplayName] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const canSubmit = displayName.trim().length >= 2;

  const onFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setAvatarFile(f);
    setPreview(URL.createObjectURL(f));
  }, []);

  const onSubmit = async () => {
    if (!canSubmit) return;
    setPending(true);
    const fd = new FormData();
    fd.set("displayName", displayName.trim());
    if (avatarFile) fd.set("avatar", avatarFile);
    try {
      const res = await saveProfileIdentity(fd);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      dispatch(authActions.setCredentials(res.user));
      setOpen(false);
      router.refresh();
    } finally {
      setPending(false);
    }
  };

  const email = user.email ?? "";

  return (
    <Dialog open={open} onOpenChange={() => {}} modal>
      <DialogContent
        className={cn(
          "max-w-md [&>button]:hidden",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
        )}
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-center text-xl">
            Finish your profile
          </DialogTitle>
          <DialogDescription className="text-center">
            Just a few more details to get your businesses ready for connection.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-6 py-2">
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-muted-foreground/40 bg-muted/50 transition-colors hover:border-primary/50"
              onClick={() => fileRef.current?.click()}
              aria-label="Upload a profile photo"
            >
              {preview ? (
                <Image
                  src={preview}
                  alt=""
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <Plus className="h-10 w-10 text-muted-foreground" aria-hidden />
              )}
            </button>
            <span className="text-xs text-muted-foreground">
              Upload a profile photo (optional)
            </span>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={onFile}
            />
          </div>

          <div className="w-full space-y-2">
            <Label htmlFor="finish-display-name">Display name</Label>
            <Input
              id="finish-display-name"
              placeholder="Enter your full name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              autoComplete="name"
              disabled={pending}
            />
            <p className="text-xs text-muted-foreground">
              This is the name partners will see when they connect with a
              business.
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Connected as: {email}
        </p>

        <DialogFooter className="sm:justify-center">
          <Button
            type="button"
            className="w-full sm:w-auto min-w-[200px]"
            disabled={!canSubmit || pending}
            onClick={() => void onSubmit()}
          >
            {pending ? (
              <Loader2Icon className="h-4 w-4 animate-spin" />
            ) : (
              "Enter Dashboard"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
