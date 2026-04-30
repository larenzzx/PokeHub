import { ChevronLeft, ChevronRight } from "lucide-react";

export function Pagination({ page, totalPages, onPageChange, disabled }) {
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1)
    .filter((item) => item === 1 || item === totalPages || Math.abs(item - page) <= 1);

  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
      <p className="text-sm font-semibold text-base-content/70">
        Page {page} of {totalPages}
      </p>
      <div className="join">
        <button
          className="btn join-item btn-sm sm:btn-md"
          disabled={disabled || page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft className="size-4" />
        </button>
        {pages.map((item, index) => {
          const showGap = index > 0 && item - pages[index - 1] > 1;
          return (
            <span key={item} className="join">
              {showGap && <button className="btn join-item btn-sm sm:btn-md btn-disabled">...</button>}
              <button
                className={`btn join-item btn-sm sm:btn-md ${item === page ? "btn-primary" : ""}`}
                disabled={disabled}
                onClick={() => onPageChange(item)}
              >
                {item}
              </button>
            </span>
          );
        })}
        <button
          className="btn join-item btn-sm sm:btn-md"
          disabled={disabled || page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  );
}

