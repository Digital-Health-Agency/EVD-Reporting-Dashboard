export default function LinelistPager({ page, totalPages, onPage, busy }) {
  if (totalPages <= 1) return null;

  function jumpTo(rawValue) {
    const next = Number.parseInt(String(rawValue), 10);
    if (!Number.isInteger(next)) return;
    if (next < 1 || next > totalPages) return;
    if (next === page) return;
    onPage(next);
  }

  return (
    <nav className="ops-linelist__pager" aria-label="Linelist pages" aria-busy={busy ? "true" : undefined}>
      <button
        className="btn btn--secondary ops-linelist__page"
        type="button"
        disabled={busy || page <= 1}
        onClick={() => onPage(page - 1)}
      >
        ‹ Prev
      </button>

      <span className="ops-linelist__page-indicator" aria-current="page">
        <span>Page</span>
        <input
          className="ops-linelist__page-input"
          key={page}
          type="number"
          inputMode="numeric"
          min={1}
          max={totalPages}
          defaultValue={page}
          aria-label="Go to page"
          disabled={busy}
          onKeyDown={(event) => {
            if (event.key !== "Enter") return;
            event.preventDefault();
            jumpTo(event.target.value);
          }}
          onBlur={(event) => jumpTo(event.target.value)}
        />
        <span>of {totalPages}</span>
      </span>

      <button
        className="btn btn--secondary ops-linelist__page"
        type="button"
        disabled={busy || page >= totalPages}
        onClick={() => onPage(page + 1)}
      >
        Next ›
      </button>
    </nav>
  );
}
