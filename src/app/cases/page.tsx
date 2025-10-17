"use client";

import { useMemo, useState } from "react";
import axios from "axios";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  Container,
  Stack,
  Title,
  Paper,
  Group,
  TextInput,
  Button,
  Loader,
} from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import {
  DataTable,
  type DataTableSortStatus,
  type DataTableColumn,
} from "mantine-datatable";
import { IconSearch } from "@tabler/icons-react";

type Row = {
  id: string;
  caseId: string;
  description: string;
  deliveryName: string;
  deviceNumber: string;
  serialNumber: string | null;
  brand: string | null;
  createdAt: string | null;
  ageing: number | null;
  ageingType: string;
  warehouseName: string;
  siteName: string;
  statusWo: string;
  site: string;
  warehouse: string;
};

type Resp = { data: Row[]; page: number; limit: number; total: number };

export default function CasesPage() {
  // search
  const [q, setQ] = useState("");
  const [qDebounced] = useDebouncedValue(q, 400);

  // paging
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);

  // sorting
  const [sortStatus, setSortStatus] = useState<DataTableSortStatus<Row>>({
    columnAccessor: "createdAt",
    direction: "desc",
  });

  // filter lain (kalau nanti diperlukan bisa dijadikan state)
  const caseId = "";
  const ageingType = "ALL";
  const site = "ALL";

  const queryKey = useMemo(
    () =>
      [
        "cases",
        { q: qDebounced, page, limit, sort: sortStatus, caseId, ageingType, site },
      ] as const,
    [qDebounced, page, limit, sortStatus, caseId, ageingType, site]
  );

  const { data, isLoading, isFetching } = useQuery<Resp>({
    queryKey,
    queryFn: async () => {
      const res = await axios.get<Resp>("/api/cases", {
        params: {
          q: qDebounced,
          page,
          limit,
          caseId,
          ageingType,
          site,
          orderBy: sortStatus.columnAccessor,
          orderDir: sortStatus.direction,
        },
      });
      return res.data;
    },
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 5 * 60 * 1000,
    // biar gak “kedip” saat refetch
    notifyOnChangeProps: ["data", "error"],
  });

  // ---- state tampilan tabel
  const loading = isLoading || isFetching;
  const rows = data?.data ?? [];
  // ⬇️ kunci: jangan biarkan totalRecords = 0 waktu records ada
  const totalDerived = Math.max(data?.total ?? 0, rows.length);
  const hasRows = rows.length > 0;
  const isInitialLoading = loading && !data;

  const columns: DataTableColumn<Row>[] = [
    { accessor: "caseId", title: "WO ID", width: 140, sortable: true },
    { accessor: "description", title: "Description", width: 260, sortable: true },
    { accessor: "deliveryName", title: "Customer", width: 220, sortable: true },
    { accessor: "deviceNumber", title: "Device", width: 160, sortable: true },
    { accessor: "brand", title: "Brand", width: 120, sortable: true },
    { accessor: "ageingType", title: "Aging", width: 100, sortable: true },
    { accessor: "warehouseName", title: "Warehouse", width: 200, sortable: true },
    { accessor: "siteName", title: "Site", width: 160, sortable: true },
    { accessor: "statusWo", title: "Status", width: 120, sortable: true },
    {
      accessor: "createdAt",
      title: "Created",
      width: 180,
      sortable: true,
      render: (r) => (r.createdAt ? new Date(r.createdAt).toLocaleString() : "-"),
    },
  ];

  return (
    <Container size="xl" py="md">
      <Stack gap="md">
        <Title order={2}>WO Outstanding</Title>

        <Paper p="md" withBorder>
          <Group align="end" wrap="wrap" gap="md">
            <TextInput
              label="Search"
              placeholder="WO / device / site / warehouse / customer"
              leftSection={<IconSearch size={16} />}
              value={q}
              onChange={(e) => {
                setQ(e.currentTarget.value);
                setPage(1);
              }}
              style={{ minWidth: 500 }}
            />
            <Button
              variant="dark"
              onClick={() => {
                setQ("");
                setPage(1);
                setLimit(50);
                setSortStatus({ columnAccessor: "createdAt", direction: "desc" });
              }}
            >
              Reset
            </Button>
          </Group>
        </Paper>

        <Paper p="md" withBorder>
          {isInitialLoading ? (
            // ⬅️ TIDAK render DataTable saat load awal
            <div style={{ display: "flex", minHeight: 300, alignItems: "center", justifyContent: "center" }}>
              <Loader />
            </div>
          ) : !hasRows ? (
            <div style={{ padding: 12 }}>Tidak ada data</div>
          ) : (
            // ⬇️ class ini untuk menyembunyikan empty-state bawaan
            <div className="datatable-hide-empty">
              <DataTable<Row>
                withTableBorder
                highlightOnHover
                fetching={loading}             // loader overlay saat refetch
                records={rows}
                idAccessor="id"
                columns={columns}
                sortStatus={sortStatus}
                onSortStatusChange={(s) => {
                  setSortStatus(s);
                  setPage(1);
                }}
                totalRecords={totalDerived}     // ⬅️ gunakan totalDerived
                recordsPerPage={limit}
                page={page}
                onPageChange={setPage}
                recordsPerPageOptions={[25, 50, 100, 200]}
                onRecordsPerPageChange={(n) => {
                  setLimit(n);
                  setPage(1);
                }}
                paginationText={({ from, to, totalRecords }) =>
                  `${from}–${to} dari ${totalRecords}`
                }
                minHeight={420}
                // ⛔️ jangan kirim noRecordsText/noRecordsIcon
              />
            </div>
          )}
        </Paper>
      </Stack>
    </Container>
  );
}
