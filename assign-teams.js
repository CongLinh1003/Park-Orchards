const fs = require('fs');

const STORE_URL = 'park-orchards-football-netball-club.myshopify.com';
const API_VERSION = '2024-10';
const ACCESS_TOKEN = 'shpat_YOUR_TOKEN_HERE';
const GRAPHQL_URL = `https://${STORE_URL}/admin/api/${API_VERSION}/graphql.json`;

async function gql(query, variables = {}) {
    const res = await fetch(GRAPHQL_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': ACCESS_TOKEN },
        body: JSON.stringify({ query, variables }),
    });
    return res.json();
}

const mockups = [
    // Men
    { name: "LIAM BUHAGIAR", gender: "Men" }, { name: "JAMES PARSONS", gender: "Men" }, { name: "LIAM JEFFS", gender: "Men" }, { name: "JAYE WITNISH", gender: "Men" }, { name: "ALEX MAGNANO", gender: "Men" }, { name: "LIAM TAYLOR", gender: "Men" }, { name: "MICHAEL PROSENAK", gender: "Men" }, { name: "CONNOR HICKEY", gender: "Men" }, { name: "LIAM WEBB", gender: "Men" }, { name: "LEX HARTNETT", gender: "Men" }, { name: "JOSH MCAULIFFE", gender: "Men" }, { name: "LEWIS DOWNIE", gender: "Men" }, { name: "SAMMY PREST", gender: "Men" }, { name: "SAM HERON", gender: "Men" }, { name: "TOM LIVINGSTONE", gender: "Men" }, { name: "HARRISON LEONARD", gender: "Men" }, { name: "JACOB PRICE-INGLIS", gender: "Men" }, { name: "NIELS WITHOFF", gender: "Men" }, { name: "CIARAN HICKEY", gender: "Men" }, { name: "MASON BLAKEY", gender: "Men" }, { name: "JOSH VOOGD", gender: "Men" }, { name: "DYLAN KNIGHT", gender: "Men" }, { name: "MASON WITNISH", gender: "Men" }, { name: "KANE KEPPEL", gender: "Men" }, { name: "TOM WILSON", gender: "Men" }, { name: "TYLER PRUNTY", gender: "Men" }, { name: "JACK CULLEN", gender: "Men" }, { name: "LIAM CRIDLAND", gender: "Men" }, { name: "MATT HAYTHORNE", gender: "Men" }, { name: "BEN PANZA", gender: "Men" }, { name: "LUKE CORMACK", gender: "Men" }, { name: "MCLAREN SPITERI", gender: "Men" }, { name: "TOM REES", gender: "Men" }, { name: "JOSH CHAPPELL", gender: "Men" }, { name: "JAMAICA WOODS", gender: "Men" }, { name: "STEFAN D'SOUZA", gender: "Men" }, { name: "TIGE RIDLEY", gender: "Men" }, { name: "CRISTIAN CIAMPA", gender: "Men" }, { name: "WILL HELIOTIS", gender: "Men" }, { name: "WILL TAIT", gender: "Men" }, { name: "HENRY AMEER", gender: "Men" }, { name: "HAYDEN CAMPBELL", gender: "Men" }, { name: "MAX MORTON", gender: "Men" }, { name: "MAX HARRISON", gender: "Men" }, { name: "DARCY MONEY", gender: "Men" }, { name: "TYSON HARRAP", gender: "Men" }, { name: "SAM TSOUKATOS", gender: "Men" }, { name: "JAMES DEMPSEY", gender: "Men" },
    // Women
    { name: "KRISTEN BERTOLDI", gender: "Women" }, { name: "ALANNAH PANZA", gender: "Women" }, { name: "AVA CAMPBELL", gender: "Women" }, { name: "JORJA LIVINGSTONE", gender: "Women" }, { name: "ALANNAH BOELL", gender: "Women" }, { name: "ELLA MERTON", gender: "Women" }, { name: "BRIANNA CLARK", gender: "Women" }, { name: "GEORGIE SEARLE", gender: "Women" }, { name: "MIA MCAULIFFE", gender: "Women" }, { name: "MATILDA RAE", gender: "Women" }, { name: "TESS POWER", gender: "Women" }, { name: "DAISY COOPER", gender: "Women" }, { name: "CHLOE LIVINGSTONE", gender: "Women" }, { name: "RUBY CHANDLER", gender: "Women" }, { name: "ELLY HARTNETT", gender: "Women" }, { name: "JADE HUTCHINSON", gender: "Women" }, { name: "KAITLYN RUKAVINA", gender: "Women" }, { name: "REMY ARCHER", gender: "Women" }, { name: "CLAIRE BONE", gender: "Women" }, { name: "KATE BROWN", gender: "Women" }, { name: "SIENNA BETT", gender: "Women" }, { name: "JASMINE TAYLOR", gender: "Women" }, { name: "SIENNA POLLOCK", gender: "Women" }, { name: "MOLLY HEYMANSON", gender: "Women" }, { name: "ALLIE KING", gender: "Women" }, { name: "TEAGAN BRADLEY", gender: "Women" }, { name: "HAILEY SIMS", gender: "Women" }, { name: "CHARLOTTE SMILLIE", gender: "Women" }, { name: "ISABELLE POLLOCK", gender: "Women" }, { name: "AMY WALSH", gender: "Women" }, { name: "ELLA CRUPI", gender: "Women" }, { name: "AMELIA REES", gender: "Women" }, { name: "EMILY O'SULLIVAN", gender: "Women" }, { name: "PENNY BOWMAN", gender: "Women" }, { name: "MONICA CIAMPA", gender: "Women" }, { name: "ERIN LOUCAS", gender: "Women" }, { name: "SOPHIE TOSCANO", gender: "Women" }, { name: "ASLEIGH BILUCAGLIA", gender: "Women" }, { name: "ELLA MCKENZIE", gender: "Women" }, { name: "ZARA JACKSON-SMITH", gender: "Women" }
];

const GET_ID_MUTATION = `
  query getMetaobjectByHandle($handle: MetaobjectHandleInput!) {
    metaobjectByHandle(handle: $handle) {
      id
    }
  }
`;

const UPDATE_MUTATION = `
  mutation metaobjectUpdate($id: ID!, $metaobject: MetaobjectUpdateInput!) {
    metaobjectUpdate(id: $id, metaobject: $metaobject) {
      metaobject {
        id
      }
      userErrors {
        field
        message
      }
    }
  }
`;

function slugify(text) {
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
}

async function main() {
    const players = JSON.parse(fs.readFileSync('all_players.json', 'utf8'));

    const TEAM_MEN = 'gid://shopify/Metaobject/279767384427';
    const TEAM_WOMEN = 'gid://shopify/Metaobject/279767482731';

    let success = 0;
    
    for (const m of mockups) {
        const handle = slugify(m.name);
        
        // 1. Get ID
        const idResult = await gql(GET_ID_MUTATION, { handle: { type: "player_profile", handle: handle } });
        let id = idResult.data?.metaobjectByHandle?.id;
        
        if (!id) {
            // Check if there is an exact match in the file
            const exact = players.find(p => p.full_name.toLowerCase() === m.name.toLowerCase());
            if (exact) {
                const idResult2 = await gql(GET_ID_MUTATION, { handle: { type: "player_profile", handle: exact.handle } });
                id = idResult2.data?.metaobjectByHandle?.id;
            }
        }

        if (!id) {
            console.error(`❌ Could not find ID for ${m.name}`);
            continue;
        }

        const teamId = m.gender === 'Men' ? TEAM_MEN : TEAM_WOMEN;

        // 2. Update team
        const updateResult = await gql(UPDATE_MUTATION, {
            id: id,
            metaobject: {
                fields: [
                    { key: "team", value: teamId }
                ]
            }
        });

        const data = updateResult.data?.metaobjectUpdate;
        if (data?.userErrors?.length > 0) {
            console.error(`❌ Error updating ${m.name}:`, data.userErrors);
        } else {
            console.log(`✅ Updated team for ${m.name} to ${m.gender} Seniors`);
            success++;
        }

        await new Promise(r => setTimeout(r, 200));
    }
    console.log(`Finished updating ${success} players.`);
}

main().catch(console.error);
