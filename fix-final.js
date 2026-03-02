/**
 * Fix: Query full definition list + fix sponsor_tier + add tier field to club_sponsor
 * Chạy: node fix-final.js
 */

const STORE_URL = 'park-orchards-football-netball-club.myshopify.com';
const API_VERSION = '2024-10';
const GRAPHQL_URL = `https://${STORE_URL}/admin/api/${API_VERSION}/graphql.json`;

async function gql(query, variables = {}) {
  const res = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': ACCESS_TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });
  return await res.json();
}

async function main() {
  // 1. Get ALL definitions (check pagination)
  console.log('📋 Step 1: Query all definitions...\n');
  const r1 = await gql(`
    query {
      metaobjectDefinitions(first: 50) {
        edges {
          node {
            id
            type
            name
            fieldDefinitions { name key type { name } }
          }
        }
        pageInfo { hasNextPage }
      }
    }
  `);

  const defs = {};
  for (const edge of r1.data.metaobjectDefinitions.edges) {
    defs[edge.node.type] = edge.node;
    console.log(`   ${edge.node.type} (${edge.node.name}) - ${edge.node.fieldDefinitions.length} fields`);
  }
  console.log(`\n   Total: ${Object.keys(defs).length}`);
  console.log(`   Has next page: ${r1.data.metaobjectDefinitions.pageInfo.hasNextPage}`);

  // 2. Check sponsor_tier status
  console.log('\n📋 Step 2: Check sponsor_tier...');
  if (defs['sponsor_tier']) {
    console.log(`   ✅ sponsor_tier exists with fields:`);
    for (const f of defs['sponsor_tier'].fieldDefinitions) {
      console.log(`      - ${f.key} (${f.type.name})`);
    }
  } else {
    console.log('   ❌ sponsor_tier NOT found in definitions!');
    console.log('   Creating sponsor_tier definition...');

    const r = await gql(`
      mutation CreateMetaobjectDefinition($definition: MetaobjectDefinitionCreateInput!) {
        metaobjectDefinitionCreate(definition: $definition) {
          metaobjectDefinition { id name type }
          userErrors { field message code }
        }
      }
    `, {
      definition: {
        name: 'Sponsor Tier',
        type: 'sponsor_tier',
        access: { storefront: 'PUBLIC_READ' },
        capabilities: { publishable: { enabled: true } },
        fieldDefinitions: [
          { name: 'Name', key: 'name', type: 'single_line_text_field' },
          { name: 'Sort Order', key: 'sort_order', type: 'number_integer' },
          { name: 'Badge Label', key: 'badge_label', type: 'single_line_text_field' },
        ],
      },
    });

    const p = r.data?.metaobjectDefinitionCreate;
    if (p?.userErrors?.length) {
      console.log('   ⚠️ Errors:', p.userErrors.map(e => e.message).join(', '));

      // If TAKEN, it exists but isn't showing — let's try by ID
      console.log('\n   Trying to query by GID directly...');
      const r2 = await gql(`
        query {
          metaobjectDefinitionByType(type: "sponsor_tier") {
            id
            name
            type
            fieldDefinitions { name key type { name } }
          }
        }
      `);
      console.log('   Direct query result:', JSON.stringify(r2.data, null, 2));
    } else if (p?.metaobjectDefinition) {
      console.log(`   ✅ Created: ${p.metaobjectDefinition.name} (${p.metaobjectDefinition.id})`);
      defs['sponsor_tier'] = { id: p.metaobjectDefinition.id };
    }
  }

  // 3. Check club_sponsor — add tier field if missing
  console.log('\n📋 Step 3: Check club_sponsor tier field...');
  if (defs['club_sponsor']) {
    const hasTier = defs['club_sponsor'].fieldDefinitions.some(f => f.key === 'tier');
    if (hasTier) {
      console.log('   ✅ tier field already exists');
    } else {
      console.log('   ❌ tier field missing, adding it...');

      // Refresh sponsor_tier GID
      const allDefs = await gql(`
        query {
          metaobjectDefinitions(first: 50) {
            edges { node { id type } }
          }
        }
      `);
      const tierDefId = allDefs.data.metaobjectDefinitions.edges.find(
        e => e.node.type === 'sponsor_tier'
      )?.node?.id;

      if (tierDefId) {
        const r = await gql(`
          mutation UpdateMetaobjectDefinition($id: ID!, $definition: MetaobjectDefinitionUpdateInput!) {
            metaobjectDefinitionUpdate(id: $id, definition: $definition) {
              metaobjectDefinition { name fieldDefinitions { name key } }
              userErrors { field message code }
            }
          }
        `, {
          id: defs['club_sponsor'].id,
          definition: {
            fieldDefinitions: [
              {
                create: {
                  name: 'Tier',
                  key: 'tier',
                  type: 'metaobject_reference',
                  validations: [{
                    name: 'metaobject_definition_id',
                    value: tierDefId,
                  }],
                },
              },
            ],
          },
        });
        const p = r.data?.metaobjectDefinitionUpdate;
        if (p?.userErrors?.length) {
          console.log('   ⚠️', p.userErrors.map(e => e.message).join(', '));
        } else {
          console.log('   ✅ Tier field added to Club Sponsor');
        }
      } else {
        console.log('   ❌ Cannot find sponsor_tier GID to reference');
      }
    }
  }

  // 4. Create sponsor_tier entries if definition now exists
  console.log('\n📋 Step 4: Create sponsor_tier entries...');

  // Re-check definitions
  const finalDefs = await gql(`
    query {
      metaobjectDefinitions(first: 50) {
        edges {
          node {
            id
            type
            fieldDefinitions { key }
          }
        }
      }
    }
  `);

  const tierDef = finalDefs.data.metaobjectDefinitions.edges.find(
    e => e.node.type === 'sponsor_tier'
  );

  if (tierDef) {
    const fieldKeys = tierDef.node.fieldDefinitions.map(f => f.key);
    console.log(`   sponsor_tier fields: ${fieldKeys.join(', ')}`);

    const entries = [
      { handle: 'gold', name: 'Gold', sort_order: '1', badge_label: 'Gold' },
      { handle: 'silver', name: 'Silver', sort_order: '2', badge_label: 'Silver' },
      { handle: 'jumper', name: 'Jumper', sort_order: '3', badge_label: 'Jumper' },
      { handle: 'community-partner', name: 'Community Partner', sort_order: '4', badge_label: 'Community Partner' },
    ];

    for (const entry of entries) {
      const fields = [];
      for (const key of fieldKeys) {
        if (entry[key] !== undefined) {
          fields.push({ key, value: String(entry[key]) });
        }
      }

      const r = await gql(`
        mutation CreateMetaobject($metaobject: MetaobjectCreateInput!) {
          metaobjectCreate(metaobject: $metaobject) {
            metaobject { handle }
            userErrors { field message code }
          }
        }
      `, {
        metaobject: {
          type: 'sponsor_tier',
          handle: entry.handle,
          fields: fields.length > 0 ? fields : undefined,
          capabilities: { publishable: { status: 'ACTIVE' } },
        },
      });

      const p = r.data?.metaobjectCreate;
      if (p?.userErrors?.length) {
        console.log(`   ⚠️  ${entry.name}: ${p.userErrors.map(e => `[${e.code}] ${e.message}`).join(', ')}`);
      } else {
        console.log(`   ✅ ${entry.name}`);
      }
      await new Promise(r => setTimeout(r, 300));
    }
  } else {
    console.log('   ❌ sponsor_tier still not found');
  }

  // Final summary
  console.log('\n' + '='.repeat(60));
  console.log('📋 Final state:');
  const finalAll = await gql(`
    query {
      metaobjectDefinitions(first: 50) {
        edges { node { type name fieldDefinitions { key } } }
      }
    }
  `);
  for (const e of finalAll.data.metaobjectDefinitions.edges) {
    console.log(`   ✅ ${e.node.type} (${e.node.name}) — ${e.node.fieldDefinitions.length} fields`);
  }
}

main().catch(console.error);
