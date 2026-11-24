import { useEffect, useRef } from "react";
import { Link, NavLink, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Box, Button, Flex, Text } from "theme-ui";
import { authClient } from "./auth";
import { SignIn } from "./SignIn";
import { Loading } from "./components/Loading";
import { Dashboard } from "./dashboard/Dashboard";
import { ThisWeek } from "./prep/ThisWeek";
import { Curriculum } from "./prep/Curriculum";
import { Networking } from "./networking/Networking";
import { Todos } from "./todos/Todos";
import { Portfolio } from "./portfolio/Portfolio";

const linkStyle = {
  color: "secondary", textDecoration: "none", py: 2, borderBottom: "2px solid transparent", whiteSpace: "nowrap",
  "&:hover": { color: "text" },
  "&.active": { color: "primary", fontWeight: "bold", borderColor: "accent" },
};

export function App() {
  const queryClient = useQueryClient();
  const session = authClient.useSession();
  if (session.isPending) return <Loading layout="screen" />;
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
          <MainNav />
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
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Box>
    </Box>
  );
}

const EDGE_FADE = "linear-gradient(to right, transparent, #000 16px, #000 calc(100% - 16px), transparent)";

// Below the widest layout the tabs sit on their own row and scroll sideways, out to the
// screen edges, instead of wrapping. The fade at the edges hints at tabs out of view.
function MainNav() {
  const ref = useRef<HTMLElement>(null);
  const { pathname } = useLocation();
  useEffect(() => {
    ref.current?.querySelector(".active")?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [pathname]);

  return (
    <Flex
      as="nav"
      ref={ref}
      aria-label="Main"
      sx={{
        columnGap: [3, 4], fontSize: [0, 1], order: [1, 1, 0],
        flexBasis: ["calc(100% + 32px)", "calc(100% + 32px)", "auto"], mx: [-4, -4, 0], px: [4, 4, 0],
        overflowX: "auto", scrollPaddingInline: 16, scrollbarWidth: "none", "&::-webkit-scrollbar": { display: "none" },
        maskImage: [EDGE_FADE, EDGE_FADE, "none"],
      }}
    >
      <NavLink to="/" end sx={linkStyle}>Dashboard</NavLink>
      <NavLink to="/todos" sx={linkStyle}>To-do</NavLink>
      <NavLink to="/prep" end sx={linkStyle}>This week</NavLink>
      <NavLink to="/prep/curriculum" sx={linkStyle}>Curriculum</NavLink>
      <NavLink to="/networking" sx={linkStyle}>Networking</NavLink>
      <NavLink to="/portfolio" sx={linkStyle}>Portfolio</NavLink>
    </Flex>
  );
}
