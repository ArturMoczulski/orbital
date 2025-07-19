import ClearIcon from "@mui/icons-material/Clear";
import {
  Avatar,
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  loadCharacters,
  loadLifeEventsFromPath,
} from "../services/characterService";
import {
  Character,
  RootState,
  clearSelectedCharacter,
  selectCharacter,
  setCharacters,
  setError,
  setLifeEvents,
  setLoading,
} from "../store";

const CharacterSelector = () => {
  const dispatch = useDispatch();
  const { characters, selectedCharacterId } = useSelector(
    (state: RootState) => state.character
  );
  const [isLoading, setIsLocalLoading] = useState(false);

  // Load characters on component mount
  useEffect(() => {
    const fetchCharacters = async () => {
      setIsLocalLoading(true);
      try {
        const characterData = await loadCharacters();
        dispatch(setCharacters(characterData));
      } catch (error) {
        console.error("Failed to load characters:", error);
        dispatch(setError("Failed to load characters"));
      } finally {
        setIsLocalLoading(false);
      }
    };

    fetchCharacters();
  }, [dispatch]);

  // Load life events for pre-selected character from localStorage
  useEffect(() => {
    const loadPreSelectedCharacter = async () => {
      // Only proceed if characters are loaded and there's a selected character ID
      if (characters.length > 0 && selectedCharacterId) {
        const selectedCharacter = characters.find(
          (char) => char.id === selectedCharacterId
        );

        if (selectedCharacter) {
          dispatch(setLoading(true));
          try {
            const lifeEvents = await loadLifeEventsFromPath(
              selectedCharacter.filePath
            );
            dispatch(setLifeEvents(lifeEvents));
            dispatch(setError(null));
          } catch (error) {
            console.error("Failed to load life events:", error);
            dispatch(setError("Failed to load life events"));
          } finally {
            dispatch(setLoading(false));
          }
        }
      }
    };

    loadPreSelectedCharacter();
  }, [characters, selectedCharacterId, dispatch]);

  // Handle character selection
  const handleCharacterChange = async (event: SelectChangeEvent<string>) => {
    const characterId = event.target.value;
    dispatch(selectCharacter(characterId));

    // Find the selected character
    const selectedCharacter = characters.find(
      (char) => char.id === characterId
    );

    if (selectedCharacter) {
      dispatch(setLoading(true));
      try {
        const lifeEvents = await loadLifeEventsFromPath(
          selectedCharacter.filePath
        );
        dispatch(setLifeEvents(lifeEvents));
        dispatch(setError(null));
      } catch (error) {
        console.error("Failed to load life events:", error);
        dispatch(setError("Failed to load life events"));
      } finally {
        dispatch(setLoading(false));
      }
    }
  };

  // Handle clear selection
  const handleClearSelection = () => {
    dispatch(clearSelectedCharacter());
  };

  return (
    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
      <FormControl fullWidth variant="outlined" sx={{ mb: 3 }}>
        <InputLabel id="character-select-label">Select Character</InputLabel>
        <Select
          labelId="character-select-label"
          id="character-select"
          value={selectedCharacterId || ""}
          onChange={handleCharacterChange}
          label="Select Character"
          disabled={isLoading || characters.length === 0}
        >
          {characters.map((character: Character) => (
            <MenuItem
              key={character.id}
              value={character.id}
              sx={{ display: "flex", alignItems: "center", gap: 2 }}
            >
              <Avatar
                src={`/data/${character.filePath}/images/profile.jpg`}
                alt={character.name}
                sx={{ width: 32, height: 32, mr: 1 }}
              />
              {character.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {selectedCharacterId && (
        <Button
          variant="outlined"
          color="secondary"
          onClick={handleClearSelection}
          startIcon={<ClearIcon />}
          sx={{ mt: 1 }}
        >
          Clear
        </Button>
      )}
    </Box>
  );
};

export default CharacterSelector;
