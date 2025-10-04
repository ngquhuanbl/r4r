import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { REVIEW_STATUS_FILTER_ALL_OPTION } from "@/constants/dashboard/ui";
import { useAppSelector } from "@/lib/redux/hooks";
import {
  reviewStatusesSelectors,
  Status,
} from "@/lib/redux/slices/review-status";

interface ReviewStatusFilterProps {
  value: string;
  onChange: (value: string) => void;
}

export function ReviewStatusFilter({
  value,
  onChange,
}: ReviewStatusFilterProps) {
  const data = useAppSelector(reviewStatusesSelectors.selectData);
  const status = useAppSelector(reviewStatusesSelectors.selectStatus);

  const hasContent = status === Status.SUCCEEDED && data.length;
  if (!hasContent) return null;

  return (
    <div className="flex justify-between sm:justify-start items-center">
      <Label
        htmlFor="incoming-review-status-select"
        className="sm:mr-4 text-xs sm:text-base sr-only"
      >
        Filter by review status
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger
          id="incoming-review-status-select"
          className="w-[180px]"
          aria-controls="incoming-review-table"
        >
          <SelectValue placeholder="Select status" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Select review status</SelectLabel>
            <SelectItem value={`${REVIEW_STATUS_FILTER_ALL_OPTION.id}`}>
              {REVIEW_STATUS_FILTER_ALL_OPTION.name}
            </SelectItem>
            {data.map(({ id, name }) => (
              <SelectItem key={id} value={`${id}`}>
                {name}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
