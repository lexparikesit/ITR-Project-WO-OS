"use client";

import * as React from "react";
import axios from "axios";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Modal,
  Grid,
  Paper,
  Stack,
  Title,
  Text,
  Group,
  TextInput,
  Textarea,
  Button,
  LoadingOverlay,
  Divider,
  ScrollArea,
  Badge,
  Select,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";

const STATUS_PROG = [
    "Administrasi",
    "IT",
    "Job In Progress",
    "Waiting Document",
    "Waiting PO",
    "Time Schedule",
    "Waiting Part",
    "Cancel WO",
    "Others",
  ] as const;
  type StatusProg = typeof STATUS_PROG[number];
  
// schema + batas panjang
const schema = z.object({
  woId: z.string().max(15),
  problemCause: z.string().max(250).optional().or(z.literal("")),
  actionPlan: z.string().max(250).optional().or(z.literal("")),
  pic: z.string().max(50).optional().or(z.literal("")),
  datelineClosing: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format YYYY-MM-DD")
    .optional().or(z.literal("")),
  // validasi ke salah satu dari STATUS_PROG atau kosong
  progressCategory: z.enum(STATUS_PROG).optional().or(z.literal("")),
});
type FormValues = z.infer<typeof schema>;

const toStatus = (v: unknown): StatusProg | "" =>
  typeof v === "string" && STATUS_PROG.includes(v as StatusProg)
    ? (v as StatusProg)
    : "";

type RecordRow = {
  id: number;
  woId: string;
  problemCause: string | null;
  actionPlan: string | null;
  pic: string | null;
  datelineClosing: string | null;
  createdAt?: string;
  updatedAt: string;
  progressCategory: string | null;
};

type Props = {
  opened: boolean;
  onClose: () => void;
  woId?: string;
};

export default function MonitorModal({ opened, onClose, woId }: Props) {
  const qc = useQueryClient();

  // --- data terbaru (untuk isi form)
  const {
    data: latestRes,
    isLoading: latestLoading,
  } = useQuery<{ success: boolean; data: RecordRow | null }>({
    queryKey: ["wo-monitoring", woId, "latest"],
    queryFn: async () =>
      (await axios.get(`/api/pg/wo-monitoring/${encodeURIComponent(woId!)}`)).data,
    enabled: opened && !!woId,
    staleTime: 30_000,
  });
  const latest = latestRes?.data ?? null;

  // --- semua riwayat (untuk history)
  const {
    data: historyRes,
    isLoading: historyLoading,
    isFetching: historyFetching,
  } = useQuery<{ success: boolean; count: number; data: RecordRow[] }>({
    queryKey: ["wo-monitoring", woId, "history"],
    queryFn: async () =>
      (await axios.get(`/api/pg/wo-monitoring/${encodeURIComponent(woId!)}/history`))
        .data,
    enabled: opened && !!woId,
    staleTime: 30_000,
  });
  const history = historyRes?.data ?? [];

  // --- form (isi dari record terbaru)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    control,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      woId: woId || "",
      problemCause: "",
      actionPlan: "",
      pic: "",
      datelineClosing: "",
      progressCategory: "",
    },
  });

  React.useEffect(() => {
    if (!opened) return;
    reset({
      woId: woId || "",
      problemCause: latest?.problemCause ?? "",
      actionPlan: latest?.actionPlan ?? "",
      pic: latest?.pic ?? "",
      datelineClosing: latest?.datelineClosing ?? "",
      progressCategory: toStatus(latest?.progressCategory), // ⬅️ penting
    });
  }, [opened, latest, woId, reset]);

  // --- submit: selalu INSERT baris baru
  const mutate = useMutation({
    mutationFn: async (values: FormValues) => {
      const payload = {
        woId: values.woId,
        problemCause: values.problemCause || null,
        actionPlan: values.actionPlan || null,
        pic: values.pic || null,
        datelineClosing: values.datelineClosing || null,
        progressCategory: values.progressCategory || null,
      };
      return (await axios.post("/api/pg/wo-monitoring", payload)).data;
    },
    onSuccess: () => {
      notifications.show({
        color: "green",
        title: "Saved",
        message: `WO ${woId} berhasil disimpan`,
      });
      qc.invalidateQueries({ queryKey: ["wo-monitoring", woId, "latest"] });
      qc.invalidateQueries({ queryKey: ["wo-monitoring", woId, "history"] });
    },
    onError: (e: any) => {
      const msg = e?.response?.data?.message ?? "Gagal menyimpan";
      notifications.show({ color: "red", title: "Error", message: msg });
    },
  });

  const onSubmit = (v: FormValues) => mutate.mutate(v);
  

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={<Text fw={700} size="lg">WO Monitoring — {woId || "-"}</Text>}
      centered
      size={1500}
      closeOnClickOutside={false}
      withinPortal
      overlayProps={{ opacity: 0.45, blur: 2 }}
      styles={{ content: { maxWidth: "95vw" }, body: { paddingTop: 0 } }}
      yOffset={24}
    >
      <Grid gutter="lg">
        {/* Kiri: Insert Section */}
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Paper withBorder p="md" radius="md">
            <Title order={5} mb="sm">Insert Section</Title>
            <form onSubmit={handleSubmit(onSubmit)}>
              <Stack gap="sm">
                {/* Hidden agar woId ikut ke payload */}
                <input type="hidden" value={woId ?? ""} {...register("woId")} />

                <Textarea
                  label="Problem Cause"
                  autosize
                  minRows={3}
                  {...register("problemCause")}
                  error={errors.problemCause?.message}
                />
                <Textarea
                  label="Action Plan"
                  autosize
                  minRows={3}
                  {...register("actionPlan")}
                  error={errors.actionPlan?.message}
                />
                <TextInput
                  label="PIC"
                  maxLength={50}
                  {...register("pic")}
                  error={errors.pic?.message}
                />
                <TextInput
                  label="Dateline Closing"
                  type="date"
                  {...register("datelineClosing")}
                  error={errors.datelineClosing?.message}
                />
                <Controller
                  control={control}
                  name="progressCategory"
                  render={({ field }) => (
                    <Select
                      label="Progress Category"
                      placeholder="-"
                      data={STATUS_PROG}
                      searchable
                      clearable
                      value={field.value || null}                 // Mantine Select pakai string | null
                      onChange={(v) => field.onChange(v ?? "")}   // simpan "" saat clear
                      error={errors.progressCategory?.message}
                    />
                  )}
                />
                <Group justify="flex-end" mt="xs">
                  <Button variant="default" onClick={onClose}>Tutup</Button>
                  <Button type="submit" loading={isSubmitting || mutate.isPending}>
                    Save
                  </Button>
                </Group>
              </Stack>
            </form>
          </Paper>
        </Grid.Col>

        {/* Kanan: History Log (scroll sendiri) */}
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Paper withBorder p="md" radius="md" pos="relative" style={{ minHeight: 260 }}>
            <LoadingOverlay visible={latestLoading || historyLoading || historyFetching} />

            {/* Header static (tidak ikut scroll) */}
            <Group justify="space-between" align="center" mb="sm">
              <Title order={5} m={0}>History Log</Title>
              <Badge variant="light">{history.length} records</Badge>
            </Group>
            <Divider mb="sm" />

            {/* HANYA isi history yang scroll */}
            {history.length === 0 ? (
              <Text c="dimmed">Belum ada data untuk WO ini.</Text>
            ) : (
              <ScrollArea.Autosize
                mah={480}              // max-height 480px (ubah sesuai selera)
                type="hover"
                scrollbarSize={8}
                offsetScrollbars
              >
                <Stack gap="md" pr="xs">
                  {history.map((h) => (
                    <Paper key={h.id} withBorder p="sm" radius="md">
                      <Group justify="space-between" mb={4}>
                        <Text fw={600}>
                          {h.createdAt
                            ? new Date(h.createdAt).toLocaleString()
                            : new Date(h.updatedAt).toLocaleString()}
                        </Text>
                        {h.datelineClosing && (
                          <Badge variant="outline" title="Dateline Closing">
                            {h.datelineClosing}
                          </Badge>
                        )}
                      </Group>

                      <Stack gap={4}>
                        <Group justify="space-between" align="flex-start">
                          <Text c="dimmed">Problem Cause</Text>
                          <Text ta="right" style={{ maxWidth: 320, whiteSpace: "pre-wrap" }}>
                            {h.problemCause || "-"}
                          </Text>
                        </Group>
                        <Group justify="space-between" align="flex-start">
                          <Text c="dimmed">Action Plan</Text>
                          <Text ta="right" style={{ maxWidth: 320, whiteSpace: "pre-wrap" }}>
                            {h.actionPlan || "-"}
                          </Text>
                        </Group>
                        <Group justify="space-between">
                          <Text c="dimmed">PIC</Text>
                          <Text ta="right">{h.pic || "-"}</Text>
                        </Group>
                        <Group justify="space-between" mb={4}>
                          <Text c="dimmed">Progress Category</Text>
                            {h.progressCategory && (
                              <Badge>{h.progressCategory}</Badge>     // ⬅️ baru
                            )}
                        </Group>
                      </Stack>
                    </Paper>
                  ))}
                </Stack>
              </ScrollArea.Autosize>
            )}
          </Paper>
        </Grid.Col>

      </Grid>
    </Modal>
  );
}
