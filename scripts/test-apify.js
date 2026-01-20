
const { ApifyClient } = require('apify-client');
require('dotenv').config({ path: '.env.local' });

async function test() {
    console.log("Testing Apify Connection...");
    const token = process.env.APIFY_API_TOKEN;
    if (!token) {
        console.error("❌ No API token found in .env.local");
        return;
    }
    console.log(`Token found: ${token.slice(0, 10)}...`);

    const client = new ApifyClient({ token: token });
    const linkedinUrl = "https://www.linkedin.com/in/beckyhsiung"; // Test with the user's URL

    try {
        console.log(`Calling actor 'harvest/linkedin-profile-scraper'...`);
        // Using the same config as in the app
        const run = await client.actor("rocky/linkedin-profile-scraper").call({
            "urls": [linkedinUrl],
            "minDelay": 2,
            "maxDelay": 5,
            "proxy": { "useApifyProxy": true }
        });

        console.log(`Run finished: ${run.status}`);
        console.log(`Dataset ID: ${run.defaultDatasetId}`);

        const { items } = await client.dataset(run.defaultDatasetId).listItems();
        console.log(`Items found: ${items.length}`);

        if (items.length > 0) {
            console.log("✅ First Item Preview:", JSON.stringify(items[0]).slice(0, 200));
        } else {
            console.log("⚠️ No items returned.");
        }

    } catch (error) {
        console.error("❌ PROBE FAILED:", error);
        if (error.data) console.error("Error Data:", JSON.stringify(error.data, null, 2));
    }
}

test();
