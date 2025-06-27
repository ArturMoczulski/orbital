import { SnackbarProvider, useSnackbar, VariantType } from "notistack";
import React, { createContext, useContext } from "react";

/**
 * Interface for the notification context
 */
export interface NotificationContextType {
  /**
   * Show a notification
   * @param message The message to display
   * @param variant The variant of the notification (default, error, success, warning, info)
   * @param options Additional options for the notification
   */
  notify: (
    message: string,
    variant?: VariantType,
    options?: Record<string, any>
  ) => void;
}

/**
 * Context for the notification system
 */
const NotificationContext = createContext<NotificationContextType | null>(null);

/**
 * Props for the NotificationProvider component
 */
export interface NotificationProviderProps {
  /**
   * Maximum number of notifications to display at once
   * @default 3
   */
  maxSnack?: number;

  /**
   * Auto hide duration in milliseconds
   * @default 5000
   */
  autoHideDuration?: number;

  /**
   * Anchor origin for the notifications
   * @default { vertical: 'top', horizontal: 'right' }
   */
  anchorOrigin?: {
    vertical: "top" | "bottom";
    horizontal: "left" | "center" | "right";
  };

  /**
   * Children components
   */
  children: React.ReactNode;
}

/**
 * Provider component for the notification system
 * Wraps the application with the SnackbarProvider from notistack
 */
export function NotificationProvider({
  maxSnack = 3,
  autoHideDuration = 5000,
  anchorOrigin = { vertical: "top", horizontal: "right" },
  children,
}: NotificationProviderProps) {
  return (
    <SnackbarProvider
      maxSnack={maxSnack}
      autoHideDuration={autoHideDuration}
      anchorOrigin={anchorOrigin}
    >
      <NotificationProviderContent>{children}</NotificationProviderContent>
    </SnackbarProvider>
  );
}

/**
 * Internal component that provides the notification context
 */
function NotificationProviderContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const { enqueueSnackbar } = useSnackbar();

  const notify = (
    message: string,
    variant: VariantType = "default",
    options: Record<string, any> = {}
  ) => {
    enqueueSnackbar(message, {
      variant,
      ...options,
    });
  };

  return (
    <NotificationContext.Provider value={{ notify }}>
      {children}
    </NotificationContext.Provider>
  );
}

/**
 * Hook to use the notification system
 * @returns The notification context
 * @throws Error if used outside of a NotificationProvider
 */
export function useNotification(): NotificationContextType {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotification must be used within a NotificationProvider"
    );
  }
  return context;
}
