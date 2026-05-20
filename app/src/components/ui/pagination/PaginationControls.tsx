const pageSizeOptions = [5, 10, 20, 50];

type PaginationControlsProps = {
  count: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
};

export function PaginationControls({
  count,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: PaginationControlsProps) {
  const totalPages = Math.max(1, Math.ceil(count / pageSize));
  const start = count === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, count);

  return (
    <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs font-semibold text-slate-500">
        Exibindo {start}-{end} de {count}
      </p>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="flex items-center gap-2 text-xs font-bold text-slate-500">
          Itens
          <select
            className="min-h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-frenchRose focus:ring-4 focus:ring-frenchRose/15"
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
            value={pageSize}
          >
            {pageSizeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-center gap-2">
          <button
            className="min-h-9 rounded-lg bg-slate-100 px-3 text-xs font-extrabold text-slate-600 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            type="button"
          >
            Anterior
          </button>
          <span className="min-w-20 text-center text-xs font-extrabold text-ink">
            {page} / {totalPages}
          </span>
          <button
            className="min-h-9 rounded-lg bg-slate-100 px-3 text-xs font-extrabold text-slate-600 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            type="button"
          >
            Próxima
          </button>
        </div>
      </div>
    </div>
  );
}
