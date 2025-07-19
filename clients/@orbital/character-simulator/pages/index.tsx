import {
  AppBar,
  Avatar,
  Box,
  Container,
  Paper,
  Tab,
  Tabs,
  Toolbar,
  Typography,
} from "@mui/material";
import Head from "next/head";
import { useState } from "react";
import { useSelector } from "react-redux";
import CharacterSelector from "../components/CharacterSelector";
import ChatInterface from "../components/Chat/organisms/ChatInterface";
import { LifeTimeline } from "../components/LifeTimeline";
import { RootState } from "../store";

// Interface for TabPanel props
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

// TabPanel component to handle tab content
function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`character-tabpanel-${index}`}
      aria-labelledby={`character-tab-${index}`}
      {...other}
      style={{ width: "100%" }}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

// Chat component with profile image and chat interface
function CharacterChat() {
  // Get selected character from Redux store
  const { characters, selectedCharacterId } = useSelector(
    (state: RootState) => state.character
  );

  // Find the selected character
  const selectedCharacter = characters.find(
    (char) => char.id === selectedCharacterId
  );

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 4, minHeight: "400px" }}>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          mb: 3,
        }}
      >
        {selectedCharacter && (
          <Avatar
            src={`/data/${selectedCharacter.filePath}/images/profile.jpg`}
            alt={selectedCharacter.name}
            sx={{
              width: 200,
              height: 200,
              mb: 2,
              boxShadow: 3,
            }}
          />
        )}
        <Typography variant="h5" gutterBottom>
          {selectedCharacter?.name}
        </Typography>
      </Box>

      {selectedCharacter && (
        <Box sx={{ mt: 3 }}>
          <ChatInterface characterName={selectedCharacter.name} />
        </Box>
      )}
    </Paper>
  );
}

export default function Home() {
  // Get saved tab index from localStorage if available
  const getSavedTabIndex = (): number => {
    if (typeof window !== "undefined") {
      const savedTab = localStorage.getItem("activeTabIndex");
      return savedTab ? parseInt(savedTab, 10) : 1; // Default to Chat tab (index 1)
    }
    return 1; // Default to Chat tab (index 1)
  };

  // State for active tab
  const [activeTab, setActiveTab] = useState(getSavedTabIndex());

  // Get selected character from Redux store
  const { selectedCharacterId } = useSelector(
    (state: RootState) => state.character
  );

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);

    // Save to localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("activeTabIndex", newValue.toString());
    }
  };
  return (
    <>
      <Head>
        <title>Character Life Timeline Viewer</title>
        <meta
          name="description"
          content="View character life events in a timeline"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Box
        sx={{
          flexGrow: 1,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <AppBar position="static" color="primary">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Character Life Timeline Viewer
            </Typography>
          </Toolbar>
        </AppBar>

        <Container maxWidth="lg" sx={{ mt: 4, mb: 4, flexGrow: 1 }}>
          <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
            <Typography variant="h4" gutterBottom>
              Character Selection
            </Typography>
            <Typography variant="body1" paragraph>
              Select a character to view their life timeline events.
            </Typography>
            <CharacterSelector />
          </Paper>

          {selectedCharacterId && (
            <Box sx={{ width: "100%" }}>
              <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
                <Tabs
                  value={activeTab}
                  onChange={handleTabChange}
                  aria-label="character tabs"
                  centered
                >
                  <Tab
                    label="Timeline"
                    id="character-tab-0"
                    aria-controls="character-tabpanel-0"
                  />
                  <Tab
                    label="Chat"
                    id="character-tab-1"
                    aria-controls="character-tabpanel-1"
                  />
                </Tabs>
              </Box>

              <TabPanel value={activeTab} index={0}>
                <LifeTimeline />
              </TabPanel>

              <TabPanel value={activeTab} index={1}>
                <CharacterChat />
              </TabPanel>
            </Box>
          )}

          {!selectedCharacterId && <LifeTimeline />}
        </Container>

        <Box
          component="footer"
          sx={{
            p: 2,
            bgcolor: "background.paper",
            borderTop: 1,
            borderColor: "divider",
          }}
        >
          <Typography variant="body2" color="text.secondary" align="center">
            © {new Date().getFullYear()} Orbital Character Simulator
          </Typography>
        </Box>
      </Box>
    </>
  );
}
