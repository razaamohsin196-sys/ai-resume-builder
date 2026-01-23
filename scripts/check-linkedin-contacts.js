
const { ApifyClient } = require('apify-client');
require('dotenv').config({ path: '.env.local' });

async function checkContacts() {
    const token = process.env.APIFY_API_TOKEN || process.env.APIFY_API_KEY;
    if (!token) {
        console.error("No APIFY_API_TOKEN found");
        return;
    }

    const client = new ApifyClient({ token });
    const profileUrl = "https://www.linkedin.com/in/beckyhsiung/";

    console.log(`Fetching data for ${profileUrl}...`);

    try {
        const run = await client.actor("LpVuK3Zozwuipa5bp").call({
            "profileScraperMode": "Profile details + email search ($10 per 1k)",
            "queries": [profileUrl]
        });

        console.log("Run finished. Fetching results...");
        const { items } = await client.dataset(run.defaultDatasetId).listItems();

        if (items.length > 0) {
            const data = items[0];
            console.log("--- CONTACT INFO ---");
            console.log(JSON.stringify(data.contactInfo || {}, null, 2));
            console.log("--- TOP LEVEL FIELDS ---");
            console.log("Emails:", JSON.stringify(data.emails));
            console.log("Phone:", data.phone);
            console.log("BirthDate:", data.birthDate);
            console.log("Birthday:", data.birthday);

            // Also print entire keys to see if we missed anything
            console.log("--- ALL KEYS ---");
            console.log(Object.keys(data));
        } else {
            console.log("No items returned.");
        }

    } catch (error) {
        console.error("Error:", error);
    }
}

checkContacts();
