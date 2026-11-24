import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { Button, Flex, Heading, Text } from "theme-ui";
import { api } from "./api";
import desk from "./assets/desk.png";
import { authClient } from "./auth";

const PROVIDER_NAMES: Record<string, string> = { google: "Google", github: "GitHub" };

export function SignIn() {
  const [params] = useSearchParams();
  const config = useQuery({
    queryKey: ["config"],
    queryFn: () => api<{ providers: string[] }>("/config"),
    staleTime: Infinity,
  });
  const providers = config.data?.providers ?? [];
  const error = params.has("error")
    ? (params.get("error_description") ?? "Sign-in didn't finish. Please try again.")
    : null;

  return (
    <Flex sx={{ minHeight: "100vh", alignItems: "center", justifyContent: "center", p: 4 }}>
      <Flex sx={{ width: "100%", maxWidth: 380, flexDirection: "column", gap: 4, textAlign: "center" }}>
        <Flex sx={{ flexDirection: "column", alignItems: "center", gap: 2 }}>
          <img src={desk} alt="" sx={{ width: "min(200px, 100%)", height: "auto" }} />
          <Heading as="h1" sx={{ fontSize: 5, letterSpacing: "-0.01em" }}>CornerDesk</Heading>
          <Text variant="tagline">Your space to plan what's next.</Text>
        </Flex>
        {error && <Text role="alert" sx={{ color: "wood", fontWeight: "bold" }}>{error}</Text>}
        <Flex sx={{ flexDirection: "column", gap: 2 }}>
          {providers.map((provider, i) => (
            <Button
              key={provider}
              variant={i === 0 ? "primary" : "secondary"}
              onClick={() => authClient.signIn.social({ provider, callbackURL: "/", errorCallbackURL: "/" })}
            >
              Continue with {PROVIDER_NAMES[provider] ?? provider}
            </Button>
          ))}
          {config.isSuccess && !providers.length && (
            <Text variant="meta">Sign-in isn't set up on this server yet.</Text>
          )}
        </Flex>
      </Flex>
    </Flex>
  );
}
