const fs = require('fs');
const path = require('path');

const DEFAULT_STORE_URL = 'park-orchards-football-netball-club.myshopify.com';
const DEFAULT_API_VERSION = '2024-10';

function getShopifyConfig(options = {}) {
  return {
    storeUrl: process.env.SHOPIFY_STORE_URL || options.defaultStoreUrl || DEFAULT_STORE_URL,
    apiVersion: process.env.SHOPIFY_API_VERSION || options.defaultApiVersion || DEFAULT_API_VERSION,
    accessToken: process.env.SHOPIFY_ADMIN_TOKEN || options.accessToken || '',
  };
}

function getGraphqlUrl(config) {
  return `https://${config.storeUrl}/admin/api/${config.apiVersion}/graphql.json`;
}

function assertShopifyConfig(config) {
  if (!config.storeUrl) {
    throw new Error('Missing Shopify store URL. Set SHOPIFY_STORE_URL.');
  }

  if (!config.accessToken) {
    throw new Error('Missing Shopify Admin token. Set SHOPIFY_ADMIN_TOKEN.');
  }
}

async function graphqlRequest(config, query, variables = {}) {
  assertShopifyConfig(config);

  const response = await fetch(getGraphqlUrl(config), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': config.accessToken,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status}: ${text}`);
  }

  const json = await response.json();
  if (json.errors && json.errors.length > 0) {
    throw new Error(`GraphQL errors: ${JSON.stringify(json.errors)}`);
  }

  return json;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function timestampSlug(date = new Date()) {
  return date.toISOString().replace(/[:.]/g, '-');
}

function writeJson(filePath, value) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function writeText(filePath, value) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, value, 'utf8');
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function normalizeWhitespace(value) {
  return String(value || '').trim().replace(/\s+/g, ' ');
}

function safeUrlParse(value) {
  const raw = normalizeWhitespace(value);
  if (!raw) {
    return null;
  }

  try {
    return new URL(raw);
  } catch (error) {
    return null;
  }
}

function stableSortBy(items, selector) {
  return [...items].sort((left, right) => {
    const leftValue = selector(left);
    const rightValue = selector(right);

    if (leftValue < rightValue) {
      return -1;
    }

    if (leftValue > rightValue) {
      return 1;
    }

    return 0;
  });
}

function describeUserErrors(userErrors) {
  if (!Array.isArray(userErrors) || userErrors.length === 0) {
    return 'Unknown Shopify user error';
  }

  return userErrors
    .map((error) => {
      const field = Array.isArray(error.field) && error.field.length > 0
        ? ` (${error.field.join('.')})`
        : '';
      const code = error.code ? `[${error.code}] ` : '';
      return `${code}${error.message}${field}`;
    })
    .join('; ');
}

module.exports = {
  DEFAULT_API_VERSION,
  DEFAULT_STORE_URL,
  assertShopifyConfig,
  describeUserErrors,
  ensureDir,
  getGraphqlUrl,
  getShopifyConfig,
  graphqlRequest,
  normalizeWhitespace,
  readJson,
  safeUrlParse,
  sleep,
  stableSortBy,
  timestampSlug,
  writeJson,
  writeText,
};
