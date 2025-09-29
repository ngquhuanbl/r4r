"use client";
import { Plus } from "lucide-react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import { MyBusinessesSearchParams } from "@/constants/my-businesses";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { authSelectors } from "@/lib/redux/slices/auth";
import {
  myBusinessesActions,
  myBusinessesSelectors,
} from "@/lib/redux/slices/my-business";
import { reviewRequestsActions } from "@/lib/redux/slices/review-request";
import plusSrc from "@/public/my-businesses/plus.png";
import { FetchedBusiness } from "@/types/dashboard";
import { Tables } from "@/types/database";
import { getAddress } from "@/utils/shared";

import { CreateBusinessDialog } from "./CreateBusinessDialog";
import { DeleteBusinessDialog } from "./DeleteBusinessDialog";
import { ManageBusinessDialog } from "./ManageBusinessDialog";

export function BusinessList() {
  const searchParams = useSearchParams();
  const userId = useAppSelector(authSelectors.selectUserId);
  const myBusinesses = useAppSelector(myBusinessesSelectors.selectData);
  const dispatch = useAppDispatch();
  const [selectedManagedBusiness, setSelectedManagedBusiness] =
    useState<FetchedBusiness | null>(null);
  const [selectedDeletedBusiness, setSelectedDeletedBusiness] =
    useState<FetchedBusiness | null>(null);
  const [openedCreateBusinessDialog, setOpenedCreateBusinessDialog] = useState(
    searchParams.get(MyBusinessesSearchParams.SHOW) === "1"
  );

  const onManageBusinessDialogOpenChange = useCallback((opened: boolean) => {
    if (!opened) {
      setSelectedManagedBusiness(null);
    }
  }, []);

  const onUpdatedBusiness = useCallback(
    (updatedData: FetchedBusiness) => {
      dispatch(myBusinessesActions.updateById(updatedData));
      setSelectedManagedBusiness(null);
    },
    [dispatch]
  );

  const onDeleteBusinessDialogOpenChange = useCallback((opened: boolean) => {
    if (!opened) {
      setSelectedDeletedBusiness(null);
    }
  }, []);

  const onDeleteBusiness = useCallback(
    ({ id }: Pick<Tables<"businesses">, "id">) => {
      dispatch(myBusinessesActions.deleteById(id));
      setSelectedDeletedBusiness(null);
      dispatch(reviewRequestsActions.fetchReviewRequestsThunk(userId));
    },
    [dispatch, userId]
  );

  const onCreateBusinessDialogOpenChange = useCallback((opened: boolean) => {
    if (!opened) {
      setOpenedCreateBusinessDialog(false);
    }
  }, []);

  const onCreatedBusiness = useCallback(
    (updatedData: FetchedBusiness) => {
      dispatch(myBusinessesActions.addData(updatedData));
      setOpenedCreateBusinessDialog(false);
    },
    [dispatch]
  );

  let content = null;
  if (!myBusinesses.length) {
    content = (
      <div className="h-[70vh] md:h-[50vh] content-center">
        <div className="flex flex-col md:flex-row md:items-center gap-2 md:w-max">
          <Image
            src={plusSrc}
            alt={"An business man holding a yellow plus symbol"}
            width={320}
            height={320}
            className="w-28 h-28 md:w-40 md:h-40"
          />
          <div>
            <p className="font-semibold">No businesses added yet!</p>
            <p className="text-sm">
              This is where your businesses will appear in a handy list. <br />
              Click 'Add new business' to connect your first location and start
              tracking your reviews and requests!
            </p>
            <Button
              className="mt-3"
              onClick={() => setOpenedCreateBusinessDialog(true)}
            >
              <Plus />
              Add new business
            </Button>
          </div>
        </div>
      </div>
    );
  } else {
    content = (
      <>
        <button
          className="border-dashed border-2 border-primary flex flex-col items-center justify-center hover:border-cyan-600 text-primary hover:text-cyan-600 py-3"
          onClick={() => setOpenedCreateBusinessDialog(true)}
        >
          <div>
            <Plus className="text-sm md:text-base inline mr-1" />
            <p className="text-sm md:text-base font-semibold align-middle inline">
              Add new business
            </p>
          </div>
        </button>
        {myBusinesses.map((item) => {
          return (
            <div
              key={item.id}
              className="border border-black p-5 text-black dark:border-white dark:text-white"
            >
              <p className="text-sm md:text-base font-semibold">
                {item.business_name}
              </p>
              <p className="text-xs md:text-sm font-light">
                {getAddress(item)}
              </p>
              <p className="text-xs md:text-sm font-light">{item.phone}</p>
              <div className="flex gap-3 mt-3">
                <Button
                  className="bg-black hover:bg-slate-900 dark:bg-primary dark:hover:bg-sky-700"
                  onClick={() => setSelectedManagedBusiness(item)}
                >
                  Manage
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSelectedDeletedBusiness(item)}
                >
                  Delete
                </Button>
              </div>
            </div>
          );
        })}
      </>
    );
  }

  return (
    <div className="flex flex-col gap-2 md:grid md:grid-cols-[1fr_1fr] md:gap-5">
      {content}
      {selectedManagedBusiness !== null && (
        <ManageBusinessDialog
          open={true}
          onOpenChange={onManageBusinessDialogOpenChange}
          data={selectedManagedBusiness}
          onUpdatedData={onUpdatedBusiness}
        />
      )}
      {selectedDeletedBusiness !== null && (
        <DeleteBusinessDialog
          open={true}
          onOpenChange={onDeleteBusinessDialogOpenChange}
          data={selectedDeletedBusiness}
          onDeleteData={onDeleteBusiness}
        />
      )}
      {openedCreateBusinessDialog && (
        <CreateBusinessDialog
          open={true}
          onOpenChange={onCreateBusinessDialogOpenChange}
          onCreatedData={onCreatedBusiness}
        />
      )}
    </div>
  );
}
