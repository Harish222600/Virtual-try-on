// Workaround for Windows ESM path issue with Expo/Metro
// This script patches the module loader to handle Windows paths correctly

const { pathToFileURL } = require('url');
const Module = require('module');
const originalLoad = Module._load;

// Patch Module._load to convert Windows paths to file:// URLs
Module._load = function (request, parent) {
    // Check if this is a config file being loaded
    if (request.includes('metro.config') || request.includes('babel.config')) {
        try {
            // Convert Windows path to file:// URL if needed
            if (request.match(/^[a-z]:\\/i)) {
                request = pathToFileURL(request).href;
            }
        } catch (e) {
            // If conversion fails, use original request
        }
    }
    return originalLoad.apply(this, arguments);
};

// Now start Expo CLI
require('@expo/cli/build/bin/cli');
