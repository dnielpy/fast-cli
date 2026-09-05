#!/usr/bin/env node
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { realpathSync } from "node:fs";
import { formatCenteredProgress, formatJson, formatResult } from "./format.js";
import { runSpeedTest } from "./speed-test.js";
import type { ProgressUpdate, TestOptions } from "./types.js";

export interface CliOptions extends TestOptions {
  help: boolean;
  version: boolean;
}

export function parseArgs(args: string[]): CliOptions {
  const options: CliOptions = {
    upload: true,
    verbose: false,
    json: false,
    help: false,
    version: false,
  };

  for (const arg of args) {
    switch (arg) {
      case "--download-only":
        options.upload = false;
        break;
      case "--verbose":
        options.verbose = true;
        break;
      case "--json":
        options.json = true;
        break;
      case "--help":
      case "-h":
        options.help = true;
        break;
      case "--version":
      case "-v":
        options.version = true;
        break;
      default:
        throw new Error(`Opción desconocida: ${arg}`);
    }
  }
  return options;
}

export function helpText(): string {
  return `fast — prueba de velocidad con fast.com

Uso:
  fast                 Mide descarga y subida
  fast --download-only Mide solo descarga

Opciones:
  --download-only      Omite la prueba de subida
  --json               Devuelve el resultado en JSON
  --verbose            Incluye servidor, cliente, IP y duración
  -h, --help           Muestra esta ayuda
  -v, --version        Muestra la versión
`;
}

export async function main(args = process.argv.slice(2)): Promise<void> {
  let options: CliOptions;
  try {
    options = parseArgs(args);
  } catch (error) {
    printError(error);
    process.exitCode = 2;
    return;
  }

  if (options.help) {
    console.log(helpText());
    return;
  }
  if (options.version) {
    console.log("1.0.0");
    return;
  }

  const controller = new AbortController();
  const onSigint = () => controller.abort(new Error("Prueba cancelada por el usuario"));
  process.once("SIGINT", onSigint);
  const interactive = Boolean(process.stdout.isTTY) && !options.json;

  try {
    if (interactive) {
      process.stdout.write("\x1b[2J\x1b[H");
      process.stdout.write(centerText("Conectando con fast.com...", process.stdout.columns ?? 80, process.stdout.rows ?? 24));
    }
    const result = await runSpeedTest(options, interactive ? renderProgress : undefined, controller.signal);
    if (options.json) {
      console.log(formatJson(result));
    } else {
      if (interactive) {
        process.stdout.write("\x1b[2J\x1b[H");
        console.log(formatResult(result, options.verbose));
      } else {
        console.log(formatResult(result, options.verbose));
      }
    }
  } catch (error) {
    printError(error);
    process.exitCode = controller.signal.aborted ? 130 : 1;
  } finally {
    process.removeListener("SIGINT", onSigint);
  }
}

function renderProgress(update: ProgressUpdate): void {
  process.stdout.write(`\x1b[2J\x1b[H${formatCenteredProgress(update, process.stdout.columns ?? 80, process.stdout.rows ?? 24)}`);
}

function centerText(text: string, columns: number, rows: number): string {
  const topPadding = Math.max(0, Math.floor((rows - 1) / 2));
  const leftPadding = Math.max(0, Math.floor((columns - text.length) / 2));
  return `${"\n".repeat(topPadding)}${" ".repeat(leftPadding)}${text}\n`;
}

function printError(error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Error: ${message}`);
}

if (process.argv[1] && realpathSync(fileURLToPath(import.meta.url)) === realpathSync(resolve(process.argv[1]))) {
  await main();
}
