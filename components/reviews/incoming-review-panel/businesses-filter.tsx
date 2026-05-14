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
import { BUSINESS_FILTER_ALL_OPTION } from "@/constants/dashboard/ui";
import { useAppSelector } from "@/lib/redux/hooks";
import { myBusinessesSelectors, Status } from "@/lib/redux/slices/my-business";

interface BusinessesFilterProps {
  value: string;
  onChange: (value: string) => void;
}

export function BusinessesFilter({ value, onChange }: BusinessesFilterProps) {
  const data = useAppSelector(myBusinessesSelectors.selectData);
  const status = useAppSelector(myBusinessesSelectors.selectStatus);

  const hasContent = status === Status.SUCCEEDED && data.length;
  if (!hasContent) return null;

  return (
    <div className="flex justify-between sm:justify-start items-center">
      <Label
        htmlFor="incoming-business-select"
        className="sm:mr-4 text-xs sm:text-base sr-only"
      >
        Filter by business
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger
          id="incoming-business-select"
          className="w-[180px]"
          aria-controls="incoming-review-table"
        >
          <SelectValue placeholder="Select status" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Select business</SelectLabel>
            <SelectItem value={`${BUSINESS_FILTER_ALL_OPTION.id}`}>
              {BUSINESS_FILTER_ALL_OPTION.name}
            </SelectItem>
            {data.map(({ id, business_name }) => (
              <SelectItem key={id} value={`${id}`}>
                {business_name}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
