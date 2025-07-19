import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import Timeline from "@mui/lab/Timeline";
import TimelineContent from "@mui/lab/TimelineContent";
import TimelineItem from "@mui/lab/TimelineItem";
import TimelineOppositeContent from "@mui/lab/TimelineOppositeContent";
import TimelineSeparator from "@mui/lab/TimelineSeparator";
import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  IconButton,
  Paper,
  Typography,
} from "@mui/material";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { format, parseISO } from "date-fns";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { LifeEvent, RootState, setCurrentViewDate } from "../../../store";
import { TimelineConnector, TimelineDate, TimelineDot } from "../atoms";
import { SocialMediaPost } from "../molecules";

// Helper function to format date for navigation
const formatNavigationDate = (dateString: string) => {
  try {
    // Use UTC mode to prevent timezone issues
    const date = parseISO(dateString.split("T")[0]);
    return format(date, "MMMM d, yyyy");
  } catch (error) {
    return dateString.split("T")[0]; // Fallback to YYYY-MM-DD format
  }
};

// Helper function to get day of week
const getDayOfWeek = (dateString: string) => {
  try {
    const date = parseISO(dateString.split("T")[0]);
    return format(date, "EEEE");
  } catch (error) {
    return "";
  }
};

// Helper function to format only the time part of a date
const formatTime = (dateString: string) => {
  try {
    const date = parseISO(dateString);
    return format(date, "h:mm a");
  } catch (error) {
    return dateString; // Fallback to original string if parsing fails
  }
};

/**
 * LifeTimeline organism component for displaying a character's life timeline
 */
const LifeTimeline: React.FC = () => {
  const dispatch = useDispatch();
  const { lifeEvents, currentViewDate, availableDates, isLoading, error } =
    useSelector((state: RootState) => state.character);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  if (isLoading) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Typography variant="h6">Loading life events...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Typography variant="h6" color="error">
          {error}
        </Typography>
      </Box>
    );
  }

  if (lifeEvents.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Typography variant="h6">
          No life events found. Please select a character.
        </Typography>
      </Box>
    );
  }

  // Filter events for the current date
  const currentDateEvents = lifeEvents.filter((event) =>
    event.timestamp.startsWith(currentViewDate || "")
  );

  // Sort events by time
  const sortedEvents = [...currentDateEvents].sort(
    (a, b) => parseISO(a.timestamp).getTime() - parseISO(b.timestamp).getTime()
  );

  // Handle date navigation
  const handleDateChange = (newDate: string) => {
    dispatch(setCurrentViewDate(newDate));
  };

  // Get current date index
  const currentDateIndex = availableDates.findIndex(
    (date) => date === currentViewDate
  );
  const hasPrevious = currentDateIndex > 0;
  const hasNext = currentDateIndex < availableDates.length - 1;

  return (
    <Paper elevation={3} sx={{ p: 2, mb: 4 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h5" gutterBottom sx={{ mb: 0 }}>
          Character Life Timeline
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center" }}>
          <IconButton
            onClick={() =>
              hasPrevious &&
              handleDateChange(availableDates[currentDateIndex - 1])
            }
            disabled={!hasPrevious}
          >
            <ArrowBackIcon />
          </IconButton>

          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            {/* Day of week display */}
            {currentViewDate && (
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: "bold",
                  mb: 0.5,
                  color: "primary.main",
                }}
              >
                {getDayOfWeek(currentViewDate)}
              </Typography>
            )}

            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                value={currentViewDate ? parseISO(currentViewDate) : null}
                onChange={(newDate) => {
                  if (newDate) {
                    const formattedDate = format(newDate, "yyyy-MM-dd");
                    // Find the closest available date
                    const closestDate =
                      availableDates.find((date) => date >= formattedDate) ||
                      availableDates[availableDates.length - 1];
                    handleDateChange(closestDate);
                  }
                  setIsCalendarOpen(false);
                }}
                open={isCalendarOpen}
                onClose={() => setIsCalendarOpen(false)}
                slotProps={{
                  textField: {
                    variant: "standard",
                    InputProps: {
                      endAdornment: <CalendarMonthIcon color="action" />,
                      sx: {
                        typography: "h6",
                        border: "none",
                        "& .MuiInputBase-input": {
                          textAlign: "center",
                          cursor: "pointer",
                          mx: 1,
                        },
                      },
                    },
                    sx: { width: "280px" },
                    onClick: () => setIsCalendarOpen(true),
                    // Don't manually set the value - let DatePicker handle it
                    inputProps: {
                      readOnly: true,
                    },
                  },
                }}
                // Add format to ensure consistent date display
                format="MMMM d, yyyy"
              />
            </LocalizationProvider>
          </Box>

          <IconButton
            onClick={() =>
              hasNext && handleDateChange(availableDates[currentDateIndex + 1])
            }
            disabled={!hasNext}
          >
            <ArrowForwardIcon />
          </IconButton>
        </Box>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {sortedEvents.length === 0 ? (
        <Box sx={{ p: 3, textAlign: "center" }}>
          <Typography variant="body1">
            No events found for this date.
          </Typography>
        </Box>
      ) : (
        <Timeline position="alternate">
          {sortedEvents.map((event: LifeEvent, index: number) => (
            <TimelineItem key={`event-${index}-${event.timestamp}`}>
              <TimelineOppositeContent color="text.secondary">
                <TimelineDate date={event.timestamp} format="h:mm A" />
                {event.location && (
                  <Typography variant="caption">📍 {event.location}</Typography>
                )}
              </TimelineOppositeContent>

              <TimelineSeparator>
                <TimelineDot category="activity" color="#757575" />
                <TimelineConnector />
              </TimelineSeparator>

              <TimelineContent>
                {event.socialMediaContent ? (
                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 2 }}
                  >
                    <Card variant="outlined" sx={{ mb: 2 }}>
                      <CardContent>
                        <Typography variant="body1">
                          {event.activity}
                        </Typography>
                        {event.thoughts && (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mt: 1 }}
                          >
                            Thoughts: {event.thoughts}
                          </Typography>
                        )}
                        {event.emotionalState && (
                          <Typography variant="body2" color="text.secondary">
                            Feeling: {event.emotionalState}
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                    <SocialMediaPost
                      content={event.socialMediaContent}
                      date={formatTime(event.timestamp)}
                      align={index % 2 === 0 ? "right" : "left"}
                    />
                  </Box>
                ) : (
                  <Card variant="outlined" sx={{ mb: 2 }}>
                    <CardContent>
                      <Typography variant="body1">{event.activity}</Typography>
                      {event.thoughts && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mt: 1 }}
                        >
                          Thoughts: {event.thoughts}
                        </Typography>
                      )}
                      {event.emotionalState && (
                        <Typography variant="body2" color="text.secondary">
                          Feeling: {event.emotionalState}
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                )}
              </TimelineContent>
            </TimelineItem>
          ))}
        </Timeline>
      )}

      {/* Bottom pagination controls */}
      {sortedEvents.length > 0 && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            mt: 3,
            gap: 2,
          }}
        >
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() =>
              hasPrevious &&
              handleDateChange(availableDates[currentDateIndex - 1])
            }
            disabled={!hasPrevious}
          >
            Previous Day
          </Button>

          <Button
            variant="outlined"
            endIcon={<ArrowForwardIcon />}
            onClick={() =>
              hasNext && handleDateChange(availableDates[currentDateIndex + 1])
            }
            disabled={!hasNext}
          >
            Next Day
          </Button>
        </Box>
      )}
    </Paper>
  );
};

export default LifeTimeline;
