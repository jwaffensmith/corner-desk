import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeUIProvider } from "theme-ui";
import { App } from "./App";
import { theme } from "./theme";

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 10_000 } } });

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeUIProvider theme={theme}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeUIProvider>
  </StrictMode>,
);
