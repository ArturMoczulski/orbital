import { configureStore, createSlice, PayloadAction } from "@reduxjs/toolkit";
// @ts-ignore
import moment from "moment";

// Define types for our state
export interface Character {
  id: string;
  name: string;
  filePath: string;
}

export interface LifeEvent {
  timestamp: string;
  location: string;
  activity: string;
  emotionalState: string;
  thoughts: string;
  decisions: string;
  needsFulfilled: string[];
  socialMediaContent?: {
    postType: string;
    promptImage: string;
    caption: string;
  };
}

export interface Message {
  id: string;
  content: string;
  sender: "user" | "character";
  timestamp: string;
}

export interface ConversationThread {
  id: string;
  name: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

interface CharacterState {
  characters: Character[];
  selectedCharacterId: string | null;
  lifeEvents: LifeEvent[];
  currentViewDate: string | null;
  availableDates: string[];
  conversationThreads: ConversationThread[];
  selectedThreadId: string | null;
  isLoading: boolean;
  error: string | null;
}

// Check if we're in the browser environment
const isBrowser = typeof window !== "undefined";

// Initial state
const initialState: CharacterState = {
  characters: [],
  selectedCharacterId: null, // Don't access localStorage during initialization
  lifeEvents: [],
  currentViewDate: null,
  availableDates: [],
  conversationThreads: [],
  selectedThreadId: null,
  isLoading: false,
  error: null,
};

// Create slice
export const characterSlice = createSlice({
  name: "character",
  initialState,
  reducers: {
    clearSelectedCharacter: (state) => {
      state.selectedCharacterId = null;

      // Remove from localStorage if in browser environment
      if (isBrowser) {
        localStorage.removeItem("selectedCharacterId");
        localStorage.removeItem("activeTabIndex");
      }
    },
    setCharacters: (state, action: PayloadAction<Character[]>) => {
      state.characters = action.payload;
    },
    selectCharacter: (state, action: PayloadAction<string>) => {
      state.selectedCharacterId = action.payload;

      // Save to localStorage if in browser environment
      if (isBrowser) {
        localStorage.setItem("selectedCharacterId", action.payload);
      }
    },
    setLifeEvents: (state, action: PayloadAction<LifeEvent[]>) => {
      state.lifeEvents = action.payload;

      // Extract unique dates from life events
      // Create a Set of unique dates
      const dateSet = new Set(
        action.payload.map((event) => {
          // Extract just the date part (YYYY-MM-DD) from the timestamp
          // Use UTC to prevent timezone issues
          return moment.utc(event.timestamp).format("YYYY-MM-DD");
        })
      );

      // Convert Set to Array and sort
      const uniqueDates = Array.from(dateSet).sort();

      state.availableDates = uniqueDates;

      // Set current view date to the first date if not already set
      if (!state.currentViewDate && uniqueDates.length > 0) {
        state.currentViewDate = uniqueDates[0];
      }
    },
    setCurrentViewDate: (state, action: PayloadAction<string>) => {
      state.currentViewDate = action.payload;
    },
    setConversationThreads: (
      state,
      action: PayloadAction<ConversationThread[]>
    ) => {
      state.conversationThreads = action.payload;

      // Select the first thread if none is selected and threads exist
      if (!state.selectedThreadId && action.payload.length > 0) {
        state.selectedThreadId = action.payload[0].id;
      }
    },
    selectThread: (state, action: PayloadAction<string>) => {
      state.selectedThreadId = action.payload;

      // Save to localStorage if in browser environment
      if (isBrowser) {
        localStorage.setItem("selectedThreadId", action.payload);
      }
    },
    addThread: (state, action: PayloadAction<ConversationThread>) => {
      state.conversationThreads.push(action.payload);
      state.selectedThreadId = action.payload.id;

      // Save to localStorage if in browser environment
      if (isBrowser) {
        localStorage.setItem("selectedThreadId", action.payload.id);
      }
    },
    addMessage: (
      state,
      action: PayloadAction<{ threadId: string; message: Message }>
    ) => {
      const { threadId, message } = action.payload;
      const thread = state.conversationThreads.find((t) => t.id === threadId);

      if (thread) {
        thread.messages.push(message);
        thread.updatedAt = new Date().toISOString();
      }
    },
    updateThread: (
      state,
      action: PayloadAction<{ threadId: string; name?: string }>
    ) => {
      const { threadId, name } = action.payload;
      const thread = state.conversationThreads.find((t) => t.id === threadId);

      if (thread && name) {
        thread.name = name;
        thread.updatedAt = new Date().toISOString();
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

// Export actions
export const {
  clearSelectedCharacter,
  setCharacters,
  selectCharacter,
  setLifeEvents,
  setCurrentViewDate,
  setConversationThreads,
  selectThread,
  addThread,
  addMessage,
  updateThread,
  setLoading,
  setError,
} = characterSlice.actions;

// Configure store
export const store = configureStore({
  reducer: {
    character: characterSlice.reducer,
  },
});

// Export types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
