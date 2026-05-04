import Link from "next/link";

interface PaginationProps {
  currentPage: number;
  hasNextPage: boolean;
  totalCount: number;
  pageSize: number;
  basePath: string;
}

export function Pagination({
  currentPage,
  hasNextPage,
  totalCount,
  pageSize,
  basePath,
}: PaginationProps) {
  const totalPages = Math.ceil(totalCount / pageSize);

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center space-x-2 py-12">
      {currentPage > 1 && (
        <Link
          href={`${basePath}?page=${currentPage - 1}`}
          className="px-4 py-2 border rounded-md hover:bg-slate-50 transition-colors"
        >
          Previous
        </Link>
      )}
      
      <div className="text-sm font-medium text-slate-600">
        Page {currentPage} of {totalPages}
      </div>

      {hasNextPage && (
        <Link
          href={`${basePath}?page=${currentPage + 1}`}
          className="px-4 py-2 border rounded-md hover:bg-slate-50 transition-colors"
        >
          Next
        </Link>
      )}
    </div>
  );
}
