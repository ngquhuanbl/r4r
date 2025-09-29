import { Loader2Icon } from "lucide-react";
import { useCallback, useTransition } from "react";
import { toast } from "sonner";

import { deleteBusiness } from "@/app/(protected)/my-businesses/actions";
import { FetchedBusiness } from "@/types/dashboard";
import { Tables } from "@/types/database";
import { ErrorUtils } from "@/utils/error";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";

interface DeleteBusinessDialogProps {
  open: boolean;
  onOpenChange: (opened: boolean) => void;
  data: FetchedBusiness;
  onDeleteData?: (id: Pick<Tables<"businesses">, "id">) => void;
}

export function DeleteBusinessDialog({
  open,
  onOpenChange,
  data,
  onDeleteData,
}: DeleteBusinessDialogProps) {
  const [isDeleting, startDeleting] = useTransition();

  const onDelete = () => {
    startDeleting(async () => {
      try {
        const result = await deleteBusiness(data.id);
        if (result.ok) {
          toast.success(`Delete business successfully`);
          if (onDeleteData) {
            onDeleteData(result.data);
          }
        } else {
          throw result.error;
        }
      } catch (e) {
        toast.error(`Failed to delete business`, {
          description: ErrorUtils.serializeError(e),
        });
      }
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete the business "{data.business_name}" and
            all its related data. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onDelete}
            disabled={isDeleting}
            className="bg-red-500 hover:bg-red-600"
          >
            {isDeleting && <Loader2Icon className="animate-spin" />}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
