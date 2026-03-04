/**
 * Fix remaining 3 definitions:
 * - Player Profile (needs club_team GID)
 * - Club Sponsor (needs sponsor_scope, sponsor_tier, player_profile GIDs)
 * - Membership Type (needs membership_category GID)
 * 
 * Chạy: node setup-remaining.js
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

async function getDefIds() {
    const result = await graphqlRequest(`
    query {
      metaobjectDefinitions(first: 50) {
        edges { node { id type } }
      }
    }
  `);
    const map = {};
    for (const e of (result.data?.metaobjectDefinitions?.edges || [])) {
        map[e.node.type] = e.node.id;
    }
    return map;
}

async function createDef(definition) {
    const result = await graphqlRequest(`
    mutation CreateMetaobjectDefinition($definition: MetaobjectDefinitionCreateInput!) {
      metaobjectDefinitionCreate(definition: $definition) {
        metaobjectDefinition { name type id }
        userErrors { field message code }
      }
    }
  `, { definition });
    return result;
}

async function main() {
    console.log('🔧 Creating remaining 3 definitions...\n');

    // Step 1: Get fresh GIDs
    let ids = await getDefIds();
    console.log('📋 Current definitions:', Object.keys(ids).join(', '));
    console.log('');

    // Step 2: Create Player Profile (needs club_team)
    console.log('--- [1/3] Player Profile ---');
    if (ids['player_profile']) {
        console.log('⏭️  Already exists, skipping\n');
    } else {
        const r = await createDef({
            name: 'Player Profile',
            type: 'player_profile',
            access: { storefront: 'PUBLIC_READ' },
            capabilities: { publishable: { enabled: true } },
            fieldDefinitions: [
                { name: 'Full Name', key: 'full_name', type: 'single_line_text_field' },
                { name: 'Preferred Name', key: 'preferred_name', type: 'single_line_text_field' },
                { name: 'Jersey Number', key: 'jersey_number', type: 'number_integer' },
                { name: 'Profile Photo', key: 'profile_photo', type: 'file_reference' },
                { name: 'Role or Position', key: 'role_position', type: 'single_line_text_field' },
                {
                    name: 'Team', key: 'team', type: 'metaobject_reference',
                    validations: [{ name: 'metaobject_definition_id', value: ids['club_team'] }],
                },
                { name: 'Bio Short', key: 'bio_short', type: 'multi_line_text_field' },
                { name: 'Bio Full', key: 'bio_full', type: 'rich_text_field' },
                { name: 'Height', key: 'height', type: 'single_line_text_field' },
                { name: 'PlayHQ Player Link', key: 'playhq_player_link', type: 'url' },
                { name: 'Featured Player', key: 'featured_player', type: 'boolean' },
                { name: 'Sort Order', key: 'sort_order', type: 'number_integer' },
            ],
        });
        const p = r.data?.metaobjectDefinitionCreate;
        if (p?.userErrors?.length) {
            console.log('⚠️', p.userErrors.map(e => `[${e.code}] ${e.message} (${e.field?.join('.')})`).join('\n   '));
        } else {
            console.log('✅ Created Player Profile');
            ids['player_profile'] = p.metaobjectDefinition.id;
        }
        console.log('');
        await new Promise(r => setTimeout(r, 500));
    }

    // Step 3: Refresh GIDs
    ids = await getDefIds();

    // Step 4: Create Club Sponsor (needs sponsor_scope, sponsor_tier, player_profile)
    console.log('--- [2/3] Club Sponsor ---');
    if (ids['club_sponsor']) {
        console.log('⏭️  Already exists, skipping\n');
    } else {
        const sponsorFields = [
            { name: 'Sponsor Name', key: 'sponsor_name', type: 'single_line_text_field' },
            { name: 'Logo', key: 'logo', type: 'file_reference' },
            { name: 'Website URL', key: 'website_url', type: 'url' },
            {
                name: 'Scope', key: 'scope', type: 'metaobject_reference',
                validations: [{ name: 'metaobject_definition_id', value: ids['sponsor_scope'] }],
            },
            {
                name: 'Tier', key: 'tier', type: 'metaobject_reference',
                validations: [{ name: 'metaobject_definition_id', value: ids['sponsor_tier'] }],
            },
            { name: 'Short Description', key: 'short_description', type: 'multi_line_text_field' },
            { name: 'CTA Label', key: 'cta_label', type: 'single_line_text_field' },
            { name: 'Sponsor Since', key: 'sponsor_since', type: 'date' },
            { name: 'Expiry Date', key: 'expiry_date', type: 'date' },
            { name: 'Sort Order', key: 'sort_order', type: 'number_integer' },
            { name: 'Featured', key: 'featured', type: 'boolean' },
        ];

        // Only add Sponsored Player reference if player_profile exists
        if (ids['player_profile']) {
            sponsorFields.splice(5, 0, {
                name: 'Sponsored Player', key: 'sponsored_player', type: 'metaobject_reference',
                validations: [{ name: 'metaobject_definition_id', value: ids['player_profile'] }],
            });
        } else {
            // Add without validation (any metaobject reference)
            sponsorFields.splice(5, 0, {
                name: 'Sponsored Player', key: 'sponsored_player', type: 'metaobject_reference',
            });
        }

        const r = await createDef({
            name: 'Club Sponsor',
            type: 'club_sponsor',
            access: { storefront: 'PUBLIC_READ' },
            capabilities: { publishable: { enabled: true } },
            fieldDefinitions: sponsorFields,
        });
        const p = r.data?.metaobjectDefinitionCreate;
        if (p?.userErrors?.length) {
            console.log('⚠️', p.userErrors.map(e => `[${e.code}] ${e.message} (${e.field?.join('.')})`).join('\n   '));
        } else {
            console.log('✅ Created Club Sponsor');
        }
        console.log('');
        await new Promise(r => setTimeout(r, 500));
    }

    // Step 5: Create Membership Type (needs membership_category)
    console.log('--- [3/3] Membership Type ---');
    if (ids['membership_type']) {
        console.log('⏭️  Already exists, skipping\n');
    } else {
        const r = await createDef({
            name: 'Membership Type',
            type: 'membership_type',
            access: { storefront: 'PUBLIC_READ' },
            capabilities: { publishable: { enabled: true } },
            fieldDefinitions: [
                { name: 'Title', key: 'title', type: 'single_line_text_field' },
                {
                    name: 'Category', key: 'category', type: 'metaobject_reference',
                    validations: [{ name: 'metaobject_definition_id', value: ids['membership_category'] }],
                },
                { name: 'Description', key: 'description', type: 'multi_line_text_field' },
                { name: 'Benefits', key: 'benefits', type: 'rich_text_field' },
                { name: 'Eligibility', key: 'eligibility', type: 'multi_line_text_field' },
                { name: 'Linked Product', key: 'linked_product', type: 'product_reference' },
                { name: 'Badge', key: 'badge', type: 'file_reference' },
                { name: 'Sort Order', key: 'sort_order', type: 'number_integer' },
            ],
        });
        const p = r.data?.metaobjectDefinitionCreate;
        if (p?.userErrors?.length) {
            console.log('⚠️', p.userErrors.map(e => `[${e.code}] ${e.message} (${e.field?.join('.')})`).join('\n   '));
        } else {
            console.log('✅ Created Membership Type');
        }
        console.log('');
    }

    // Final check
    const final = await getDefIds();
    console.log('='.repeat(60));
    console.log('📋 Final definitions in store:');
    for (const [type, id] of Object.entries(final)) {
        console.log(`   ✅ ${type}`);
    }
    console.log(`\n🏁 Total: ${Object.keys(final).length} definitions`);
}

main().catch(console.error);
