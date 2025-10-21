"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { MantineProvider } from "@mantine/core";
import { Notifications, notifications } from "@mantine/notifications";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // 🚫 hentikan auto refetch otomatis
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
            // data dianggap fresh 5 menit
            staleTime: 30 * 60 * 1000,
            // cache dibuang setelah 30 menit idle
            gcTime: 60 * 60 * 1000,
            // kurangi retry biar cepat fail kalau token expired
            retry: 1,
          },
        },
      })
  );

  useEffect(() => {
    // selalu kirim cookie (token, wtoken) ke /api/*
    axios.defaults.withCredentials = true;

    // global 401 handler
    const interceptorId = axios.interceptors.response.use(
      (res) => res,
      (err) => {
        const status = err?.response?.status;
        if (status === 401) {
          // bersihin cache data supaya UI gak “nempel” data lama
          client.clear();

          // kasih tahu user
          notifications.show({
            color: "red",
            title: "Session expired",
            message: "Silakan login kembali.",
          });

          // redirect ke login
          if (typeof window !== "undefined") {
            window.location.href = "/";
          }
        }
        return Promise.reject(err);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptorId);
    };
  }, [client]);

  return (
    <QueryClientProvider client={client}>
      <MantineProvider
        defaultColorScheme="dark"
        theme={{
          primaryColor: "blue",
          defaultRadius: "md",
        }}
      >
        <Notifications position="top-right" />
        {children}
      </MantineProvider>
    </QueryClientProvider>
  );
}
