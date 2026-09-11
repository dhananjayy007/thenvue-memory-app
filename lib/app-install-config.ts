/**
 * Centralized configuration for Native Mobile App distribution and placeholders.
 * When Capacitor builds or native store releases go live, update the URLs below.
 */

export const APP_INSTALL_CONFIG = {
  // Flag indicating whether production native stores are live
  isNativeLive: false,

  // App Store link (iOS) - placeholder until App Store approval
  iosAppStoreUrl: null as string | null,

  // Google Play Store link (Android) - placeholder until Play Store approval
  androidPlayStoreUrl: null as string | null,

  // Direct Web App URL
  webAppUrl: 'https://thenvue.com',

  // Current beta stage
  betaStatus: 'Private Beta / TestFlight in development',
}
