import { Link, NavLink, Navigate, Route, Routes } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Box, Button, Flex, Text } from "theme-ui";
import { authClient } from "./auth";
import { SignIn } from "./SignIn";
import { Dashboard } from "./dashboard/Dashboard";
import { ThisWeek } from "./prep/ThisWeek";
import { Curriculum } from "./prep/Curriculum";
import { Networking } from "./networking/Networking";
import { Todos } from "./todos/Todos";

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
          <Link to="/" sx={{ display: "flex", alignItems: "center", gap: 2, py: 3, textDecoration: "none" }}>
            <img src="/favicon.svg" alt="" width={40} height={40} sx={{ display: "block" }} />
            <Text sx={{ fontFamily: "heading", fontSize: 4, fontWeight: 700, color: "text", letterSpacing: "-0.01em" }}>
              CornerDesk
            </Text>
          </Link>
          <Flex
            as="nav"
            aria-label="Main"
            sx={{ columnGap: [3, 4], fontSize: [0, 1], flexWrap: "wrap", order: [1, 1, 0], flexBasis: ["100%", "100%", "auto"] }}
          >
            <NavLink to="/" end sx={linkStyle}>Dashboard</NavLink>
            <NavLink to="/prep" end sx={linkStyle}>This week</NavLink>
            <NavLink to="/prep/curriculum" sx={linkStyle}>Curriculum</NavLink>
            <NavLink to="/networking" sx={linkStyle}>Networking</NavLink>
            <NavLink to="/todos" sx={linkStyle}>To-do</NavLink>
          </Flex>
          <Button variant="ghost" title={session.data.user.email} onClick={signOut} sx={{ ml: "auto" }}>Sign out</Button>
        </Flex>
      </Box>
      <Box as="main" sx={{ maxWidth: 880, mx: "auto", px: 4, py: 5 }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/prep" element={<ThisWeek />} />
          <Route path="/prep/curriculum" element={<Curriculum />} />
          <Route path="/networking" element={<Networking />} />
          <Route path="/todos" element={<Todos />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Box>
    </Box>
  );
}
