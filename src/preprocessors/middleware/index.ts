import { glob } from 'glob';
import { dirname, join, relative, sep } from 'path';
import type { Plugin } from 'vite';
import { actionsHandler, loadHandler, requestHandlerTemplate } from './templates';

interface MiddlewarePlugin {
  routesDir?: string;
}

export function routeMiddleware(options: MiddlewarePlugin = {}): Plugin {
  const routesDir = options.routesDir || 'src/routes';
  const middlewareMap: Map<string, string> = new Map();
  let projectRoot: string;

  return {
    name: 'vite-plugin-route-middleware',

    configResolved(config) {
      projectRoot = config.root;
      // Build middleware map on startup
      updateMiddlewareMap();
    },

    configureServer(server) {
      // Watch for middleware file changes in dev
      server.watcher.on('add', (file) => {
        if (file.includes('_middleware.server.ts')) {
          updateMiddlewareMap();
        }
      });

      server.watcher.on('unlink', (file) => {
        if (file.includes('_middleware.server.ts')) {
          updateMiddlewareMap();
        }
      });
    },

    transform(code: string, id: string) {
      if (!id.includes(routesDir)) return null;
      if (!/\+(page|layout)?\.?server\.(ts|js)$/.test(id)) return null;

      const middlewarePath = findMiddlewareForRoute(id);
      if (!middlewarePath) {
        return null;
      }

      // Generate import path
      const importPath = getRelativeImportPath(id, middlewarePath);

      // Transform the code to wrap exports with middleware
      const transformed = wrapWithMiddleware(code, importPath);

      return {
        code: transformed,
        map: null
      };
    }
  };

  function updateMiddlewareMap() {
    middlewareMap.clear();
    const pattern = join(projectRoot, routesDir, '**/_middleware.server.ts');
    const middlewareFiles = glob.sync(pattern);

    for (const file of middlewareFiles) {
      const dir = dirname(file);
      const relativeDir = relative(join(projectRoot, routesDir), dir);
      middlewareMap.set(relativeDir, file);
    }
  }

  function findMiddlewareForRoute(routeFile: string): string | null {
    const routeDir = dirname(routeFile);
    const relativeRouteDir = relative(join(projectRoot, routesDir), routeDir);

    // Check current directory and all parent directories
    const segments = relativeRouteDir.split(sep);
    for (let i = segments.length; i >= 0; i--) {
      const checkPath = segments.slice(0, i).join(sep);
      if (middlewareMap.has(checkPath)) {
        return middlewareMap.get(checkPath)!;
      }
    }

    return null;
  }

  function getRelativeImportPath(from: string, to: string): string {
    const relativePath = relative(dirname(from), to);
    const importPath = relativePath.replace(/\\/g, '/').replace(/\.ts$/, '');
    return importPath.startsWith('.') ? importPath : `./${importPath}`;
  }

  function wrapWithMiddleware(code: string, middlewarePath: string): string {
    // Parse exports from the original code
    const hasGET = /export\s+(const|function|async\s+function)\s+GET/.test(code);
    const hasPOST = /export\s+(const|function|async\s+function)\s+POST/.test(code);
    const hasPUT = /export\s+(const|function|async\s+function)\s+PUT/.test(code);
    const hasDELETE = /export\s+(const|function|async\s+function)\s+DELETE/.test(code);
    const hasPATCH = /export\s+(const|function|async\s+function)\s+PATCH/.test(code);
    const hasLoad = /export\s+(const|function|async\s+function)\s+load/.test(code);
    const hasActions = /export\s+const\s+actions/.test(code);

    const additions: string[] = [];

    // Replace exports with wrapped versions
    if (hasGET) {
      const methodName = '__original_GET';
      code = code.replace(/export\s+(const|function|async\s+function)\s+GET/, `$1 ${methodName}`);
      const addition = requestHandlerTemplate('GET', methodName);
      additions.push(addition);
    }

    if (hasPOST) {
      const methodName = '__original_POST';
      code = code.replace(/export\s+(const|function|async\s+function)\s+POST/, `$1 ${methodName}`);
      const addition = requestHandlerTemplate('POST', methodName);
      additions.push(addition);
    }

    if (hasPUT) {
      const methodName = '__original_PUT';
      code = code.replace(/export\s+(const|function|async\s+function)\s+PUT/, `$1 ${methodName}`);
      const addition = requestHandlerTemplate('PUT', methodName);
      additions.push(addition);
    }

    if (hasPATCH) {
      const methodName = '__original_PATCH';
      code = code.replace(/export\s+(const|function|async\s+function)\s+PATCH/, `$1 ${methodName}`);
      const addition = requestHandlerTemplate('PATCH', methodName);
      additions.push(addition);
    }

    if (hasDELETE) {
      const methodName = '__original_DELETE';
      code = code.replace(
        /export\s+(const|function|async\s+function)\s+DELETE/,
        `$1 ${methodName}`
      );
      const addition = requestHandlerTemplate('DELETE', methodName);
      additions.push(addition);
    }

    if (hasLoad) {
      code = code.replace(
        /export\s+(const|function|async\s+function)\s+load/,
        '$1 __original_load'
      );
      additions.push(loadHandler);
    }

    if (hasActions) {
      // For form actions, wrap each action
      code = code.replace(/export\s+const\s+actions\s*=\s*{/, 'const __original_actions = {');
      additions.push(actionsHandler);
    }

    return [
      `import { middleware as __middleware } from '${middlewarePath}';\n\n`,
      code,
      ...additions
    ].join('\n');
  }
}
