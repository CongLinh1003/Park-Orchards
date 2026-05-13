/**
 * Audit current sponsor -> player relationships without mutating Shopify.
 *
 * Usage:
 *   node audit-player-sponsor-relationships.js
 *
 * Required environment variables:
 *   SHOPIFY_ADMIN_TOKEN
 *
 * Optional environment variables:
 *   SHOPIFY_STORE_URL
 *   SHOPIFY_API_VERSION
 */

const path = require('path');
const {
  ensureDir,
  getShopifyConfig,
  graphqlRequest,
  normalizeWhitespace,
  safeUrlParse,
  sleep,
  stableSortBy,
  timestampSlug,
  writeJson,
  writeText,
} = require('./shopify-admin-utils');

const OUTPUT_ROOT = path.join(__dirname, 'shopify-relationship-backups');
const PAGE_SIZE = 50;

const METAOBJECT_PAGE_QUERY = `
  query GetMetaobjectsPage($type: String!, $first: Int!, $after: String) {
    metaobjects(type: $type, first: $first, after: $after) {
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        node {
          id
          handle
          type
          displayName
          capabilities {
            publishable {
              status
            }
          }
          fields {
            key
            type
            value
            jsonValue
            reference {
              __typename
              ... on Metaobject {
                id
                handle
                type
                displayName
              }
              ... on MediaImage {
                id
                image {
                  url
                }
              }
              ... on GenericFile {
                id
                url
              }
            }
            references(first: 100) {
              nodes {
                __typename
                ... on Metaobject {
                  id
                  handle
                  type
                  displayName
                }
                ... on MediaImage {
                  id
                  image {
                    url
                  }
                }
                ... on GenericFile {
                  id
                  url
                }
              }
            }
            thumbnail {
              file {
                __typename
                ... on MediaImage {
                  id
                  image {
                    url
                  }
                }
                ... on GenericFile {
                  id
                  url
                }
              }
            }
          }
        }
      }
    }
  }
`;

function fieldIndex(metaobject) {
  const index = {};

  for (const field of metaobject.fields || []) {
    index[field.key] = field;
  }

  return index;
}

function metaobjectSummary(value) {
  if (!value) {
    return null;
  }

  return {
    id: value.id || null,
    handle: value.handle || null,
    type: value.type || value.__typename || null,
    displayName: value.displayName || null,
  };
}

function normalizeUrl(value) {
  const url = safeUrlParse(value);
  if (!url) {
    return '';
  }

  const hostname = url.hostname.toLowerCase();
  let pathname = url.pathname || '/';

  pathname = pathname.replace(/\/+$/, '') || '/';
  if (!pathname.startsWith('/')) {
    pathname = `/${pathname}`;
  }

  return `${hostname}${pathname}`;
}

function normalizeSponsorName(value) {
  return normalizeWhitespace(value).toLowerCase();
}

function extractMetaobjectRefs(field) {
  if (!field) {
    return [];
  }

  const refs = [];

  if (field.reference && field.reference.__typename === 'Metaobject') {
    refs.push(field.reference);
  }

  const listNodes = field.references?.nodes || [];
  for (const node of listNodes) {
    if (node && node.__typename === 'Metaobject') {
      refs.push(node);
    }
  }

  const seen = new Set();
  return refs.filter((item) => {
    if (!item?.id || seen.has(item.id)) {
      return false;
    }

    seen.add(item.id);
    return true;
  });
}

function fileSummary(field) {
  if (!field) {
    return {
      gid: null,
      url: null,
      normalizedUrl: null,
    };
  }

  const sources = [];
  if (field.value) {
    sources.push({ gid: field.value, url: null });
  }

  if (field.reference && field.reference.id) {
    sources.push({
      gid: field.reference.id,
      url: field.reference.image?.url || field.reference.url || null,
    });
  }

  if (field.thumbnail?.file?.id) {
    sources.push({
      gid: field.thumbnail.file.id,
      url: field.thumbnail.file.image?.url || field.thumbnail.file.url || null,
    });
  }

  const gid = sources.find((item) => item.gid)?.gid || null;
  const url = sources.find((item) => item.url)?.url || null;

  return {
    gid,
    url,
    normalizedUrl: normalizeUrl(url),
  };
}

function sanitizeField(field) {
  return {
    key: field.key,
    type: field.type,
    value: field.value,
    jsonValue: field.jsonValue ?? null,
    reference: metaobjectSummary(field.reference),
    references: extractMetaobjectRefs(field).map(metaobjectSummary),
    file: fileSummary(field),
  };
}

function parseInteger(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const parsed = Number.parseInt(String(value), 10);
  return Number.isNaN(parsed) ? null : parsed;
}

function buildPlayerRecord(node) {
  const fields = fieldIndex(node);
  const teamRef = extractMetaobjectRefs(fields.team)[0] || null;

  return {
    id: node.id,
    handle: node.handle,
    displayName: node.displayName,
    status: node.capabilities?.publishable?.status || null,
    fullName: fields.full_name?.value || node.displayName,
    preferredName: fields.preferred_name?.value || null,
    team: metaobjectSummary(teamRef),
    sortOrder: parseInteger(fields.sort_order?.value),
    fields: stableSortBy((node.fields || []).map(sanitizeField), (field) => field.key),
  };
}

function buildSponsorRecord(node) {
  const fields = fieldIndex(node);
  const scopeRef = extractMetaobjectRefs(fields.scope)[0] || null;
  const tierRef = extractMetaobjectRefs(fields.tier)[0] || null;
  const sponsoredPlayers = extractMetaobjectRefs(fields.sponsored_player).map(metaobjectSummary);
  const logo = fileSummary(fields.logo);
  const websiteUrl = normalizeWhitespace(fields.website_url?.value || '');
  const normalizedName = normalizeSponsorName(fields.sponsor_name?.value || node.displayName);
  const normalizedWebsiteUrl = normalizeUrl(websiteUrl);
  const normalizedLogoKey = logo.gid || logo.normalizedUrl || '';
  const completenessCount = [
    fields.short_description?.value,
    fields.cta_label?.value,
    fields.sort_order?.value,
    fields.sponsor_since?.value,
    fields.expiry_date?.value,
  ].filter((value) => normalizeWhitespace(value)).length;

  return {
    id: node.id,
    handle: node.handle,
    displayName: node.displayName,
    status: node.capabilities?.publishable?.status || null,
    sponsorName: fields.sponsor_name?.value || node.displayName,
    websiteUrl: websiteUrl || null,
    normalizedWebsiteUrl,
    logo,
    scope: metaobjectSummary(scopeRef),
    tier: metaobjectSummary(tierRef),
    sponsoredPlayers,
    sponsoredPlayerIds: sponsoredPlayers.map((player) => player.id),
    normalizedName,
    normalizedLogoKey,
    mergeVariantKey: `${normalizedName}||${normalizedWebsiteUrl || '(blank)'}||${normalizedLogoKey || '(blank)'}`,
    sortOrder: parseInteger(fields.sort_order?.value),
    completenessCount,
    fields: stableSortBy((node.fields || []).map(sanitizeField), (field) => field.key),
  };
}

function survivorComparator(left, right) {
  const leftHasLogo = left.logo.gid || left.logo.normalizedUrl ? 1 : 0;
  const rightHasLogo = right.logo.gid || right.logo.normalizedUrl ? 1 : 0;
  if (leftHasLogo !== rightHasLogo) {
    return rightHasLogo - leftHasLogo;
  }

  const leftHasWebsite = left.normalizedWebsiteUrl ? 1 : 0;
  const rightHasWebsite = right.normalizedWebsiteUrl ? 1 : 0;
  if (leftHasWebsite !== rightHasWebsite) {
    return rightHasWebsite - leftHasWebsite;
  }

  const leftHasTier = left.tier?.id ? 1 : 0;
  const rightHasTier = right.tier?.id ? 1 : 0;
  if (leftHasTier !== rightHasTier) {
    return rightHasTier - leftHasTier;
  }

  if (left.completenessCount !== right.completenessCount) {
    return right.completenessCount - left.completenessCount;
  }

  const leftSortOrder = left.sortOrder === null ? Number.POSITIVE_INFINITY : left.sortOrder;
  const rightSortOrder = right.sortOrder === null ? Number.POSITIVE_INFINITY : right.sortOrder;
  if (leftSortOrder !== rightSortOrder) {
    return leftSortOrder - rightSortOrder;
  }

  return left.id.localeCompare(right.id);
}

function chooseSurvivor(sponsors) {
  return [...sponsors].sort(survivorComparator)[0] || null;
}

function buildRelations(players, sponsors) {
  const playersById = new Map(players.map((player) => [player.id, player]));

  const playerToSponsors = {};
  for (const player of players) {
    playerToSponsors[player.id] = {
      player: {
        id: player.id,
        handle: player.handle,
        fullName: player.fullName,
        team: player.team,
        status: player.status,
      },
      sponsors: [],
    };
  }

  const sponsorToPlayers = {};
  for (const sponsor of sponsors) {
    const playerRefs = sponsor.sponsoredPlayerIds
      .map((playerId) => playersById.get(playerId))
      .filter(Boolean);

    sponsorToPlayers[sponsor.id] = {
      sponsor: {
        id: sponsor.id,
        handle: sponsor.handle,
        sponsorName: sponsor.sponsorName,
        scope: sponsor.scope,
        status: sponsor.status,
      },
      players: playerRefs.map((player) => ({
        id: player.id,
        handle: player.handle,
        fullName: player.fullName,
        team: player.team,
      })),
    };

    for (const player of playerRefs) {
      if (!playerToSponsors[player.id]) {
        playerToSponsors[player.id] = {
          player: {
            id: player.id,
            handle: player.handle,
            fullName: player.fullName,
            team: player.team,
            status: player.status,
          },
          sponsors: [],
        };
      }

      playerToSponsors[player.id].sponsors.push({
        id: sponsor.id,
        handle: sponsor.handle,
        sponsorName: sponsor.sponsorName,
        scope: sponsor.scope,
        status: sponsor.status,
      });
    }
  }

  return { playerToSponsors, sponsorToPlayers };
}

function canonicalizeMergeGroup(group) {
  return {
    normalizedName: group.normalizedName,
    normalizedWebsiteUrl: group.normalizedWebsiteUrl,
    normalizedLogoKey: group.normalizedLogoKey,
    survivorSponsorId: group.survivorSponsorId,
    sourceSponsorIds: stableSortBy(group.sourceSponsorIds || [], (value) => value),
    duplicateSponsorIds: stableSortBy(group.duplicateSponsorIds || [], (value) => value),
    mergedPlayerIds: stableSortBy(group.mergedPlayerIds || [], (value) => value),
  };
}

function canonicalizeMergePlan(plan) {
  const groups = stableSortBy(
    (plan.groups || []).map(canonicalizeMergeGroup),
    (group) => JSON.stringify(group)
  );

  return JSON.stringify(groups);
}

function buildMergePlan(players, sponsors) {
  const playerSponsors = sponsors.filter((sponsor) => sponsor.scope?.handle === 'player-sponsor');
  const byName = new Map();

  for (const sponsor of playerSponsors) {
    const key = sponsor.normalizedName || '(blank)';
    if (!byName.has(key)) {
      byName.set(key, []);
    }
    byName.get(key).push(sponsor);
  }

  const conflicts = [];
  const groups = [];

  for (const [normalizedName, sponsorsByName] of byName.entries()) {
    const variants = new Map();

    for (const sponsor of sponsorsByName) {
      if (!variants.has(sponsor.mergeVariantKey)) {
        variants.set(sponsor.mergeVariantKey, []);
      }
      variants.get(sponsor.mergeVariantKey).push(sponsor);
    }

    if (variants.size > 1) {
      conflicts.push({
        conflictType: 'name-with-multiple-url-or-logo-variants',
        normalizedName,
        sponsorCount: sponsorsByName.length,
        variants: stableSortBy(
          [...variants.entries()].map(([variantKey, variantSponsors]) => ({
            variantKey,
            normalizedWebsiteUrl: variantSponsors[0]?.normalizedWebsiteUrl || '',
            normalizedLogoKey: variantSponsors[0]?.normalizedLogoKey || '',
            sponsors: stableSortBy(variantSponsors, (item) => item.id).map((sponsor) => ({
              id: sponsor.id,
              handle: sponsor.handle,
              sponsorName: sponsor.sponsorName,
              websiteUrl: sponsor.websiteUrl,
              logo: sponsor.logo,
              sponsoredPlayerIds: stableSortBy(sponsor.sponsoredPlayerIds, (value) => value),
            })),
          })),
          (item) => item.variantKey
        ),
      });
      continue;
    }

    const exactSponsors = [...variants.values()][0];
    const survivor = chooseSurvivor(exactSponsors);
    const mergedPlayerIds = stableSortBy(
      [...new Set(exactSponsors.flatMap((sponsor) => sponsor.sponsoredPlayerIds))],
      (value) => value
    );
    const mergedPlayers = mergedPlayerIds
      .map((playerId) => players.find((player) => player.id === playerId))
      .filter(Boolean);

    groups.push({
      normalizedName,
      normalizedWebsiteUrl: exactSponsors[0]?.normalizedWebsiteUrl || '',
      normalizedLogoKey: exactSponsors[0]?.normalizedLogoKey || '',
      mergeVariantKey: exactSponsors[0]?.mergeVariantKey || '',
      survivorSponsorId: survivor?.id || null,
      survivorSponsorHandle: survivor?.handle || null,
      sourceSponsorIds: stableSortBy(exactSponsors.map((sponsor) => sponsor.id), (value) => value),
      sourceSponsors: stableSortBy(exactSponsors, (item) => item.id).map((sponsor) => ({
        id: sponsor.id,
        handle: sponsor.handle,
        sponsorName: sponsor.sponsorName,
        status: sponsor.status,
        sponsoredPlayerIds: stableSortBy(sponsor.sponsoredPlayerIds, (value) => value),
      })),
      duplicateSponsorIds: stableSortBy(
        exactSponsors.filter((sponsor) => sponsor.id !== survivor?.id).map((sponsor) => sponsor.id),
        (value) => value
      ),
      mergedPlayerIds,
      mergedPlayers: mergedPlayers.map((player) => ({
        id: player.id,
        handle: player.handle,
        fullName: player.fullName,
      })),
      sourceSponsorCount: exactSponsors.length,
      mergedPlayerCount: mergedPlayerIds.length,
    });
  }

  const orphanPlayerSponsorCount = playerSponsors.filter((sponsor) => sponsor.sponsoredPlayerIds.length === 0).length;
  const duplicateRecordCount = groups.reduce((total, group) => total + group.duplicateSponsorIds.length, 0);

  return {
    groups: stableSortBy(groups, (group) => group.mergeVariantKey),
    conflicts: stableSortBy(conflicts, (conflict) => conflict.normalizedName),
    summary: {
      totalPlayerSponsors: playerSponsors.length,
      eligibleGroups: groups.length,
      duplicateRecordsToDraft: duplicateRecordCount,
      sponsorsWithoutPlayers: orphanPlayerSponsorCount,
      conflicts: conflicts.length,
    },
  };
}

async function fetchAllMetaobjects(config, type) {
  const results = [];
  let cursor = null;
  let hasNextPage = true;

  while (hasNextPage) {
    const response = await graphqlRequest(config, METAOBJECT_PAGE_QUERY, {
      type,
      first: PAGE_SIZE,
      after: cursor,
    });

    const connection = response.data?.metaobjects;
    if (!connection) {
      break;
    }

    for (const edge of connection.edges || []) {
      results.push(edge.node);
    }

    hasNextPage = connection.pageInfo?.hasNextPage || false;
    cursor = connection.pageInfo?.endCursor || null;

    if (hasNextPage) {
      await sleep(150);
    }
  }

  return results;
}

function buildSummaryMarkdown(report, outputDir) {
  const lines = [
    '# Sponsor -> Player Relationship Audit',
    '',
    `Generated at: ${report.generatedAt}`,
    `Store: ${report.storeUrl}`,
    `API version: ${report.apiVersion}`,
    '',
    '## Counts',
    '',
    `- Players: ${report.summary.totalPlayers}`,
    `- Sponsors: ${report.summary.totalSponsors}`,
    `- Player sponsor entries: ${report.summary.totalPlayerSponsors}`,
    `- Eligible merge groups: ${report.summary.eligibleGroups}`,
    `- Duplicate sponsor records to draft: ${report.summary.duplicateRecordsToDraft}`,
    `- Sponsors without player links: ${report.summary.sponsorsWithoutPlayers}`,
    `- Conflicts: ${report.summary.conflicts}`,
    '',
    '## Files',
    '',
    '- players.json',
    '- sponsors.json',
    '- player_to_sponsors.json',
    '- sponsor_to_players.json',
    '- merge-plan.json',
    '- conflicts.json',
    '',
    '## Notes',
    '',
    '- This audit is read-only and does not mutate Shopify.',
    '- Live migration should stay blocked until storefront code is updated to handle list references on `club_sponsor.sponsored_player`.',
    `- Output directory: ${outputDir}`,
    '',
  ];

  return lines.join('\n');
}

function writeAuditArtifacts(report, outputDir) {
  ensureDir(outputDir);

  writeJson(path.join(outputDir, 'players.json'), report.players);
  writeJson(path.join(outputDir, 'sponsors.json'), report.sponsors);
  writeJson(path.join(outputDir, 'player_to_sponsors.json'), report.playerToSponsors);
  writeJson(path.join(outputDir, 'sponsor_to_players.json'), report.sponsorToPlayers);
  writeJson(path.join(outputDir, 'merge-plan.json'), report.mergePlan);
  writeJson(path.join(outputDir, 'conflicts.json'), report.conflicts);
  writeText(path.join(outputDir, 'summary.md'), buildSummaryMarkdown(report, outputDir));
}

async function runAudit(options = {}) {
  const config = options.config || getShopifyConfig();
  const label = options.label ? `${options.label}-` : '';
  const outputDir = options.outputDir || path.join(OUTPUT_ROOT, `${label}${timestampSlug()}`);

  const [playerNodes, sponsorNodes] = await Promise.all([
    fetchAllMetaobjects(config, 'player_profile'),
    fetchAllMetaobjects(config, 'club_sponsor'),
  ]);

  const players = stableSortBy(playerNodes.map(buildPlayerRecord), (player) => player.id);
  const sponsors = stableSortBy(sponsorNodes.map(buildSponsorRecord), (sponsor) => sponsor.id);

  const relations = buildRelations(players, sponsors);
  const mergeData = buildMergePlan(players, sponsors);

  const report = {
    generatedAt: new Date().toISOString(),
    storeUrl: config.storeUrl,
    apiVersion: config.apiVersion,
    summary: {
      totalPlayers: players.length,
      totalSponsors: sponsors.length,
      totalPlayerSponsors: mergeData.summary.totalPlayerSponsors,
      eligibleGroups: mergeData.summary.eligibleGroups,
      duplicateRecordsToDraft: mergeData.summary.duplicateRecordsToDraft,
      sponsorsWithoutPlayers: mergeData.summary.sponsorsWithoutPlayers,
      conflicts: mergeData.summary.conflicts,
    },
    players,
    sponsors,
    playerToSponsors: relations.playerToSponsors,
    sponsorToPlayers: relations.sponsorToPlayers,
    mergePlan: {
      generatedAt: new Date().toISOString(),
      storeUrl: config.storeUrl,
      apiVersion: config.apiVersion,
      summary: mergeData.summary,
      groups: mergeData.groups,
    },
    conflicts: mergeData.conflicts,
  };

  if (options.writeArtifacts !== false) {
    writeAuditArtifacts(report, outputDir);
  }

  return { report, outputDir };
}

async function main() {
  console.log('Auditing sponsor -> player relationships...');
  const { report, outputDir } = await runAudit();
  console.log(`Audit complete. Output: ${outputDir}`);
  console.log(
    `Players: ${report.summary.totalPlayers} | Sponsors: ${report.summary.totalSponsors} | ` +
    `Eligible groups: ${report.summary.eligibleGroups} | Conflicts: ${report.summary.conflicts}`
  );
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.message || error);
    process.exitCode = 1;
  });
}

module.exports = {
  OUTPUT_ROOT,
  buildMergePlan,
  canonicalizeMergePlan,
  normalizeSponsorName,
  normalizeUrl,
  runAudit,
  survivorComparator,
};
