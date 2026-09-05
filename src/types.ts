export interface FastTarget {
  name?: string;
  url: string;
  location?: {
    city?: string;
    country?: string;
  };
}

export interface FastConfig {
  client?: {
    ip?: string;
    asn?: string;
    location?: {
      city?: string;
      country?: string;
    };
  };
  targets?: FastTarget[];
}

export interface Measurement {
  bytes: number;
  elapsedMs: number;
  mbps: number;
}

export interface SpeedTestResult {
  downloadMbps: number;
  uploadMbps: number | null;
  pingMs: number | null;
  durationMs: number;
  server: string | null;
  serverLocation: string | null;
  clientIp: string | null;
  clientLocation: string | null;
}

export interface TestOptions {
  upload: boolean;
  verbose: boolean;
  json: boolean;
  minDurationMs?: number;
  maxDurationMs?: number;
}

export interface ProgressUpdate {
  phase: "download" | "upload";
  mbps: number;
  elapsedMs: number;
  bytes: number;
}

export type ProgressHandler = (update: ProgressUpdate) => void;
