import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { Toaster } from "sonner";
import { App } from "./app";
import { trpc } from "./lib/trpc";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15_000,
      retry: 1,
    },
  },
});

const apiUrl = import.meta.env.DEV
  ? (import.meta.env.VITE_API_URL ?? "http://localhost:3001")
  : "";

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: `${apiUrl}/trpc`,
      fetch(url, options) {
        return fetch(url, {
          ...(options as RequestInit),
          credentials: "include",
        });
      },
    }),
  ],
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <App />
        <Toaster richColors position="top-center" />
      </QueryClientProvider>
    </trpc.Provider>
  </React.StrictMode>,
);
