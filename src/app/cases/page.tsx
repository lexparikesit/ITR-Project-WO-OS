"use client";

import { useMemo, useState, useEffect } from "react";
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
  Select,
  Text,
} from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import {
  DataTable,
  type DataTableSortStatus,
  type DataTableColumn,
} from "mantine-datatable";
import { IconSearch } from "@tabler/icons-react";
import MonitorModal from "./MonitorModal"; // ✅ default import


/** Hitung bucket ageing dari angka (bukan mengandalkan string dari API) */
function bucket(
  age: number | null | undefined
): "0-30" | "31-60" | "61-120" | "+120" | "UNKNOWN" {
  if (age == null || Number.isNaN(age)) return "UNKNOWN";
  if (age <= 30) return "0-30";
  if (age <= 60) return "31-60";
  if (age <= 120) return "61-120";
  return "+120";
}

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
  // search global (local)
  const [q, setQ] = useState("");
  const [qDebounced] = useDebouncedValue(q, 300);

  // LOCAL filters
  const [brand, setBrand] = useState("");
  const [ageingTypeF, setAgeingTypeF] = useState<string | null>("ALL");
  const [status, setStatus] = useState<string | null>("ALL");

  // client-side paging & sorting
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [sortStatus, setSortStatus] = useState<DataTableSortStatus<Row>>({
    columnAccessor: "createdAt",
    direction: "desc",
  });

  // ==== FETCH SEMUA DATA SEKALI ====
  const { data, isLoading, isFetching } = useQuery<Resp>({
    queryKey: ["cases-all"],
    queryFn: async () => {
      const res = await axios.get<Resp>("/api/cases", {
        params: {
          page: 1,
          limit: 10000, // naikin jika perlu
          orderBy: "createdAt",
          orderDir: "desc",
        },
      });
      return res.data;
    },
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 5 * 60 * 1000,
    notifyOnChangeProps: ["data", "error"],
  });

  const loading = isLoading || isFetching;
  const rowsAll = data?.data ?? [];

  // ==== LOCAL FILTERING ====
  const filteredRows = useMemo(() => {
    const norm = (v: unknown) => String(v ?? "").toLowerCase();
    const qLower = qDebounced.trim().toLowerCase();
    const brandQ = brand.trim().toLowerCase();
    const statusQ = (status ?? "ALL").toLowerCase();
    const ageQ = ageingTypeF ?? "ALL";

    return rowsAll.filter((r) => {
      const okQ = qLower
        ? `${r.caseId} ${r.description} ${r.deliveryName} ${r.deviceNumber} ${r.site} ${r.siteName} ${r.warehouseName} ${r.statusWo} ${r.brand}`
            .toLowerCase()
            .includes(qLower)
        : true;

      const okBrand = brandQ ? norm(r.brand).includes(brandQ) : true;

      const rowBucket = bucket(r.ageing);
      const okAge = ageQ !== "ALL" ? rowBucket === ageQ : true;

      const okStatus = statusQ !== "all" ? norm(r.statusWo) === statusQ : true;

      return okQ && okBrand && okAge && okStatus;
    });
  }, [rowsAll, qDebounced, brand, ageingTypeF, status]);

  // ==== CLIENT SORT ====
  const sortedRows = useMemo(() => {
    const { columnAccessor, direction } = sortStatus;
    const arr = [...filteredRows];
    arr.sort((a: any, b: any) => {
      const av = a[columnAccessor];
      const bv = b[columnAccessor];

      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;

      const ad =
        typeof av === "string" && /^\d{4}-\d{2}-\d{2}T/.test(av)
          ? Date.parse(av)
          : NaN;
      const bd =
        typeof bv === "string" && /^\d{4}-\d{2}-\d{2}T/.test(bv)
          ? Date.parse(bv)
          : NaN;
      if (!Number.isNaN(ad) && !Number.isNaN(bd)) {
        return direction === "asc" ? ad - bd : bd - ad;
      }

      if (typeof av === "number" && typeof bv === "number") {
        return direction === "asc" ? av - bv : bv - av;
      }

      const diff = String(av).localeCompare(String(bv));
      return direction === "asc" ? diff : -diff;
    });
    return arr;
  }, [filteredRows, sortStatus]);

  // ==== CLIENT PAGINATION ====
  const totalOutstanding = sortedRows.length;
  const start = Math.max(0, (page - 1) * limit);
  const pageRows = sortedRows.slice(start, start + limit);

  useEffect(() => {
    setPage(1);
  }, [qDebounced, brand, ageingTypeF, status, sortStatus]);

  // opsi dropdown
  const statusOptions = useMemo(() => {
    const set = new Set<string>();
    rowsAll.forEach((r) => r.statusWo && set.add(r.statusWo));
    return ["ALL", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [rowsAll]);

  const ageingTypeOptions = useMemo(
    () => ["ALL", "+120", "61-120", "31-60", "0-30"],
    []
  );

  // ==== MODAL STATE ====
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedWoId, setSelectedWoId] = useState<string | undefined>();

  const openModal = (woId?: string) => {
    setSelectedWoId(woId);
    setModalOpen(true);
  };

  const columns: DataTableColumn<Row>[] = [
    { accessor: "caseId", title: "WO ID", width: 140, sortable: true },
    { accessor: "description", title: "Description", width: 260, sortable: true },
    { accessor: "deliveryName", title: "Customer", width: 220, sortable: true },
    { accessor: "deviceNumber", title: "Device", width: 160, sortable: true },
    { accessor: "brand", title: "Brand", width: 120, sortable: true },
    {
      accessor: "ageingType",
      title: "Aging",
      width: 100,
      sortable: true,
      render: (r) => r.ageingType || bucket(r.ageing),
    },
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
    // === ACTIONS (buka modal) ===
    {
      accessor: "actions",
      title: "",
      width: 140,
      sortable: false,
      render: (r) => {
        const cid = r.caseId || r.id;
        return (
          <Button
            size="xs"
            variant="light"
            onClick={() => openModal(cid)}
            disabled={!cid}
          >
            Detail/Update
          </Button>
        );
      },
    },
  ];

  return (
    <Container size="xl" py="md">
      <Stack gap="md">
        {/* Filter bar */}
        <Paper p="md" withBorder>
          <Group align="end" wrap="wrap" gap="md" justify="space-between">
            <Group align="end" gap="md">
              <TextInput
                label="Search"
                placeholder="WO / device / site / warehouse / customer"
                leftSection={<IconSearch size={16} />}
                value={q}
                onChange={(e) => setQ(e.currentTarget.value)}
                style={{ minWidth: 300 }}
              />

              <TextInput
                label="Brand"
                placeholder="e.g. Komatsu"
                value={brand}
                onChange={(e) => setBrand(e.currentTarget.value)}
                style={{ minWidth: 160 }}
              />

              <Select
                label="Aging Type"
                value={ageingTypeF}
                onChange={setAgeingTypeF}
                data={ageingTypeOptions}
                style={{ minWidth: 150 }}
              />

              <Select
                label="Status"
                value={status}
                onChange={setStatus}
                data={statusOptions}
                style={{ minWidth: 160 }}
              />
            </Group>

            <Button
              variant="dark"
              onClick={() => {
                setQ("");
                setBrand("");
                setAgeingTypeF("ALL");
                setStatus("ALL");
                setPage(1);
                setLimit(50);
                setSortStatus({ columnAccessor: "createdAt", direction: "desc" });
              }}
            >
              Reset
            </Button>
          </Group>
        </Paper>

        {/* Header total */}
        <Paper p="md" withBorder>
          <Group justify="space-between" align="center">
            <Title order={3} m={0}>
              WO Outstanding
            </Title>
            <Stack gap={2} align="center">
              <Text size="sm" c="dimmed">
                Total Outstanding
              </Text>
              <Title order={2} m={0}>
                {totalOutstanding.toLocaleString()}
              </Title>
            </Stack>
          </Group>
        </Paper>

        {/* Tabel */}
        <Paper p="md" withBorder>
          {loading && !data ? (
            <div
              style={{
                display: "flex",
                minHeight: 300,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Loader />
            </div>
          ) : totalOutstanding === 0 ? (
            <div style={{ padding: 12 }}>Tidak ada data</div>
          ) : (
            <div className="datatable-hide-empty">
              <DataTable<Row>
                withTableBorder
                highlightOnHover
                fetching={loading}
                records={pageRows}
                idAccessor="id"
                columns={columns}
                sortStatus={sortStatus}
                onSortStatusChange={(s) => setSortStatus(s)}
                totalRecords={totalOutstanding}
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
              />
            </div>
          )}
        </Paper>
      </Stack>

      {/* === MODAL === */}
      <MonitorModal
        opened={modalOpen}
        onClose={() => setModalOpen(false)}
        woId={selectedWoId}
      />
    </Container>
  );
}
