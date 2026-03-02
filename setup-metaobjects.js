/**
 * Shopify Metaobject Definitions Setup Script — PHASE 2+3
 * Park Orchards Football & Netball Club
 * 
 * Tạo 5 definitions còn lại (terms đã tạo thành công rồi).
 * Chạy: node setup-metaobjects.js
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

  const json = await response.json();
  return json;
}

const CREATE_DEFINITION_MUTATION = `
  mutation CreateMetaobjectDefinition($definition: MetaobjectDefinitionCreateInput!) {
    metaobjectDefinitionCreate(definition: $definition) {
      metaobjectDefinition {
        name
        type
        fieldDefinitions {
          name
          key
          type {
            name
          }
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
// Remaining 5 definitions (terms already created)
// ============================================================

const definitions = [
  // 8. Club Team
  {
    name: 'Club Team',
    type: 'club_team',
    access: {
      storefront: 'PUBLIC_READ',
    },
    capabilities: {
      publishable: {
        enabled: true,
      },
    },
    fieldDefinitions: [
      {
        name: 'Team Name',
        key: 'team_name',
        type: 'single_line_text_field',
      },
      {
        name: 'Sport',
        key: 'sport',
        type: 'metaobject_reference',
        validations: [
          {
            name: 'metaobject_definition_id',
            value: 'club_sport',
          },
        ],
      },
      {
        name: 'Division',
        key: 'division',
        type: 'metaobject_reference',
        validations: [
          {
            name: 'metaobject_definition_id',
            value: 'club_division',
          },
        ],
      },
      {
        name: 'Grade',
        key: 'grade',
        type: 'metaobject_reference',
        validations: [
          {
            name: 'metaobject_definition_id',
            value: 'club_grade',
          },
        ],
      },
      {
        name: 'Season Label',
        key: 'season_label',
        type: 'single_line_text_field',
      },
      {
        name: 'PlayHQ Link',
        key: 'playhq_link',
        type: 'url',
      },
      {
        name: 'Team Image',
        key: 'team_image',
        type: 'file_reference',
      },
      {
        name: 'Sort Order',
        key: 'sort_order',
        type: 'number_integer',
      },
      {
        name: 'Featured',
        key: 'featured',
        type: 'boolean',
      },
    ],
  },

  // 9. Player Profile
  {
    name: 'Player Profile',
    type: 'player_profile',
    access: {
      storefront: 'PUBLIC_READ',
    },
    capabilities: {
      publishable: {
        enabled: true,
      },
    },
    fieldDefinitions: [
      {
        name: 'Full Name',
        key: 'full_name',
        type: 'single_line_text_field',
      },
      {
        name: 'Preferred Name',
        key: 'preferred_name',
        type: 'single_line_text_field',
      },
      {
        name: 'Jersey Number',
        key: 'jersey_number',
        type: 'number_integer',
      },
      {
        name: 'Profile Photo',
        key: 'profile_photo',
        type: 'file_reference',
      },
      {
        name: 'Role or Position',
        key: 'role_position',
        type: 'single_line_text_field',
      },
      {
        name: 'Team',
        key: 'team',
        type: 'metaobject_reference',
        validations: [
          {
            name: 'metaobject_definition_id',
            value: 'club_team',
          },
        ],
      },
      {
        name: 'Bio Short',
        key: 'bio_short',
        type: 'multi_line_text_field',
      },
      {
        name: 'Bio Full',
        key: 'bio_full',
        type: 'rich_text_field',
      },
      {
        name: 'Height',
        key: 'height',
        type: 'single_line_text_field',
      },
      {
        name: 'PlayHQ Player Link',
        key: 'playhq_player_link',
        type: 'url',
      },
      {
        name: 'Featured Player',
        key: 'featured_player',
        type: 'boolean',
      },
      {
        name: 'Sort Order',
        key: 'sort_order',
        type: 'number_integer',
      },
    ],
  },

  // 10. Club Sponsor
  {
    name: 'Club Sponsor',
    type: 'club_sponsor',
    access: {
      storefront: 'PUBLIC_READ',
    },
    capabilities: {
      publishable: {
        enabled: true,
      },
    },
    fieldDefinitions: [
      {
        name: 'Sponsor Name',
        key: 'sponsor_name',
        type: 'single_line_text_field',
      },
      {
        name: 'Logo',
        key: 'logo',
        type: 'file_reference',
      },
      {
        name: 'Website URL',
        key: 'website_url',
        type: 'url',
      },
      {
        name: 'Scope',
        key: 'scope',
        type: 'metaobject_reference',
        validations: [
          {
            name: 'metaobject_definition_id',
            value: 'sponsor_scope',
          },
        ],
      },
      {
        name: 'Tier',
        key: 'tier',
        type: 'metaobject_reference',
        validations: [
          {
            name: 'metaobject_definition_id',
            value: 'sponsor_tier',
          },
        ],
      },
      {
        name: 'Sponsored Player',
        key: 'sponsored_player',
        type: 'metaobject_reference',
        validations: [
          {
            name: 'metaobject_definition_id',
            value: 'player_profile',
          },
        ],
      },
      {
        name: 'Short Description',
        key: 'short_description',
        type: 'multi_line_text_field',
      },
      {
        name: 'CTA Label',
        key: 'cta_label',
        type: 'single_line_text_field',
      },
      {
        name: 'Sponsor Since',
        key: 'sponsor_since',
        type: 'date',
      },
      {
        name: 'Expiry Date',
        key: 'expiry_date',
        type: 'date',
      },
      {
        name: 'Sort Order',
        key: 'sort_order',
        type: 'number_integer',
      },
      {
        name: 'Featured',
        key: 'featured',
        type: 'boolean',
      },
    ],
  },

  // 11. Club Person
  {
    name: 'Club Person',
    type: 'club_person',
    access: {
      storefront: 'PUBLIC_READ',
    },
    capabilities: {
      publishable: {
        enabled: true,
      },
    },
    fieldDefinitions: [
      {
        name: 'Full Name',
        key: 'full_name',
        type: 'single_line_text_field',
      },
      {
        name: 'Photo',
        key: 'photo',
        type: 'file_reference',
      },
      {
        name: 'Role Title',
        key: 'role_title',
        type: 'single_line_text_field',
      },
      {
        name: 'Group',
        key: 'group',
        type: 'metaobject_reference',
        validations: [
          {
            name: 'metaobject_definition_id',
            value: 'club_people_group',
          },
        ],
      },
      {
        name: 'Sub Group',
        key: 'sub_group',
        type: 'single_line_text_field',
      },
      {
        name: 'Bio Short',
        key: 'bio_short',
        type: 'multi_line_text_field',
      },
      {
        name: 'Contact Note',
        key: 'contact_note',
        type: 'single_line_text_field',
      },
      {
        name: 'Sort Order',
        key: 'sort_order',
        type: 'number_integer',
      },
      {
        name: 'Featured',
        key: 'featured',
        type: 'boolean',
      },
    ],
  },

  // 12. Membership Type
  {
    name: 'Membership Type',
    type: 'membership_type',
    access: {
      storefront: 'PUBLIC_READ',
    },
    capabilities: {
      publishable: {
        enabled: true,
      },
    },
    fieldDefinitions: [
      {
        name: 'Title',
        key: 'title',
        type: 'single_line_text_field',
      },
      {
        name: 'Category',
        key: 'category',
        type: 'metaobject_reference',
        validations: [
          {
            name: 'metaobject_definition_type',
            value: 'membership_category',
          },
        ],
      },
      {
        name: 'Description',
        key: 'description',
        type: 'multi_line_text_field',
      },
      {
        name: 'Benefits',
        key: 'benefits',
        type: 'rich_text_field',
      },
      {
        name: 'Eligibility',
        key: 'eligibility',
        type: 'multi_line_text_field',
      },
      {
        name: 'Linked Product',
        key: 'linked_product',
        type: 'product_reference',
      },
      {
        name: 'Badge',
        key: 'badge',
        type: 'file_reference',
      },
      {
        name: 'Sort Order',
        key: 'sort_order',
        type: 'number_integer',
      },
    ],
  },
];

// ============================================================
// Main — first try to get metaobject definition IDs for reference validation
// ============================================================

const GET_DEFINITIONS_QUERY = `
  query {
    metaobjectDefinitions(first: 50) {
      edges {
        node {
          id
          type
        }
      }
    }
  }
`;

async function getDefinitionIdMap() {
  const result = await graphqlRequest(GET_DEFINITIONS_QUERY);
  const map = {};
  const edges = result.data?.metaobjectDefinitions?.edges || [];
  for (const edge of edges) {
    map[edge.node.type] = edge.node.id;
  }
  return map;
}

async function main() {
  console.log('🏈 Park Orchards FC & NC — Metaobject Definitions Setup (Phase 2+3)');
  console.log('='.repeat(60));

  // Step 1: Get existing definition IDs for reference validation
  console.log('📋 Fetching existing metaobject definition IDs...');
  const defIdMap = await getDefinitionIdMap();
  console.log(`   Found ${Object.keys(defIdMap).length} existing definitions:`);
  for (const [type, id] of Object.entries(defIdMap)) {
    console.log(`   - ${type}: ${id}`);
  }
  console.log('');

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < definitions.length; i++) {
    const def = JSON.parse(JSON.stringify(definitions[i])); // deep clone
    const label = `[${i + 1}/${definitions.length}] ${def.name} (${def.type})`;

    // Replace metaobject_definition_type validation values with actual GIDs
    for (const field of def.fieldDefinitions) {
      if (field.validations) {
        for (const validation of field.validations) {
          if (validation.name === 'metaobject_definition_id') {
            const typeStr = validation.value;
            if (defIdMap[typeStr]) {
              validation.value = defIdMap[typeStr];
              console.log(`   🔗 ${field.key}: ${typeStr} → ${defIdMap[typeStr]}`);
            } else {
              console.log(`   ⚠️  ${field.key}: definition "${typeStr}" not found yet — will try without validation`);
              // Remove validation since the referenced type doesn't exist yet
              field.validations = [];
            }
          }
        }
        // Clean up empty validations
        if (field.validations.length === 0) {
          delete field.validations;
        }
      }
    }

    try {
      console.log(`⏳ Creating: ${label}...`);

      const result = await graphqlRequest(CREATE_DEFINITION_MUTATION, {
        definition: def,
      });

      const payload = result.data?.metaobjectDefinitionCreate;

      if (payload?.userErrors?.length > 0) {
        console.log(`⚠️  Errors for ${label}:`);
        payload.userErrors.forEach((err) => {
          console.log(`   - [${err.code}] ${err.message} (field: ${err.field?.join('.')})`);
        });
        errorCount++;
      } else if (payload?.metaobjectDefinition) {
        const created = payload.metaobjectDefinition;
        const fieldCount = created.fieldDefinitions.length;
        console.log(`✅ Created: ${created.name} — ${fieldCount} fields`);
        successCount++;

        // Update the map with the newly created definition
        defIdMap[created.type] = `created-${created.type}`;
      } else {
        console.log(`❌ Unexpected response for ${label}:`);
        console.log(JSON.stringify(result, null, 2));
        errorCount++;
      }
    } catch (err) {
      console.log(`❌ Failed: ${label} — ${err.message}`);
      errorCount++;
    }

    await new Promise((r) => setTimeout(r, 500));
  }

  console.log('');
  console.log('='.repeat(60));
  console.log(`🏁 Done! Success: ${successCount} | Errors: ${errorCount}`);
  console.log('='.repeat(60));
}

main().catch(console.error);
