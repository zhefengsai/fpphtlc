#!/usr/bin/env node

// Suppress Node.js version warning for Hardhat
process.env.SUPPRESS_HARDHAT_NODEJS_WARNING = true;

// Run the actual script
const scriptPath = process.argv[2];
if (!scriptPath) {
    console.error("Please provide a script path");
    process.exit(1);
}

try {
    // Dynamic import of the target script
    import(scriptPath)
        .then(() => {
            process.exit(0);
        })
        .catch((error) => {
            console.error("Script execution failed:", error);
            process.exit(1);
        });
} catch (error) {
    console.error("Failed to import script:", error);
    process.exit(1);
}
