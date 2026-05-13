const fs = require('fs');
const STORE_URL = 'park-orchards-football-netball-club.myshopify.com';
const API_VERSION = '2024-10';
const ACCESS_TOKEN = 'shpat_YOUR_TOKEN_HERE';
const GRAPHQL_URL = `https://${STORE_URL}/admin/api/${API_VERSION}/graphql.json`;

async function gql(query, variables = {}) {
    const res = await fetch(GRAPHQL_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': ACCESS_TOKEN },
        body: JSON.stringify({ query, variables }),
    });
    return res.json();
}

async function fetchAllPlayers() {
    let players = [];
    let hasNextPage = true;
    let endCursor = null;

    const query = `
        query($cursor: String) {
            metaobjects(type: "player_profile", first: 250, after: $cursor) {
                pageInfo { hasNextPage endCursor }
                edges { node {
                    id handle
                    fields { key value }
                }}
            }
        }
    `;

    while (hasNextPage) {
        const result = await gql(query, { cursor: endCursor });
        const metaobjects = result.data?.metaobjects;
        if (!metaobjects) break;

        for (const edge of metaobjects.edges) {
            const fields = {};
            for (const f of edge.node.fields) {
                fields[f.key] = f.value;
            }
            players.push({ handle: edge.node.handle, ...fields });
        }

        hasNextPage = metaobjects.pageInfo.hasNextPage;
        endCursor = metaobjects.pageInfo.endCursor;
    }

    fs.writeFileSync('all_players.json', JSON.stringify(players, null, 2));
    console.log(`Fetched ${players.length} players.`);
}

fetchAllPlayers().catch(console.error);
