/**
 * Migrate club_sponsor.sponsored_player from single metaobject reference
 * to list.metaobject_reference using a reviewed merge-plan.json.
 *
 * Usage:
 *   node migrate-player-sponsor-relationships.js --input <path-to-merge-plan.json> --confirm-live
 *
 * Required environment variables:
 *   SHOPIFY_ADMIN_TOKEN
 *
 * Optional environment variables:
 *   SHOPIFY_STORE_URL
 *   SHOPIFY_API_VERSION
 */

const fs = require('fs');
const path = require('path');
const {
  describeUserErrors,
  ensureDir,
  getShopifyConfig,
  graphqlRequest,
  readJson,
  sleep,
  stableSortBy,
  timestampSlug,
  writeJson,
} = require('./shopify-admin-utils');
const {
  OUTPUT_ROOT,
  canonicalizeMergePlan,
  runAudit,
} = require('./audit-player-sponsor-relationships');

const GET_DEFINITION_QUERY = `
  query GetMetaobjectDefinitions {
    metaobjectDefinitions(first: 50) {
      edges {
        node {
          id
          type
          fieldDefinitions {
            key
            name
            required
            type {
              name
            }
            validations {
              name
              value
            }
          }
        }
      }
    }
  }
`;

const UPDATE_DEFINITION_MUTATION = `
  mutation UpdateMetaobjectDefinition($id: ID!, $definition: MetaobjectDefinitionUpdateInput!) {
    metaobjectDefinitionUpdate(id: $id, definition: $definition) {
      metaobjectDefinition {
        id
        type
        fieldDefinitions {
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

const UPDATE_METAOBJECT_MUTATION = `
  mutation UpdateMetaobject($id: ID!, $metaobject: MetaobjectUpdateInput!) {
    metaobjectUpdate(id: $id, metaobject: $metaobject) {
      metaobject {
        id
        handle
        capabilities {
          publishable {
            status
          }
        }
        field(key: "sponsored_player") {
          key
          type
          value
          jsonValue
          references(first: 100) {
            nodes {
              ... on Metaobject {
                id
                handle
              }
            }
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

function parseArgs(argv) {
  const args = {
    input: '',
    confirmLive: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === '--input') {
      args.input = argv[index + 1] || '';
      index += 1;
      continue;
    }

    if (token === '--confirm-live') {
      args.confirmLive = true;
    }
  }

  return args;
}

function assertArgs(args) {
  if (!args.input) {
    throw new Error('Missing --input <path-to-merge-plan.json>.');
  }

  if (!args.confirmLive) {
    throw new Error('This script is mutate-only. Re-run with --confirm-live when you are ready.');
  }
}

function loadReviewedArtifacts(inputPath) {
  const mergePlanPath = path.resolve(inputPath);
  if (!fs.existsSync(mergePlanPath)) {
    throw new Error(`merge-plan.json not found: ${mergePlanPath}`);
  }

  const artifactsDir = path.dirname(mergePlanPath);
  const conflictsPath = path.join(artifactsDir, 'conflicts.json');
  const mergePlan = readJson(mergePlanPath);
  const conflicts = fs.existsSync(conflictsPath) ? readJson(conflictsPath) : [];

  return {
    artifactsDir,
    mergePlanPath,
    conflictsPath,
    mergePlan,
    conflicts,
  };
}

function getDefinitionMap(definitions) {
  const map = new Map();
  for (const definition of definitions) {
    map.set(definition.type, definition);
  }
  return map;
}

async function fetchDefinitions(config) {
  const response = await graphqlRequest(config, GET_DEFINITION_QUERY);
  return (response.data?.metaobjectDefinitions?.edges || []).map((edge) => edge.node);
}

function getFieldDefinition(definition, key) {
  if (!definition) {
    return null;
  }

  return (definition.fieldDefinitions || []).find((field) => field.key === key) || null;
}

function assertCurrentDefinitionShape(clubSponsorDefinition, playerProfileDefinition) {
  if (!clubSponsorDefinition) {
    throw new Error('Could not find club_sponsor definition.');
  }

  if (!playerProfileDefinition) {
    throw new Error('Could not find player_profile definition.');
  }

  const sponsoredPlayerField = getFieldDefinition(clubSponsorDefinition, 'sponsored_player');
  if (!sponsoredPlayerField) {
    throw new Error('club_sponsor definition is missing sponsored_player.');
  }

  const currentType = sponsoredPlayerField.type?.name || '';
  if (currentType !== 'metaobject_reference') {
    throw new Error(
      `Expected sponsored_player to be metaobject_reference before migration, received ${currentType || '(blank)'}`
    );
  }
}

async function updateDefinitionToList(config, clubSponsorDefinition, playerProfileDefinition) {
  const response = await graphqlRequest(config, UPDATE_DEFINITION_MUTATION, {
    id: clubSponsorDefinition.id,
    definition: {
      fieldDefinitions: [
        {
          delete: {
            key: 'sponsored_player',
          },
        },
        {
          create: {
            key: 'sponsored_player',
            name: 'Sponsored Player',
            type: 'list.metaobject_reference',
            validations: [
              {
                name: 'metaobject_definition_id',
                value: playerProfileDefinition.id,
              },
            ],
          },
        },
      ],
    },
  });

  const payload = response.data?.metaobjectDefinitionUpdate;
  if (payload?.userErrors?.length > 0) {
    throw new Error(`Failed to update definition: ${describeUserErrors(payload.userErrors)}`);
  }

  return payload?.metaobjectDefinition || null;
}

async function updateSponsorPlayers(config, sponsorId, playerIds) {
  const response = await graphqlRequest(config, UPDATE_METAOBJECT_MUTATION, {
    id: sponsorId,
    metaobject: {
      fields: [
        {
          key: 'sponsored_player',
          value: JSON.stringify(playerIds),
        },
      ],
    },
  });

  const payload = response.data?.metaobjectUpdate;
  if (payload?.userErrors?.length > 0) {
    throw new Error(`Failed to update sponsor ${sponsorId}: ${describeUserErrors(payload.userErrors)}`);
  }

  return payload?.metaobject || null;
}

async function draftSponsor(config, sponsorId) {
  const response = await graphqlRequest(config, UPDATE_METAOBJECT_MUTATION, {
    id: sponsorId,
    metaobject: {
      capabilities: {
        publishable: {
          status: 'DRAFT',
        },
      },
    },
  });

  const payload = response.data?.metaobjectUpdate;
  if (payload?.userErrors?.length > 0) {
    throw new Error(`Failed to draft sponsor ${sponsorId}: ${describeUserErrors(payload.userErrors)}`);
  }

  return payload?.metaobject || null;
}

function buildPostMigrationAudit(definition, report) {
  const sponsorToPlayers = Object.values(report.sponsorToPlayers)
    .filter((entry) => entry.players.length > 0)
    .map((entry) => ({
      sponsor: entry.sponsor,
      players: entry.players,
    }));

  return {
    generatedAt: new Date().toISOString(),
    definition: {
      id: definition?.id || null,
      type: definition?.type || 'club_sponsor',
      sponsoredPlayerType: getFieldDefinition(definition, 'sponsored_player')?.type?.name || null,
    },
    summary: report.summary,
    sponsorToPlayers,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  assertArgs(args);

  const reviewed = loadReviewedArtifacts(args.input);
  if ((reviewed.conflicts || []).length > 0) {
    throw new Error(
      `Reviewed artifacts still contain conflicts (${reviewed.conflicts.length}). Resolve them before migration.`
    );
  }

  const config = getShopifyConfig();
  const migrationDir = path.join(OUTPUT_ROOT, `migration-${timestampSlug()}`);
  ensureDir(migrationDir);

  console.log('Running fresh pre-migration audit...');
  const preflightAuditDir = path.join(migrationDir, 'pre-mutation-audit');
  const preflight = await runAudit({
    config,
    outputDir: preflightAuditDir,
    label: 'pre-mutation',
    writeArtifacts: true,
  });

  if ((preflight.report.conflicts || []).length > 0) {
    throw new Error(
      `Fresh audit found ${preflight.report.conflicts.length} conflicts. Review ${path.join(preflightAuditDir, 'conflicts.json')}`
    );
  }

  if (canonicalizeMergePlan(reviewed.mergePlan) !== canonicalizeMergePlan(preflight.report.mergePlan)) {
    throw new Error(
      'Fresh audit does not match the reviewed merge-plan. Abort to avoid migrating against stale data.'
    );
  }

  console.log('Verifying current definition shape...');
  const definitions = await fetchDefinitions(config);
  const definitionMap = getDefinitionMap(definitions);
  const clubSponsorDefinition = definitionMap.get('club_sponsor');
  const playerProfileDefinition = definitionMap.get('player_profile');
  assertCurrentDefinitionShape(clubSponsorDefinition, playerProfileDefinition);

  console.log('Switching club_sponsor.sponsored_player to list.metaobject_reference...');
  const updatedDefinition = await updateDefinitionToList(config, clubSponsorDefinition, playerProfileDefinition);

  const applyResult = {
    generatedAt: new Date().toISOString(),
    migrationDir,
    inputMergePlanPath: reviewed.mergePlanPath,
    preMutationAuditDir: preflightAuditDir,
    definitionUpdated: {
      before: 'metaobject_reference',
      after: getFieldDefinition(updatedDefinition, 'sponsored_player')?.type?.name || null,
    },
    survivorUpdates: [],
    draftedDuplicates: [],
  };

  console.log('Writing merged player lists to survivor sponsors...');
  for (const group of preflight.report.mergePlan.groups || []) {
    const survivor = await updateSponsorPlayers(config, group.survivorSponsorId, group.mergedPlayerIds);
    applyResult.survivorUpdates.push({
      sponsorId: group.survivorSponsorId,
      sponsorHandle: group.survivorSponsorHandle,
      mergedPlayerIds: stableSortBy(group.mergedPlayerIds || [], (value) => value),
      resultingFieldType: survivor?.field?.type || null,
      resultingPlayerIds: stableSortBy(
        (survivor?.field?.references?.nodes || []).map((node) => node.id),
        (value) => value
      ),
    });
    await sleep(150);
  }

  console.log('Drafting duplicate sponsor records...');
  for (const group of preflight.report.mergePlan.groups || []) {
    for (const duplicateSponsorId of group.duplicateSponsorIds || []) {
      const drafted = await draftSponsor(config, duplicateSponsorId);
      applyResult.draftedDuplicates.push({
        sponsorId: duplicateSponsorId,
        publishableStatus: drafted?.capabilities?.publishable?.status || null,
      });
      await sleep(150);
    }
  }

  console.log('Running post-migration audit...');
  const postAudit = await runAudit({
    config,
    writeArtifacts: false,
  });

  const postDefinitions = await fetchDefinitions(config);
  const postDefinition = getDefinitionMap(postDefinitions).get('club_sponsor');

  writeJson(path.join(migrationDir, 'apply-result.json'), applyResult);
  writeJson(path.join(migrationDir, 'post-migration-audit.json'), buildPostMigrationAudit(postDefinition, postAudit.report));

  console.log(`Migration completed. Artifacts written to ${migrationDir}`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.message || error);
    process.exitCode = 1;
  });
}
