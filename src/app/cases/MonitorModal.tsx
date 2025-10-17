"use client";

import * as React from "react";
import axios from "axios";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Modal, Grid, Paper, Stack, Title, Text, Group,
  TextInput, Textarea, Button, LoadingOverlay,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";

const schema = z.object({
  problemCause: z.string().max(250).optional().or(z.literal("")),
  actionPlan: z.string().max(250).optional().or(z.literal("")),
  pic: z.string().max(100).optional().or(z.literal("")),
  datelineClosing: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format YYYY-MM-DD")
    .optional()
    .or(z.literal("")),
});
type FormValues = z.infer<typeof schema>;

type RecordRow = {
  id: number;
  woId: string;
  problemCause: string | null;
  actionPlan: string | null;
  pic: string | null;
  datelineClosing: string | null;
  updatedAt: string;
};

type Props = {
  opened: boolean;
  onClose: () => void;
  woId?: string;
};

export default function MonitorModal({ opened, onClose, woId }: Props) {
  const qc = useQueryClient();

  // fetch detail hanya saat modal dibuka & ada woId
  const { data, isLoading } = useQuery<{ data: RecordRow | null }>({
    queryKey: ["wo-monitoring", woId],
    queryFn: async () =>
      (await axios.get(`/api/pg/wo-monitoring/${encodeURIComponent(woId!)}`)).data,
    enabled: opened && !!woId,
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      problemCause: "",
      actionPlan: "",
      pic: "",
      datelineClosing: "",
    },
  });

  React.useEffect(() => {
    if (!opened) return;
    reset({
      problemCause: data?.data?.problemCause ?? "",
      actionPlan: data?.data?.actionPlan ?? "",
      pic: data?.data?.pic ?? "",
      datelineClosing: data?.data?.datelineClosing ?? "",
    });
  }, [opened, data, reset]);

  const mutate = useMutation({
    mutationFn: async (values: FormValues) => {
      const payload = {
        woId: woId!,
        problemCause: values.problemCause || null,
        actionPlan: values.actionPlan || null,
        pic: values.pic || null,
        datelineClosing: values.datelineClosing || null,
      };
      return (await axios.post("/api/pg/wo-monitoring", payload)).data;
    },
    onSuccess: () => {
      notifications.show({
        color: "green",
        title: "Saved",
        message: `WO ${woId} berhasil disimpan`,
      });
      qc.invalidateQueries({ queryKey: ["wo-monitoring", woId] });
    },
    onError: (e: any) => {
      const msg = e?.response?.data?.message ?? "Gagal menyimpan";
      notifications.show({ color: "red", title: "Error", message: msg });
    },
  });

  const onSubmit = (v: FormValues) => mutate.mutate(v);
  const r = data?.data;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={<Title order={4} m={0}>WO Monitoring — {woId ?? "-"}</Title>}
      centered
      size="lg"
      closeOnClickOutside={false}
      withinPortal
      overlayProps={{ opacity: 0.45, blur: 2 }}
    >
      <Paper withBorder p="md" pos="relative">
        <LoadingOverlay visible={isLoading} />
        <Grid gutter="lg">
          {/* Kiri: form */}
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Title order={5} mb="sm">Insert Section</Title>
            <form onSubmit={handleSubmit(onSubmit)}>
              <Stack gap="sm">
                <TextInput label="WO ID" value={woId ?? ""} readOnly />

                <Textarea
                  label="Problem Cause"
                  autosize minRows={3}
                  {...register("problemCause")}
                  error={errors.problemCause?.message}
                />

                <Textarea
                  label="Action Plan"
                  autosize minRows={3}
                  {...register("actionPlan")}
                  error={errors.actionPlan?.message}
                />

                <TextInput
                  label="PIC"
                  {...register("pic")}
                  error={errors.pic?.message}
                />

                <TextInput
                  label="Dateline Closing"
                  type="date"
                  {...register("datelineClosing")}
                  error={errors.datelineClosing?.message}
                />

                <Group justify="flex-end" mt="xs">
                  <Button variant="default" onClick={onClose}>Tutup</Button>
                  <Button type="submit" loading={isSubmitting || mutate.isPending}>
                    Save
                  </Button>
                </Group>
              </Stack>
            </form>
          </Grid.Col>

          {/* Kanan: history log */}
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Title order={5} mb="sm">History Log</Title>
            <Paper withBorder p="md">
              {r ? (
                <Stack gap="xs">
                  <Group justify="space-between"><Text c="dimmed">Problem Cause</Text><Text>{r.problemCause || "-"}</Text></Group>
                  <Group justify="space-between"><Text c="dimmed">Action Plan</Text><Text>{r.actionPlan || "-"}</Text></Group>
                  <Group justify="space-between"><Text c="dimmed">PIC</Text><Text>{r.pic || "-"}</Text></Group>
                  <Group justify="space-between"><Text c="dimmed">Dateline Closing</Text><Text>{r.datelineClosing || "-"}</Text></Group>
                  <Group justify="space-between"><Text c="dimmed">Updated At</Text><Text>{new Date(r.updatedAt).toLocaleString()}</Text></Group>
                </Stack>
              ) : (
                <Text c="dimmed">Belum ada data untuk WO ini.</Text>
              )}
            </Paper>
          </Grid.Col>
        </Grid>
      </Paper>
    </Modal>
  );
}
