// Custom ESM loader to handle Windows paths
import { pathToFileURL } from 'url';
import { resolve as resolvePath } from 'path';

export async function resolve(specifier, context, nextResolve) {
    // Convert Windows absolute paths to file:// URLs
    if (specifier.match(/^[a-z]:\\/i)) {
        specifier = pathToFileURL(specifier).href;
    }

    return nextResolve(specifier, context);
}
