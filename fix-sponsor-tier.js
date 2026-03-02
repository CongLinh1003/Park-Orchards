/**
 * Quick script to query sponsor_tier definition fields + fix entries.
 * Chạy: node fix-sponsor-tier.js
 */

const STORE_URL = 'park-orchards-football-netball-club.myshopify.com';
const API_VERSION = '2024-10';
const GRAPHQL_URL = `https://${STORE_URL}/admin/api/${API_VERSION}/graphql.json`;

async function graphqlRequest(query, variables = {}) {
    const res = await fetch(GRAPHQL_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': ACCESS_TOKEN,
        },
        body: JSON.stringify({ query, variables }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    return await res.json();
}

async function main() {
    // Step 1: Query all definitions and their fields
    console.log('📋 Querying all metaobject definitions with fields...\n');

    const result = await graphqlRequest(`
    query {
      metaobjectDefinitions(first: 50) {
        edges {
          node {
            id
            type
            name
            fieldDefinitions {
              name
              key
              type {
                name
              }
            }
          }
        }
      }
    }
  `);

    for (const edge of result.data.metaobjectDefinitions.edges) {
        const def = edge.node;
        console.log(`\n📂 ${def.name} (${def.type})`);
        console.log(`   ID: ${def.id}`);
        for (const field of def.fieldDefinitions) {
            console.log(`   - ${field.key} (${field.type.name}): "${field.name}"`);
        }
    }

    // Step 2: Find sponsor_tier and create entries with correct field keys
    const sponsorTierDef = result.data.metaobjectDefinitions.edges.find(
        e => e.node.type === 'sponsor_tier'
    );

    if (!sponsorTierDef) {
        console.log('\n❌ sponsor_tier definition not found!');
        return;
    }

    const fields = sponsorTierDef.node.fieldDefinitions.map(f => f.key);
    console.log(`\n\n🔧 sponsor_tier field keys: ${fields.join(', ')}`);

    // Try creating entries using detected field keys
    const entries = [
        { handle: 'gold', name: 'Gold', sort_order: '1', badge_label: 'Gold' },
        { handle: 'silver', name: 'Silver', sort_order: '2', badge_label: 'Silver' },
        { handle: 'jumper', name: 'Jumper', sort_order: '3', badge_label: 'Jumper' },
        { handle: 'community-partner', name: 'Community Partner', sort_order: '4', badge_label: 'Community Partner' },
    ];

    console.log('\n📝 Creating sponsor_tier entries...\n');

    for (const entry of entries) {
        // Build fields dynamically based on what the definition actually has
        const entryFields = [];
        for (const key of fields) {
            if (entry[key] !== undefined) {
                entryFields.push({ key, value: entry[key] });
            }
        }

        // If "name" field doesn't exist, try other common field names
        if (!fields.includes('name')) {
            // Try to find a text field that might be the "name" equivalent
            const textFields = sponsorTierDef.node.fieldDefinitions.filter(
                f => f.type.name === 'single_line_text_field'
            );
            if (textFields.length > 0) {
                // Use the first text field as the name
                const nameField = textFields[0];
                entryFields.push({ key: nameField.key, value: entry.name });
                console.log(`   Using "${nameField.key}" as name field`);
            }
        }

        try {
            const r = await graphqlRequest(`
        mutation CreateMetaobject($metaobject: MetaobjectCreateInput!) {
          metaobjectCreate(metaobject: $metaobject) {
            metaobject { handle type }
            userErrors { field message code }
          }
        }
      `, {
                metaobject: {
                    type: 'sponsor_tier',
                    handle: entry.handle,
                    fields: entryFields.length > 0 ? entryFields : undefined,
                    capabilities: { publishable: { status: 'ACTIVE' } },
                },
            });

            const p = r.data?.metaobjectCreate;
            if (p?.userErrors?.length) {
                console.log(`  ⚠️  ${entry.name}:`);
                p.userErrors.forEach(e => console.log(`     [${e.code}] ${e.message}`));
            } else {
                console.log(`  ✅ ${entry.name} (${entry.handle})`);
            }
        } catch (err) {
            console.log(`  ❌ ${entry.name}: ${err.message}`);
        }

        await new Promise(r => setTimeout(r, 300));
    }
}

main().catch(console.error);
