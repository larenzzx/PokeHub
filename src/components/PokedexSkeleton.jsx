export function PokedexSkeleton({ count = 12 }) {
  return (
    <div className="grid w-full grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="card overflow-hidden border-2 border-base-300 bg-base-100 shadow-md">
          <div className="skeleton h-36 rounded-none" />
          <div className="card-body gap-3 p-4">
            <div className="skeleton h-5 w-2/3" />
            <div className="skeleton h-3 w-1/3" />
            <div className="skeleton h-10 w-full" />
            <div className="flex gap-2">
              <div className="skeleton h-5 w-16" />
              <div className="skeleton h-5 w-16" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

