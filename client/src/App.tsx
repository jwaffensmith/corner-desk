import { Link, NavLink, Navigate, Route, Routes } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Box, Button, Flex, Text } from "theme-ui";
import { authClient } from "./auth";
import { SignIn } from "./SignIn";
import { ThisWeek } from "./prep/ThisWeek";
import { Curriculum } from "./prep/Curriculum";

const linkStyle = {
  color: "secondary", textDecoration: "none", py: 2, borderBottom: "2px solid transparent",
  "&:hover": { color: "text" },
  "&.active": { color: "primary", fontWeight: "bold", borderColor: "accent" },
};

export function App() {
  const queryClient = useQueryClient();
  const session = authClient.useSession();
  if (session.isPending) return null;
  if (!session.data) return <SignIn />;

  const signOut = async () => {
    await authClient.signOut();
    queryClient.clear();
  };

  return (
    <Box sx={{ minHeight: "100vh" }}>
      <Box as="header" sx={{ borderBottom: "1px solid", borderColor: "border" }}>
        <Flex sx={{ maxWidth: 880, mx: "auto", px: 4, columnGap: 5, alignItems: "center", flexWrap: "wrap" }}>
          <Link to="/prep" sx={{ display: "flex", alignItems: "center", gap: 2, py: 3, textDecoration: "none" }}>
            <img src="/favicon.svg" alt="" width={40} height={40} sx={{ display: "block" }} />
            <Text sx={{ fontFamily: "heading", fontSize: 4, fontWeight: 700, color: "text", letterSpacing: "-0.01em" }}>
              CornerDesk
            </Text>
          </Link>
          <Flex as="nav" aria-label="Interview prep" sx={{ gap: 4 }}>
            <NavLink to="/prep" end sx={linkStyle}>This week</NavLink>
            <NavLink to="/prep/curriculum" sx={linkStyle}>Curriculum</NavLink>
          </Flex>
          <Flex sx={{ ml: "auto", alignItems: "center", gap: 3 }}>
            <Text variant="tagline" sx={{ display: ["none", "none", "block"] }}>
              Your space to plan what's next.
            </Text>
            <Button variant="ghost" title={session.data.user.email} onClick={signOut}>Sign out</Button>
          </Flex>
        </Flex>
      </Box>
      <Box as="main" sx={{ maxWidth: 880, mx: "auto", px: 4, py: 5 }}>
        <Routes>
          <Route path="/prep" element={<ThisWeek />} />
          <Route path="/prep/curriculum" element={<Curriculum />} />
          <Route path="*" element={<Navigate to="/prep" replace />} />
        </Routes>
      </Box>
    </Box>
  );
}
