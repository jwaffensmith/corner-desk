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

const PAGE_PX = [5, 5, 5, 6];

const linkStyle = {
  color: "secondary", textDecoration: "none", py: [3, 3, 2], borderBottom: "2px solid transparent", whiteSpace: "nowrap",
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
        <Box
          sx={{
            maxWidth: 1080, mx: "auto", px: PAGE_PX, display: "grid", alignItems: "center", columnGap: [3, 5, 2, 4],
            gridTemplateColumns: ["minmax(0, 1fr) auto", "minmax(0, 1fr) auto", "auto minmax(0, 1fr) auto"],
          }}
        >
          <Link to="/" sx={{ display: "flex", alignItems: "center", gap: 2, py: 4, textDecoration: "none", justifySelf: "start" }}>
            <img src="/favicon.svg" alt="" width={40} height={40} sx={{ display: "block" }} />
            <Text sx={{ fontFamily: "heading", fontSize: 4, fontWeight: 700, color: "text", letterSpacing: "-0.01em" }}>
              CornerDesk
            </Text>
          </Link>
          <MainNav />
          <Button variant="ghost" title={session.data.user.email} onClick={signOut} sx={{ whiteSpace: "nowrap" }}>Sign out</Button>
        </Box>
      </Box>
      <Box as="main" sx={{ maxWidth: 1080, mx: "auto", px: PAGE_PX, py: 5 }}>
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

// Below the widest layout the tabs sit on their own row, out to the screen edges. At any width
// they scroll sideways instead of wrapping; the fade at the edges hints at tabs out of view.
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
        columnGap: [3, 4, 3, 6], fontSize: [0, 1], gridColumn: ["1 / -1", "1 / -1", "auto"], gridRow: [2, 2, "auto"],
        minWidth: 0, mx: [-5, -5, 0], px: [5, 5, 4],
        overflowX: "auto", scrollPaddingInline: 16, scrollbarWidth: "none", "&::-webkit-scrollbar": { display: "none" },
        maskImage: EDGE_FADE,
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
