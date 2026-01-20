
const { ApifyClient } = require('apify-client');
require('dotenv').config({ path: '.env.local' });

async function testLinkedIn() {
    const token = process.env.APIFY_API_TOKEN;
    if (!token) {
        console.error("No APIFY_API_TOKEN found in .env.local");
        return;
    }

    console.log("Using Token:", token.slice(0, 10) + "...");

    const client = new ApifyClient({ token });
    const url = "https://www.linkedin.com/in/seanhsiung/";

    console.log(`Testing scraper for: ${url}`);

    try {
        console.log("Calling Apify actor 'harvestapi/linkedin-profile-scraper' (LpVuK3Zozwuipa5bp)...");
        const run = await client.actor("LpVuK3Zozwuipa5bp").call({
            "profileScraperMode": "Profile details no email ($4 per 1k)",
            "queries": [url]
        });




        console.log("Run finished. Dataset ID:", run.defaultDatasetId);
        const { items } = await client.dataset(run.defaultDatasetId).listItems();

        console.log(`Items found: ${items.length}`);
        if (items.length > 0) {
            console.log("Sample Item Keys:", Object.keys(items[0]));
            console.log("First Item Public ID:", items[0].publicIdentifier);
            console.log("First Item Name:", items[0].fullName);
        } else {
            console.log("WARNING: No items returned.");
        }

    } catch (e) {
        console.error("Error during Apify Execution:", e);
    }
}

testLinkedIn();
