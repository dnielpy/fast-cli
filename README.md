# fast-test-cli

Prueba la velocidad de tu conexión desde la terminal usando servidores de Netflix, como fast.com.

## Requisitos

- macOS o Linux
- Node.js 20 o superior

## Instalación desde npm

```bash
npm install -g fast-test-cli
```

Después, en macOS o Linux, ejecuta:

```bash
fast
```

No hace falta instalar nada diferente según el sistema operativo. Si npm muestra `EACCES` en macOS o Linux, configura un prefijo de usuario:

```bash
mkdir -p ~/.npm-global
npm config set prefix ~/.npm-global
echo 'export PATH="$HOME/.npm-global/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
npm install -g fast-test-cli
```

En Linux que use Bash, cambia `~/.zshrc` por `~/.bashrc`.

## Instalación desde GitHub

```bash
git clone git@github.com:dnielpy/fast-cli.git
cd fast-cli
npm install
npm run build
npm install -g . --prefix ~/.npm-global
```

Luego ejecuta `fast`.

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
npm run build
npm install -g .
```

El comando no abre un navegador: obtiene la configuración actual de fast.com y realiza las transferencias directamente desde Node.js.
