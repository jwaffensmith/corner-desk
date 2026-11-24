import { NavLink, Navigate, Route, Routes } from "react-router-dom";
import { Box, Flex, Text } from "theme-ui";
import { ThisWeek } from "./prep/ThisWeek";
import { Curriculum } from "./prep/Curriculum";

const linkStyle = {
  color: "secondary", textDecoration: "none", py: 2, borderBottom: "2px solid transparent",
  "&:hover": { color: "text" },
  "&.active": { color: "primary", fontWeight: "bold", borderColor: "accent" },
};

export function App() {
  return (
    <Box sx={{ minHeight: "100vh" }}>
      <Box as="header" sx={{ borderBottom: "1px solid", borderColor: "border" }}>
        <Flex sx={{ maxWidth: 880, mx: "auto", px: 4, gap: 5, alignItems: "baseline", flexWrap: "wrap" }}>
          <Text sx={{ fontFamily: "heading", fontSize: 3, fontWeight: "heading", color: "primary", py: 3 }}>
            CornerDesk
          </Text>
          <Flex as="nav" aria-label="Interview prep" sx={{ gap: 4 }}>
            <NavLink to="/prep" end sx={linkStyle}>This week</NavLink>
            <NavLink to="/prep/curriculum" sx={linkStyle}>Curriculum</NavLink>
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
