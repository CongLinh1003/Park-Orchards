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

function norm(str) {
    return str ? str.trim().toLowerCase().replace(/[^a-z]/g, '') : '';
}

function slugify(text) {
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
        .replace(/\-\-+/g, '-')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start of text
        .replace(/-+$/, '');            // Trim - from end of text
}

const mockups = [
    // Men (48 players)
    { "number": "1", "name": "LIAM BUHAGIAR", "nickname": "BUDGIE", "gender": "Men" },
    { "number": "2", "name": "JAMES PARSONS", "nickname": "PARSO", "gender": "Men" },
    { "number": "3", "name": "LIAM JEFFS", "nickname": "JEFFA", "gender": "Men" },
    { "number": "4", "name": "JAYE WITNISH", "nickname": "WITTA", "gender": "Men" },
    { "number": "5", "name": "ALEX MAGNANO", "nickname": "AL", "gender": "Men" },
    { "number": "6", "name": "LIAM TAYLOR", "nickname": "LT", "gender": "Men" },
    { "number": "7", "name": "MICHAEL PROSENAK", "nickname": "PROZ", "gender": "Men" },
    { "number": "8", "name": "CONNOR HICKEY", "nickname": "HICKEY", "gender": "Men" },
    { "number": "9", "name": "LIAM WEBB", "nickname": "WEBBY", "gender": "Men" },
    { "number": "10", "name": "LEX HARTNETT", "nickname": "BHAT", "gender": "Men" },
    { "number": "11", "name": "JOSH MCAULIFFE", "nickname": "JMAC", "gender": "Men" },
    { "number": "12", "name": "LEWIS DOWNIE", "nickname": "LD", "gender": "Men" },
    { "number": "13", "name": "SAMMY PREST", "nickname": "PRESTY", "gender": "Men" },
    { "number": "14", "name": "SAM HERON", "nickname": "FART", "gender": "Men" },
    { "number": "15", "name": "TOM LIVINGSTONE", "nickname": "LIVO", "gender": "Men" },
    { "number": "16", "name": "HARRISON LEONARD", "nickname": "LENNY", "gender": "Men" },
    { "number": "17", "name": "JACOB PRICE-INGLIS", "nickname": "NOODLES", "gender": "Men" },
    { "number": "18", "name": "NIELS WITHOFF", "nickname": "HOFF", "gender": "Men" },
    { "number": "19", "name": "CIARAN HICKEY", "nickname": "CIZ", "gender": "Men" },
    { "number": "20", "name": "MASON BLAKEY", "nickname": "BIG RED", "gender": "Men" },
    { "number": "21", "name": "JOSH VOOGD", "nickname": "OOGIE", "gender": "Men" },
    { "number": "22", "name": "DYLAN KNIGHT", "nickname": "DYL", "gender": "Men" },
    { "number": "23", "name": "MASON WITNISH", "nickname": "WITTA", "gender": "Men" },
    { "number": "24", "name": "KANE KEPPEL", "nickname": "KEPP", "gender": "Men" },
    { "number": "25", "name": "TOM WILSON", "nickname": "WILLO", "gender": "Men" },
    { "number": "26", "name": "TYLER PRUNTY", "nickname": "JOHN", "gender": "Men" },
    { "number": "27", "name": "JACK CULLEN", "nickname": "BUCKETS", "gender": "Men" },
    { "number": "29", "name": "LIAM CRIDLAND", "nickname": "CRIDDA", "gender": "Men" },
    { "number": "30", "name": "MATT HAYTHORNE", "nickname": "HAYTH", "gender": "Men" },
    { "number": "31", "name": "BEN PANZA", "nickname": "PANZ", "gender": "Men" },
    { "number": "32", "name": "LUKE CORMACK", "nickname": "CORM", "gender": "Men" },
    { "number": "33", "name": "MCLAREN SPITERI", "nickname": "MACCA", "gender": "Men" },
    { "number": "34", "name": "TOM REES", "nickname": "REESY", "gender": "Men" },
    { "number": "35", "name": "JOSH CHAPPELL", "nickname": "CHAPPY", "gender": "Men" },
    { "number": "36", "name": "JAMAICA WOODS", "nickname": "WOODSY", "gender": "Men" },
    { "number": "37", "name": "STEFAN D'SOUZA", "nickname": "STEF", "gender": "Men" },
    { "number": "29", "name": "TIGE RIDLEY", "nickname": "TIG", "gender": "Men" },
    { "number": "38", "name": "CRISTIAN CIAMPA", "nickname": "CRISO", "gender": "Men" },
    { "number": "40", "name": "WILL HELIOTIS", "nickname": "TRUCK", "gender": "Men" },
    { "number": "42", "name": "WILL TAIT", "nickname": "TAITY", "gender": "Men" },
    { "number": "43", "name": "HENRY AMEER", "nickname": "STAUNCH", "gender": "Men" },
    { "number": "44", "name": "HAYDEN CAMPBELL", "nickname": "DORSAL", "gender": "Men" },
    { "number": "45", "name": "MAX MORTON", "nickname": "MOOT", "gender": "Men" },
    { "number": "46", "name": "MAX HARRISON", "nickname": "MAXY", "gender": "Men" },
    { "number": "48", "name": "DARCY MONEY", "nickname": "D MONEY", "gender": "Men" },
    { "number": "49", "name": "TYSON HARRAP", "nickname": "RAPTOR", "gender": "Men" },
    { "number": "50", "name": "SAM TSOUKATOS", "nickname": "SAMMY", "gender": "Men" },
    { "number": "51", "name": "JAMES DEMPSEY", "nickname": "DEMPS", "gender": "Men" },
  
    // Women (40 players)
    { "number": "1", "name": "KRISTEN BERTOLDI", "nickname": "KB", "gender": "Women" },
    { "number": "2", "name": "ALANNAH PANZA", "nickname": "AP", "gender": "Women" },
    { "number": "3", "name": "AVA CAMPBELL", "nickname": "JEFFA", "gender": "Women" },
    { "number": "4", "name": "JORJA LIVINGSTONE", "nickname": "J LIVO", "gender": "Women" },
    { "number": "5", "name": "ALANNAH BOELL", "nickname": "LANS", "gender": "Women" },
    { "number": "6", "name": "ELLA MERTON", "nickname": "LT", "gender": "Women" },
    { "number": "7", "name": "BRIANNA CLARK", "nickname": "BRI", "gender": "Women" },
    { "number": "8", "name": "GEORGIE SEARLE", "nickname": "GEO", "gender": "Women" },
    { "number": "9", "name": "MIA MCAULIFFE", "nickname": "MEEZ", "gender": "Women" },
    { "number": "10", "name": "MATILDA RAE", "nickname": "TILLY", "gender": "Women" },
    { "number": "12", "name": "TESS POWER", "nickname": "JMAC", "gender": "Women" },
    { "number": "13", "name": "DAISY COOPER", "nickname": "LD", "gender": "Women" },
    { "number": "14", "name": "CHLOE LIVINGSTONE", "nickname": "CHLO", "gender": "Women" },
    { "number": "15", "name": "RUBY CHANDLER", "nickname": "PARSO", "gender": "Women" },
    { "number": "16", "name": "ELLY HARTNETT", "nickname": "JEFFA", "gender": "Women" },
    { "number": "17", "name": "JADE HUTCHINSON", "nickname": "WITTA", "gender": "Women" },
    { "number": "18", "name": "KAITLYN RUKAVINA", "nickname": "RUKA", "gender": "Women" },
    { "number": "19", "name": "REMY ARCHER", "nickname": "LT", "gender": "Women" },
    { "number": "20", "name": "CLAIRE BONE", "nickname": "PROZ", "gender": "Women" },
    { "number": "21", "name": "KATE BROWN", "nickname": "HICKEY", "gender": "Women" },
    { "number": "22", "name": "SIENNA BETT", "nickname": "WEBBY", "gender": "Women" },
    { "number": "23", "name": "JASMINE TAYLOR", "nickname": "JAZZI", "gender": "Women" },
    { "number": "24", "name": "SIENNA POLLOCK", "nickname": "JMAC", "gender": "Women" },
    { "number": "25", "name": "MOLLY HEYMANSON", "nickname": "MOL", "gender": "Women" },
    { "number": "26", "name": "ALLIE KING", "nickname": "BUDGIE", "gender": "Women" },
    { "number": "27", "name": "TEAGAN BRADLEY", "nickname": "PARSO", "gender": "Women" },
    { "number": "28", "name": "HAILEY SIMS", "nickname": "JEFFA", "gender": "Women" },
    { "number": "29", "name": "CHARLOTTE SMILLIE", "nickname": "CHARLIE", "gender": "Women" },
    { "number": "30", "name": "ISABELLE POLLOCK", "nickname": "ISSY", "gender": "Women" },
    { "number": "31", "name": "AMY WALSH", "nickname": "LT", "gender": "Women" },
    { "number": "32", "name": "ELLA CRUPI", "nickname": "PROZ", "gender": "Women" },
    { "number": "33", "name": "AMELIA REES", "nickname": "MILLS", "gender": "Women" },
    { "number": "35", "name": "EMILY O'SULLIVAN", "nickname": "WEBBY", "gender": "Women" },
    { "number": "36", "name": "PENNY BOWMAN", "nickname": "PEN", "gender": "Women" },
    { "number": "37", "name": "MONICA CIAMPA", "nickname": "JMAC", "gender": "Women" },
    { "number": "38", "name": "ERIN LOUCAS", "nickname": "LD", "gender": "Women" },
    { "number": "39", "name": "SOPHIE TOSCANO", "nickname": "BUDGIE", "gender": "Women" },
    { "number": "40", "name": "ASLEIGH BILUCAGLIA", "nickname": "PARSO", "gender": "Women" },
    { "number": "41", "name": "ELLA MCKENZIE", "nickname": "JEFFA", "gender": "Women" },
    { "number": "42", "name": "ZARA JACKSON-SMITH", "nickname": "WITTA", "gender": "Women" }
  ];

const UPSERT_MUTATION = `
  mutation metaobjectUpsert($handle: MetaobjectHandleInput!, $metaobject: MetaobjectUpsertInput!) {
    metaobjectUpsert(handle: $handle, metaobject: $metaobject) {
      metaobject {
        handle
        id
      }
      userErrors {
        field
        message
      }
    }
  }
`;

async function main() {
    console.log('Loading existing players...');
    const shopifyPlayers = JSON.parse(fs.readFileSync('all_players.json', 'utf8'));

    let success = 0;
    let errors = 0;

    for (const m of mockups) {
        // Find existing handle
        let handleToUse = null;
        let pName = norm(m.name);

        const existingExact = shopifyPlayers.find(p => norm(p.full_name) === pName);
        if (existingExact) {
            handleToUse = existingExact.handle;
        } else {
            // Check partial matches or create new handle
            const existingPartial = shopifyPlayers.find(p => norm(p.full_name).includes(pName) || pName.includes(norm(p.full_name)));
            if (existingPartial) {
                handleToUse = existingPartial.handle;
            } else {
                handleToUse = slugify(m.name);
            }
        }

        const formattedName = m.name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');

        const variables = {
            handle: {
                type: "player_profile",
                handle: handleToUse
            },
            metaobject: {
                fields: [
                    { key: "full_name", value: formattedName },
                    { key: "jersey_number", value: String(m.number) },
                    { key: "preferred_name", value: m.nickname }
                ],
                capabilities: {
                    publishable: { status: "ACTIVE" }
                }
            }
        };

        try {
            console.log(`Upserting ${formattedName} (Handle: ${handleToUse}) - Number: ${m.number}, Nickname: ${m.nickname}`);
            const result = await gql(UPSERT_MUTATION, variables);
            const data = result.data?.metaobjectUpsert;
            
            if (data?.userErrors?.length > 0) {
                console.error(`  ❌ Error:`, data.userErrors);
                errors++;
            } else if (data?.metaobject) {
                console.log(`  ✅ Success: ${data.metaobject.handle}`);
                success++;
            } else {
                console.error(`  ❌ Unknown Error:`, JSON.stringify(result));
                errors++;
            }
        } catch (err) {
            console.error(`  ❌ Request Error: ${err.message}`);
            errors++;
        }
        
        // Wait to avoid rate limits
        await new Promise(r => setTimeout(r, 250));
    }

    console.log(`\nFinished! Success: ${success}, Errors: ${errors}`);
}

main().catch(console.error);
