import {
  createTable,
  type RowData,
  type TableOptions,
  type TableOptionsResolved,
} from "@tanstack/table-core";

export function createSvelteTable<TData extends RowData>(
  options: TableOptions<TData>
) {
  const resolvedOptions: TableOptionsResolved<TData> = mergeOptions(options);

  const table = createTable(resolvedOptions);
  let state = $state(table.initialState);

  function mergeOptions(opts: TableOptions<TData>): TableOptionsResolved<TData> {
    return {
      ...opts,
      state: {
        ...state,
        ...opts.state,
      },
      onStateChange: (updater: any) => {
        if (typeof updater === "function") {
          state = updater(state);
        } else {
          state = updater;
        }
        options.onStateChange?.(updater);
      },
      renderFallbackValue: opts.renderFallbackValue ?? null,
    } as TableOptionsResolved<TData>;
  }

  function setOptions() {
    table.setOptions((prev) => mergeOptions({ ...prev, ...options }));
  }

  $effect.pre(() => {
    setOptions();
  });

  return table;
}
