import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAppSelector } from "@/lib/redux/hooks";
import {
  reviewStatusesSelectors,
  Status,
} from "@/lib/redux/slices/review-status";
import { Tables } from "@/types/database";

interface ReviewStatusProps {
  id: Tables<"review_statuses">["id"];
  className?: string;
}
export function ReviewStatus({ id, className = "" }: ReviewStatusProps) {
  const data = useAppSelector((state) =>
    reviewStatusesSelectors.selectById(state, id)
  );
  const status = useAppSelector(reviewStatusesSelectors.selectStatus);

  if (status !== Status.SUCCEEDED) return null;

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger
          asChild
          aria-label={data.name}
          aria-description={data.description}
        >
          <p className={className}>{data.name}</p>
        </TooltipTrigger>
        <TooltipContent>
          <p>{data.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
