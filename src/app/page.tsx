"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { useRouter } from "next/navigation";
import {
  Button, Container, Paper, Stack, Title, Text,
  TextInput, PasswordInput, Group, Anchor, Divider
} from "@mantine/core";

const schema = z.object({
  username: z.string().min(1, "Username wajib diisi"),
  password: z.string().min(1, "Password wajib diisi"),
});
type FormValues = z.infer<typeof schema>;

export default function SignInPage() {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors, isSubmitting }, setError } =
    useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    try {
      await axios.post("/api/auth/login", {
        username: values.username,
        password: values.password,
      });
      router.replace("/cases");
    } catch (e: any) {
      const data = e?.response?.data;
      const msg =
        data?.message ??
        e?.message ??
        "Username atau password salah";

      // tambahkan sedikit konteks biar kelihatan
      const extra = data?.upstreamStatus
        ? ` (upstream ${data.upstreamStatus})`
        : "";

      // Kalau mau, log ke console untuk debug
      if (data?.upstreamBody) console.log("Upstream body:", data.upstreamBody);

      setError("root", { message: `${msg}${extra}` });
    }
  };

  return (
    <Container size={460} py="xl">
      <Paper radius="md" withBorder p="xl" shadow="sm">
        <Stack gap="xs">
          <Title order={2} ta="center">Sign In</Title>
          <Text c="dimmed" ta="center">Use your username and password to sign in</Text>
        </Stack>

        <Divider my="md" />

        <form onSubmit={handleSubmit(onSubmit)}>
          <Stack>
            <TextInput
              variant="filled"
              label="Username"
              placeholder="masukkan username"
              type="text"
              autoComplete="username"
              {...register("username")}
              error={errors.username?.message}
            />
            <PasswordInput
              variant="filled"
              label="Password"
              placeholder="••••••••"
              autoComplete="current-password"
              {...register("password")}
              error={errors.password?.message}
            />
            {errors.root?.message && <Text c="red">{errors.root.message}</Text>}
            <Button variant="filled" type="submit" loading={isSubmitting} size="md">Sign in</Button>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}
