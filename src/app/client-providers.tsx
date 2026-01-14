"use client";

import { AuthProvider } from "@/components/auth/AuthProvider";
import { ProfileProvider } from "@/contexts/ProfileContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { IOS26Provider } from "@/components/ios26";
import { AnalyticsProvider } from "@/providers/AnalyticsProvider";
import { MonetizationProvider } from "@/features/monetization/MonetizationProvider";
import { Toaster } from "sonner";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ThemeProvider defaultTheme="system" storageKey="ui-theme">
        <AuthProvider>
          <AnalyticsProvider>
            <ProfileProvider>
              <MonetizationProvider>
                <IOS26Provider>
                  {children}
                </IOS26Provider>
              </MonetizationProvider>
            </ProfileProvider>
          </AnalyticsProvider>
        </AuthProvider>
      </ThemeProvider>
      <Toaster richColors closeButton />
    </>
  );
}