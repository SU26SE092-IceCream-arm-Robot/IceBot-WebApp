import {
  HubConnection,
  HubConnectionBuilder,
  LogLevel,
} from "@microsoft/signalr";

import { getStoredAccessToken } from "@/lib/auth-session";

export interface CreateHubConnectionOptions {
  url: string;
  logLevel?: LogLevel;
}

export function createHubConnection(
  options: CreateHubConnectionOptions,
): HubConnection {
  return new HubConnectionBuilder()
    .withUrl(options.url, {
      accessTokenFactory: () => getStoredAccessToken() ?? "",
    })
    .withAutomaticReconnect({
      nextRetryDelayInMilliseconds: (retryContext) => {
        // Exponential backoff: 0s, 2s, 5s, 10s, 20s, max 30s
        const delays = [0, 2000, 5000, 10000, 20000];
        return delays[retryContext.previousAttempts] ?? 30000;
      },
    })
    .configureLogging(options.logLevel ?? LogLevel.Warning)
    .build();
}
