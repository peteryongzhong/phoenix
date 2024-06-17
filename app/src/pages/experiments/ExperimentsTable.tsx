import React, { useCallback, useMemo, useRef, useState } from "react";
import { graphql, usePaginationFragment } from "react-relay";
import { useNavigate } from "react-router";
// import { useNavigate } from "react-router";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { css } from "@emotion/react";

import { Flex } from "@arizeai/components";

import { SequenceNumberLabel } from "@phoenix/components/experiment/SequenceNumberLabel";
import { Link } from "@phoenix/components/Link";
import { IndeterminateCheckboxCell } from "@phoenix/components/table/IndeterminateCheckboxCell";
import { selectableTableCSS } from "@phoenix/components/table/styles";
import { TextCell } from "@phoenix/components/table/TextCell";

import { experimentsLoaderQuery$data } from "./__generated__/experimentsLoaderQuery.graphql";
import type { ExperimentsTableFragment$key } from "./__generated__/ExperimentsTableFragment.graphql";
import { ExperimentsTableQuery } from "./__generated__/ExperimentsTableQuery.graphql";
import { ExperimentSelectionToolbar } from "./ExperimentSelectionToolbar";

const PAGE_SIZE = 100;

export function ExperimentsTableEmpty() {
  return (
    <tbody className="is-empty">
      <tr>
        <td
          colSpan={100}
          css={(theme) => css`
            text-align: center;
            padding: ${theme.spacing.margin24}px ${theme.spacing.margin24}px !important;
          `}
        >
          No experiments for this dataset. To see how to run experiments on a
          dataset, check out the documentation.
        </td>
      </tr>
    </tbody>
  );
}

export function ExperimentsTable({
  dataset,
}: {
  dataset: experimentsLoaderQuery$data["dataset"];
}) {
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [rowSelection, setRowSelection] = useState({});
  const { data, loadNext, hasNext, isLoadingNext } = usePaginationFragment<
    ExperimentsTableQuery,
    ExperimentsTableFragment$key
  >(
    graphql`
      fragment ExperimentsTableFragment on Dataset
      @refetchable(queryName: "ExperimentsTableQuery")
      @argumentDefinitions(
        after: { type: "String", defaultValue: null }
        first: { type: "Int", defaultValue: 100 }
      ) {
        experiments(first: $first, after: $after)
          @connection(key: "ExperimentsTable_experiments") {
          edges {
            experiment: node {
              id
              name
              sequenceNumber
              description
              createdAt
              metadata
            }
          }
        }
      }
    `,
    dataset
  );

  const tableData = useMemo(
    () =>
      data.experiments.edges.map((edge) => {
        return edge.experiment;
      }),
    [data]
  );
  type TableRow = (typeof tableData)[number];
  const columns: ColumnDef<TableRow>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <IndeterminateCheckboxCell
          {...{
            checked: table.getIsAllRowsSelected(),
            indeterminate: table.getIsSomeRowsSelected(),
            onChange: table.getToggleAllRowsSelectedHandler(),
          }}
        />
      ),
      cell: ({ row }) => (
        <IndeterminateCheckboxCell
          {...{
            checked: row.getIsSelected(),
            disabled: !row.getCanSelect(),
            indeterminate: row.getIsSomeSelected(),
            onChange: row.getToggleSelectedHandler(),
          }}
        />
      ),
    },

    {
      header: "name",
      accessorKey: "name",
      cell: ({ getValue, row }) => {
        const experimentId = row.original.id;
        const sequenceNumber = row.original.sequenceNumber;
        return (
          <Flex direction="row" gap="size-100">
            <SequenceNumberLabel sequenceNumber={sequenceNumber} />
            <Link
              to={`/datasets/${dataset.id}/compare?experimentId=${experimentId}`}
            >
              {getValue() as string}
            </Link>
          </Flex>
        );
      },
    },
    {
      header: "description",
      accessorKey: "description",
      cell: TextCell,
    },
    {
      header: "created at",
      accessorKey: "createdAt",
    },
    {
      header: "metadata",
      accessorKey: "metadata",
      cell: TextCell,
    },
  ];
  const table = useReactTable<TableRow>({
    columns,
    data: tableData,
    getCoreRowModel: getCoreRowModel(),
    state: {
      rowSelection,
    },
    onRowSelectionChange: setRowSelection,
  });
  const rows = table.getRowModel().rows;
  const selectedRows = table.getSelectedRowModel().rows;
  const selectedExperiments = selectedRows.map((row) => row.original);
  const clearSelection = useCallback(() => {
    setRowSelection({});
  }, [setRowSelection]);

  const isEmpty = rows.length === 0;

  const fetchMoreOnBottomReached = useCallback(
    (containerRefElement?: HTMLDivElement | null) => {
      if (containerRefElement) {
        const { scrollHeight, scrollTop, clientHeight } = containerRefElement;
        // once the user has scrolled within 300px of the bottom of the table, fetch more data if there is any
        if (
          scrollHeight - scrollTop - clientHeight < 300 &&
          !isLoadingNext &&
          hasNext
        ) {
          loadNext(PAGE_SIZE);
        }
      }
    },
    [hasNext, isLoadingNext, loadNext]
  );
  const navigate = useNavigate();
  return (
    <div
      css={css`
        flex: 1 1 auto;
        overflow: auto;
      `}
      ref={tableContainerRef}
      onScroll={(e) => fetchMoreOnBottomReached(e.target as HTMLDivElement)}
    >
      <table css={selectableTableCSS}>
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id}>
                  <div>
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </div>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        {isEmpty ? (
          <ExperimentsTableEmpty />
        ) : (
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                onClick={() => {
                  navigate(
                    `/datasets/${dataset.id}/compare?experimentId=${row.original.id}`
                  );
                }}
              >
                {row.getVisibleCells().map((cell) => {
                  return (
                    <td key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        )}
      </table>
      {selectedRows.length ? (
        <ExperimentSelectionToolbar
          datasetId={dataset.id}
          selectedExperiments={selectedExperiments}
          onClearSelection={clearSelection}
        />
      ) : null}
    </div>
  );
}