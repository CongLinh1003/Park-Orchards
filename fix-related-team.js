/**
 * Fix the last article metafield: event.related_team
 * Needs club_team GID for metaobject_reference validation.
 */
const STORE_URL = 'park-orchards-football-netball-club.myshopify.com';
const API_VERSION = '2024-10';
const GRAPHQL_URL = `https://${STORE_URL}/admin/api/${API_VERSION}/graphql.json`;

async function gql(query, variables = {}) {
    const res = await fetch(GRAPHQL_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': ACCESS_TOKEN },
        body: JSON.stringify({ query, variables }),
    });
    return await res.json();
}

async function main() {
    // Get club_team GID
    const r1 = await gql(`{ metaobjectDefinitions(first: 50) { edges { node { id type } } } }`);
    const teamId = r1.data.metaobjectDefinitions.edges.find(e => e.node.type === 'club_team')?.node?.id;
    console.log('club_team GID:', teamId);

    if (!teamId) { console.log('❌ club_team not found!'); return; }

    // Create event.related_team metafield with proper GID
    const r2 = await gql(`
    mutation CreateMetafieldDefinition($definition: MetafieldDefinitionInput!) {
      metafieldDefinitionCreate(definition: $definition) {
        createdDefinition { id name namespace key }
        userErrors { field message code }
      }
    }
  `, {
        definition: {
            name: 'Related Team',
            namespace: 'event',
            key: 'related_team',
            type: 'metaobject_reference',
            description: 'Reference to a Club Team metaobject',
            ownerType: 'ARTICLE',
            pin: true,
            validations: [{ name: 'metaobject_definition_id', value: teamId }],
        },
    });

    const p = r2.data?.metafieldDefinitionCreate;
    if (p?.userErrors?.length) {
        console.log('⚠️', p.userErrors.map(e => `[${e.code}] ${e.message}`).join('\n   '));
    } else if (p?.createdDefinition) {
        console.log(`✅ Created: ${p.createdDefinition.name} (${p.createdDefinition.namespace}.${p.createdDefinition.key})`);
    } else {
        console.log('❌ Unexpected:', JSON.stringify(r2, null, 2));
    }
}

main().catch(console.error);
