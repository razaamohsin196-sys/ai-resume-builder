
const { ApifyClient } = require('apify-client');
require('dotenv').config({ path: '.env.local' });

async function testLatency() {
    const token = process.env.APIFY_API_TOKEN || process.env.APIFY_API_KEY;
    console.log("Using Token:", token ? "FOUND" : "MISSING");
    if (!token) return;

    const client = new ApifyClient({ token });
    const profileUrl = "https://www.linkedin.com/in/seanhsiung/";

    console.log(`Starting Apify run for ${profileUrl}...`);
    const start = Date.now();

    try {
        // HarvestAPI Scraper (LpVuK3Zozwuipa5bp)
        const run = await client.actor("LpVuK3Zozwuipa5bp").call({
            "profileScraperMode": "Profile details no email ($4 per 1k)",
            "queries": [profileUrl]
        });

        const duration = (Date.now() - start) / 1000;
        console.log(`Apify run completed in ${duration.toFixed(2)}s`);
        console.log("Run ID:", run.id);

        // Fetch items
        const { items } = await client.dataset(run.defaultDatasetId).listItems();
        console.log("Items found:", items.length);

    } catch (error) {
        const duration = (Date.now() - start) / 1000;
        console.error(`Apify run failed after ${duration.toFixed(2)}s`, error);
    }
}

testLatency();
