import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationEllipsis,
  PaginationLink,
  PaginationNext,
} from "@/components/ui/pagination";

interface InboxPaginationProps {
  page: number;
  totalPage: number;
  numVisiblePage: number;
  onPageChange: (page: number) => void;
}
export function InboxPagination({
  page,
  totalPage,
  numVisiblePage,
  onPageChange,
}: InboxPaginationProps) {
  const delta = Math.floor(numVisiblePage / 2);
  const start = Math.max(1, page - delta);
  const end = Math.min(totalPage, page + delta);
  let visiblePageNoList = [];
  let i = start;
  while (i <= end) {
    visiblePageNoList.push(i);
    i += 1;
  }
  while (i <= totalPage && visiblePageNoList.length < numVisiblePage) {
    visiblePageNoList.push(i);
    i += 1;
  }

  visiblePageNoList = visiblePageNoList.slice(0, numVisiblePage);

  if (visiblePageNoList.length < 2) return null;

  return (
    <div className="pt-3">
      <Pagination>
        <Pagination>
          <PaginationContent>
            {page !== 1 && (
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={() => onPageChange(page - 1)}
                />
              </PaginationItem>
            )}
            {visiblePageNoList[0] !== 1 && (
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
            )}
            {visiblePageNoList.map((pageNo) => (
              <PaginationItem key={pageNo}>
                <PaginationLink
                  href="#"
                  isActive={page === pageNo}
                  onClick={() => onPageChange(pageNo)}
                >
                  {pageNo}
                </PaginationLink>
              </PaginationItem>
            ))}
            {visiblePageNoList[visiblePageNoList.length - 1] !== totalPage && (
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
            )}
            {page !== totalPage && (
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={() => onPageChange(page + 1)}
                />
              </PaginationItem>
            )}
          </PaginationContent>
        </Pagination>
      </Pagination>
    </div>
  );
}
