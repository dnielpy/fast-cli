# fast-test-cli

Prueba la velocidad de tu conexión desde la terminal usando servidores de Netflix, como fast.com.

## Requisitos

- macOS o Linux
- Node.js 20 o superior

## Instalación

```bash
npm install -g fast-test-cli
```

## Uso

```bash
fast
```

Por defecto mide ping, descarga y subida y actualiza la velocidad en la misma línea de la terminal.
Cada fase dura al menos 10 segundos y puede extenderse hasta 30 segundos para estabilizar el resultado.

```bash
fast --download-only
fast --json
fast --verbose
fast --help
```

`--json` está pensado para scripts y no imprime progreso interactivo. El resultado depende de la ruta entre tu conexión y los servidores de Netflix, por lo que puede variar entre ejecuciones. Esta herramienta no sustituye una certificación empresarial de ancho de banda.

## Desarrollo local

```bash
npm install
npm test
npm run build
npm install -g .
```

El comando no abre un navegador: obtiene la configuración actual de fast.com y realiza las transferencias directamente desde Node.js.
