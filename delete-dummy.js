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

const GET_ID_MUTATION = `
  query getMetaobjectByHandle($handle: MetaobjectHandleInput!) {
    metaobjectByHandle(handle: $handle) {
      id
    }
  }
`;

const DELETE_MUTATION = `
  mutation metaobjectDelete($id: ID!) {
    metaobjectDelete(id: $id) {
      deletedId
      userErrors {
        field
        message
      }
    }
  }
`;

async function main() {
    console.log('Loading players...');
    const players = JSON.parse(fs.readFileSync('all_players.json', 'utf8'));

    const mockups = [
        "LIAM BUHAGIAR", "JAMES PARSONS", "LIAM JEFFS", "JAYE WITNISH", "ALEX MAGNANO", "LIAM TAYLOR", "MICHAEL PROSENAK", "CONNOR HICKEY", "LIAM WEBB", "LEX HARTNETT", "JOSH MCAULIFFE", "LEWIS DOWNIE", "SAMMY PREST", "SAM HERON", "TOM LIVINGSTONE", "HARRISON LEONARD", "JACOB PRICE-INGLIS", "NIELS WITHOFF", "CIARAN HICKEY", "MASON BLAKEY", "JOSH VOOGD", "DYLAN KNIGHT", "MASON WITNISH", "KANE KEPPEL", "TOM WILSON", "TYLER PRUNTY", "JACK CULLEN", "LIAM CRIDLAND", "MATT HAYTHORNE", "BEN PANZA", "LUKE CORMACK", "MCLAREN SPITERI", "TOM REES", "JOSH CHAPPELL", "JAMAICA WOODS", "STEFAN D'SOUZA", "TIGE RIDLEY", "CRISTIAN CIAMPA", "WILL HELIOTIS", "WILL TAIT", "HENRY AMEER", "HAYDEN CAMPBELL", "MAX MORTON", "MAX HARRISON", "DARCY MONEY", "TYSON HARRAP", "SAM TSOUKATOS", "JAMES DEMPSEY",
        "KRISTEN BERTOLDI", "ALANNAH PANZA", "AVA CAMPBELL", "JORJA LIVINGSTONE", "ALANNAH BOELL", "ELLA MERTON", "BRIANNA CLARK", "GEORGIE SEARLE", "MIA MCAULIFFE", "MATILDA RAE", "TESS POWER", "DAISY COOPER", "CHLOE LIVINGSTONE", "RUBY CHANDLER", "ELLY HARTNETT", "JADE HUTCHINSON", "KAITLYN RUKAVINA", "REMY ARCHER", "CLAIRE BONE", "KATE BROWN", "SIENNA BETT", "JASMINE TAYLOR", "SIENNA POLLOCK", "MOLLY HEYMANSON", "ALLIE KING", "TEAGAN BRADLEY", "HAILEY SIMS", "CHARLOTTE SMILLIE", "ISABELLE POLLOCK", "AMY WALSH", "ELLA CRUPI", "AMELIA REES", "EMILY O'SULLIVAN", "PENNY BOWMAN", "MONICA CIAMPA", "ERIN LOUCAS", "SOPHIE TOSCANO", "ASLEIGH BILUCAGLIA", "ELLA MCKENZIE", "ZARA JACKSON-SMITH"
    ];

    function norm(str) { return str ? str.trim().toLowerCase().replace(/[^a-z]/g, '') : ''; }
    
    let toDelete = [];

    for (const p of players) {
        let isNetball = false;
        if (p.team && p.team.includes('279767515499')) isNetball = true;
        if (p.team && p.team.includes('279767548267')) isNetball = true;
        if (p.team && p.team.includes('279767581035')) isNetball = true;
        if (p.team && p.team.includes('279767613803')) isNetball = true;
        
        if (isNetball) continue;

        const n = norm(p.full_name);
        let found = false;
        for (let m of mockups) {
            const mn = norm(m);
            if (mn === n || mn.includes(n) || n.includes(mn)) {
                found = true;
                break;
            }
        }

        if (!found) {
            toDelete.push(p);
        }
    }

    console.log(`Found ${toDelete.length} players to delete...`);

    let success = 0;
    for (const p of toDelete) {
        console.log(`Deleting ${p.full_name} (${p.handle})...`);
        
        // 1. Get ID
        const idResult = await gql(GET_ID_MUTATION, { handle: { type: "player_profile", handle: p.handle } });
        const id = idResult.data?.metaobjectByHandle?.id;
        
        if (!id) {
            console.error(`  ❌ Could not find ID for handle ${p.handle}`);
            continue;
        }

        // 2. Delete
        const result = await gql(DELETE_MUTATION, { id });
        const data = result.data?.metaobjectDelete;
        
        if (data?.userErrors?.length > 0) {
            console.error(`  ❌ Error:`, data.userErrors);
        } else if (data?.deletedId) {
            console.log(`  ✅ Deleted`);
            success++;
        } else {
            console.error(`  ❌ Unknown Error:`, JSON.stringify(result));
        }
        await new Promise(r => setTimeout(r, 200));
    }
    
    console.log(`\nDeleted ${success}/${toDelete.length} dummy/removed players.`);
}

main().catch(console.error);
