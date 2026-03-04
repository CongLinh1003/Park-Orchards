/**
 * Shopify Metaobject Entries Setup Script
 * Park Orchards Football & Netball Club
 * 
 * Tạo sẵn term entries cho 7 term metaobjects.
 * Chạy SAU khi đã chạy setup-metaobjects.js thành công.
 * Chạy: node setup-metaobject-entries.js
 */

const STORE_URL = 'park-orchards-football-netball-club.myshopify.com';
const API_VERSION = '2024-10';

const GRAPHQL_URL = `https://${STORE_URL}/admin/api/${API_VERSION}/graphql.json`;

async function graphqlRequest(query, variables = {}) {
    const response = await fetch(GRAPHQL_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': ACCESS_TOKEN,
        },
        body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`HTTP ${response.status}: ${text}`);
    }

    return await response.json();
}

const CREATE_METAOBJECT_MUTATION = `
  mutation CreateMetaobject($metaobject: MetaobjectCreateInput!) {
    metaobjectCreate(metaobject: $metaobject) {
      metaobject {
        handle
        type
      }
      userErrors {
        field
        message
        code
      }
    }
  }
`;

// ============================================================
// Term Entries Data
// ============================================================

const termEntries = [
    // --- Club Sport ---
    {
        type: 'club_sport',
        entries: [
            { name: 'Football', handle: 'football', sort_order: 1 },
            { name: 'Netball', handle: 'netball', sort_order: 2 },
        ],
    },

    // --- Club Division ---
    {
        type: 'club_division',
        entries: [
            { name: 'Men', handle: 'men', sort_order: 1 },
            { name: 'Women', handle: 'women', sort_order: 2 },
        ],
    },

    // --- Club Grade ---
    {
        type: 'club_grade',
        entries: [
            { name: 'Seniors', handle: 'seniors', sort_order: 1 },
            { name: 'Reserves', handle: 'reserves', sort_order: 2 },
            { name: 'Under 19', handle: 'under-19', sort_order: 3 },
        ],
    },

    // --- Sponsor Scope ---
    {
        type: 'sponsor_scope',
        entries: [
            { name: 'Club Sponsor', handle: 'club-sponsor', sort_order: 1 },
            { name: 'Player Sponsor', handle: 'player-sponsor', sort_order: 2 },
        ],
    },

    // --- Sponsor Tier ---
    {
        type: 'sponsor_tier',
        entries: [
            { name: 'Gold', handle: 'gold', sort_order: 1, badge_label: 'Gold' },
            { name: 'Silver', handle: 'silver', sort_order: 2, badge_label: 'Silver' },
            { name: 'Jumper', handle: 'jumper', sort_order: 3, badge_label: 'Jumper' },
            { name: 'Community Partner', handle: 'community-partner', sort_order: 4, badge_label: 'Community Partner' },
        ],
    },

    // --- Club People Group ---
    {
        type: 'club_people_group',
        entries: [
            { name: 'Committee Personnel', handle: 'committee-personnel', sort_order: 1 },
            { name: 'Support Personnel', handle: 'support-personnel', sort_order: 2 },
            { name: 'Volunteers', handle: 'volunteers', sort_order: 3 },
            { name: 'Community Members', handle: 'community-members', sort_order: 4 },
        ],
    },

    // --- Membership Category ---
    {
        type: 'membership_category',
        entries: [
            { name: 'Player', handle: 'player', sort_order: 1 },
            { name: 'Social', handle: 'social', sort_order: 2 },
            { name: 'Premium', handle: 'premium', sort_order: 3 },
            { name: 'Honorary', handle: 'honorary', sort_order: 4 },
        ],
    },
];

// ============================================================
// Main Execution
// ============================================================

async function main() {
    console.log('🏈 Park Orchards FC & NC — Term Entries Setup');
    console.log('='.repeat(60));

    let successCount = 0;
    let errorCount = 0;
    let totalEntries = termEntries.reduce((sum, g) => sum + g.entries.length, 0);
    let current = 0;

    for (const group of termEntries) {
        console.log(`\n📂 ${group.type}`);

        for (const entry of group.entries) {
            current++;
            const label = `[${current}/${totalEntries}] ${group.type} → ${entry.name}`;

            // Build fields array
            const fields = [
                { key: 'name', value: entry.name },
                { key: 'sort_order', value: String(entry.sort_order) },
            ];

            // Add badge_label for sponsor_tier
            if (entry.badge_label) {
                fields.push({ key: 'badge_label', value: entry.badge_label });
            }

            try {
                const result = await graphqlRequest(CREATE_METAOBJECT_MUTATION, {
                    metaobject: {
                        type: group.type,
                        handle: entry.handle,
                        fields,
                        capabilities: {
                            publishable: {
                                status: 'ACTIVE',
                            },
                        },
                    },
                });

                const payload = result.data?.metaobjectCreate;

                if (payload?.userErrors?.length > 0) {
                    console.log(`  ⚠️  ${label}:`);
                    payload.userErrors.forEach((err) => {
                        console.log(`     [${err.code}] ${err.message}`);
                    });
                    errorCount++;
                } else if (payload?.metaobject) {
                    console.log(`  ✅ ${entry.name} (${payload.metaobject.handle})`);
                    successCount++;
                } else {
                    console.log(`  ❌ Unexpected response for ${label}`);
                    console.log(JSON.stringify(result, null, 2));
                    errorCount++;
                }
            } catch (err) {
                console.log(`  ❌ ${label}: ${err.message}`);
                errorCount++;
            }

            await new Promise((r) => setTimeout(r, 300));
        }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`🏁 Done! Success: ${successCount} | Errors: ${errorCount} | Total: ${totalEntries}`);
    console.log('='.repeat(60));
}

main().catch(console.error);
