import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';

export const Pagination = ({
  page = 1,
  totalPages = 1,
  onPageChange,
  totalItems,
  limit = 10,
}) => {
  if (totalPages <= 1) return null;

  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, totalItems || page * limit);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-3">
      {totalItems !== undefined && (
        <p className="text-xs text-slate-400">
          Showing <span className="font-medium text-slate-200">{startItem}</span> to{' '}
          <span className="font-medium text-slate-200">{endItem}</span> of{' '}
          <span className="font-medium text-slate-200">{totalItems}</span> results
        </p>
      )}
      <div className="flex items-center gap-2 ml-auto">
        <Button
          variant="secondary"
          size="sm"
          icon={ChevronLeft}
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </Button>
        <span className="text-xs text-slate-300 font-medium px-2">
          Page {page} of {totalPages}
        </span>
        <Button
          variant="secondary"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          <span className="flex items-center gap-1.5">
            Next
            <ChevronRight className="w-4 h-4" />
          </span>
        </Button>
      </div>
    </div>
  );
};
