"use client";

import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // 🚫 hentikan auto refetch
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
            // data dianggap fresh selama 5 menit (tidak refetch otomatis)
            staleTime: 5 * 60 * 1000,
            // waktu simpan cache
            gcTime: 30 * 60 * 1000,
            // opsional: kurangi retry
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={client}>
      <MantineProvider defaultColorScheme="light">
        <Notifications />
        {children}
      </MantineProvider>
    </QueryClientProvider>
  );
}
