import { useEffect } from "react";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BUSINESS_FILTER_ALL_OPTION } from "@/constants/dashboard/ui";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import {
  myBusinessesActions,
  myBusinessesSelectors,
  Status,
} from "@/lib/redux/slices/my-business";
import { UserId } from "@/types/shared";

interface BusinessesFilterProps {
  userId: UserId;
  value: string;
  onChange: (value: string) => void;
}

export function BusinessesFilter({
  userId,
  value,
  onChange,
}: BusinessesFilterProps) {
  const dispatch = useAppDispatch();
  const data = useAppSelector(myBusinessesSelectors.selectData);
  const status = useAppSelector(myBusinessesSelectors.selectStatus);

  useEffect(() => {
    dispatch(myBusinessesActions.fetchMyBusinessesThunk(userId));
  }, [userId, dispatch]);

  const hasContent = status === Status.SUCCEEDED && data.length;
  if (!hasContent) return null;

  return (
    <div className="flex justify-between sm:justify-start items-center">
      <Label className="sm:mr-4 text-xs sm:text-base">By business:</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={`${BUSINESS_FILTER_ALL_OPTION.id}`}>
            {BUSINESS_FILTER_ALL_OPTION.name}
          </SelectItem>
          {data.map(({ id, business_name }) => (
            <SelectItem key={id} value={`${id}`}>
              {business_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
