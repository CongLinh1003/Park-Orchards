/**
 * Shopify Article Metafield Definitions Setup Script
 * Park Orchards Football & Netball Club
 * 
 * Tạo article metafield definitions cho Event blog articles.
 * Chạy: node setup-article-metafields.js
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

// ============================================================
// Mutation for Metafield Definitions
// ============================================================

const CREATE_METAFIELD_DEFINITION_MUTATION = `
  mutation CreateMetafieldDefinition($definition: MetafieldDefinitionInput!) {
    metafieldDefinitionCreate(definition: $definition) {
      createdDefinition {
        id
        name
        namespace
        key
        type {
          name
        }
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
// Article Metafield Definitions for Events
// ============================================================

const NAMESPACE = 'event';
const OWNER_TYPE = 'ARTICLE';

const metafieldDefinitions = [
    {
        name: 'Event Start',
        key: 'start_datetime',
        type: 'date_time',
        description: 'Start date and time of the event',
    },
    {
        name: 'Event End',
        key: 'end_datetime',
        type: 'date_time',
        description: 'End date and time of the event',
    },
    {
        name: 'Venue',
        key: 'venue',
        type: 'single_line_text_field',
        description: 'Event venue or location name',
    },
    {
        name: 'External Link',
        key: 'external_link',
        type: 'url',
        description: 'External URL for event registration or info',
    },
    {
        name: 'Button Label',
        key: 'button_label',
        type: 'single_line_text_field',
        description: 'Label for the CTA button (e.g. Register Now, Buy Tickets)',
    },
    {
        name: 'Registration Deadline',
        key: 'registration_deadline',
        type: 'date_time',
        description: 'Last date/time to register for the event',
    },
    {
        name: 'Event Type',
        key: 'event_type',
        type: 'single_line_text_field',
        description: 'Type of event (e.g. Match Day, Fundraiser, Social)',
    },
    {
        name: 'Featured Event',
        key: 'featured',
        type: 'boolean',
        description: 'Whether this event is featured on the homepage',
    },
    {
        name: 'Related Team',
        key: 'related_team',
        type: 'metaobject_reference',
        description: 'Reference to a Club Team metaobject',
        validations: [
            {
                name: 'metaobject_definition_type',
                value: 'club_team',
            },
        ],
    },
];

// ============================================================
// Also create Product metafield definitions for Membership products
// ============================================================

const PRODUCT_OWNER = 'PRODUCT';
const MEMBERSHIP_NAMESPACE = 'membership';

const productMetafieldDefinitions = [
    {
        name: 'Season',
        namespace: MEMBERSHIP_NAMESPACE,
        key: 'season',
        type: 'single_line_text_field',
        description: 'Membership season (e.g. 2026)',
        ownerType: PRODUCT_OWNER,
    },
    {
        name: 'Eligibility',
        namespace: MEMBERSHIP_NAMESPACE,
        key: 'eligibility',
        type: 'multi_line_text_field',
        description: 'Who is eligible for this membership',
        ownerType: PRODUCT_OWNER,
    },
    {
        name: 'Benefit Summary',
        namespace: MEMBERSHIP_NAMESPACE,
        key: 'benefit_summary',
        type: 'rich_text_field',
        description: 'Summary of membership benefits',
        ownerType: PRODUCT_OWNER,
    },
    {
        name: 'Renewal Note',
        namespace: MEMBERSHIP_NAMESPACE,
        key: 'renewal_note',
        type: 'multi_line_text_field',
        description: 'Renewal instructions or notes',
        ownerType: PRODUCT_OWNER,
    },
];

// ============================================================
// Main Execution
// ============================================================

async function main() {
    console.log('🏈 Park Orchards FC & NC — Metafield Definitions Setup');
    console.log('='.repeat(60));

    let successCount = 0;
    let errorCount = 0;

    // --- Article metafields for Events ---
    console.log('\n📝 Article Metafields (Events blog)');
    console.log('-'.repeat(40));

    for (const def of metafieldDefinitions) {
        const label = `${NAMESPACE}.${def.key}`;

        try {
            const input = {
                name: def.name,
                namespace: NAMESPACE,
                key: def.key,
                type: def.type,
                description: def.description,
                ownerType: OWNER_TYPE,
                pin: true,
            };

            if (def.validations) {
                input.validations = def.validations;
            }

            const result = await graphqlRequest(CREATE_METAFIELD_DEFINITION_MUTATION, {
                definition: input,
            });

            const payload = result.data?.metafieldDefinitionCreate;

            if (payload?.userErrors?.length > 0) {
                console.log(`  ⚠️  ${label}:`);
                payload.userErrors.forEach((err) => {
                    console.log(`     [${err.code}] ${err.message}`);
                });
                errorCount++;
            } else if (payload?.createdDefinition) {
                console.log(`  ✅ ${def.name} (${label})`);
                successCount++;
            } else {
                console.log(`  ❌ Unexpected: ${label}`);
                console.log(JSON.stringify(result, null, 2));
                errorCount++;
            }
        } catch (err) {
            console.log(`  ❌ ${label}: ${err.message}`);
            errorCount++;
        }

        await new Promise((r) => setTimeout(r, 300));
    }

    // --- Product metafields for Membership ---
    console.log('\n📦 Product Metafields (Membership products)');
    console.log('-'.repeat(40));

    for (const def of productMetafieldDefinitions) {
        const label = `${def.namespace}.${def.key}`;

        try {
            const input = {
                name: def.name,
                namespace: def.namespace,
                key: def.key,
                type: def.type,
                description: def.description,
                ownerType: def.ownerType,
                pin: true,
            };

            const result = await graphqlRequest(CREATE_METAFIELD_DEFINITION_MUTATION, {
                definition: input,
            });

            const payload = result.data?.metafieldDefinitionCreate;

            if (payload?.userErrors?.length > 0) {
                console.log(`  ⚠️  ${label}:`);
                payload.userErrors.forEach((err) => {
                    console.log(`     [${err.code}] ${err.message}`);
                });
                errorCount++;
            } else if (payload?.createdDefinition) {
                console.log(`  ✅ ${def.name} (${label})`);
                successCount++;
            } else {
                console.log(`  ❌ Unexpected: ${label}`);
                console.log(JSON.stringify(result, null, 2));
                errorCount++;
            }
        } catch (err) {
            console.log(`  ❌ ${label}: ${err.message}`);
            errorCount++;
        }

        await new Promise((r) => setTimeout(r, 300));
    }

    console.log('\n' + '='.repeat(60));
    console.log(`🏁 Done! Success: ${successCount} | Errors: ${errorCount}`);
    console.log('='.repeat(60));
}

main().catch(console.error);
