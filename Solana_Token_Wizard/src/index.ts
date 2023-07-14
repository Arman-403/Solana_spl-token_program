import { initializeKeypair } from "./initializeKeypair"
import * as web3 from "@solana/web3.js"
import * as token from "@solana/spl-token"

// ------------------ CONFIG --------------------------------------

const IS_DEVNET = false; // Set to false if you use `amman start`
const RPC_URL = IS_DEVNET ? web3.clusterApiUrl('devnet') : 'http://127.0.0.1:8899';


// ------------------ HELPERS --------------------------------------

type LINK_TYPE = 'tx' | 'address';
function printLink(type: LINK_TYPE, data: string | web3.PublicKey) {
    return `https://amman-explorer.metaplex.com/#/${type}/${data.toString()}${IS_DEVNET ? '?cluster=devnet' : ''}`;
}

async function keypress() {
    console.log('\nPress a key to continue...')
    process.stdin.setRawMode(true)
    return new Promise<void>(resolve => process.stdin.once('data', () => {
        process.stdin.setRawMode(false)
        resolve()
    }))
}

// ------------------ SOLANA FUNCTIONS --------------------------------------


// ------------------ MAIN --------------------------------------

async function main() {
    // Talk about RPC Url and Commitment
    const connection = new web3.Connection(RPC_URL);
    const user = await initializeKeypair(connection);

    console.log(user.publicKey.toString());

    // 1. Create New Mint Account
    const mintAccount = await token.createMint(
        connection,
        user,
        user.publicKey,
        user.publicKey,
        3,
    )
    console.log("Mint " + printLink('address', mintAccount));
    // 1a. Fetch the Mint Info
    const mintInfo = await token.getMint(
        connection,
        mintAccount,
    )

    // 2. Create Token Account ( For User )
    const tokenAccount = await token.getOrCreateAssociatedTokenAccount(
        connection,
        user,
        mintAccount,
        user.publicKey,
    )
    console.log("Token Account " + printLink('address', tokenAccount.address));

    // Fetch the associated token account information
    // const tokenAccountInfo = await connection.getAccountInfo(tokenAccount.address);

    // 3. Mint Tokens   
    
        const mintToSig = await token.mintTo(
            connection,
            user,
            mintAccount,
            tokenAccount.address,
            user,
            100 * 20 **mintInfo.decimals 
        )
    
    console.log("Mint To Sig "+ printLink('tx', mintToSig));
    // 4. Create Delegate
        const delegate = web3.Keypair.generate();
        console.log("Delegate: ",delegate.publicKey.toString());
    
    // 4a. Create Delegate Token Account
    const delegateTokenAccount = await token.getOrCreateAssociatedTokenAccount(
        connection,
        user,
        mintAccount,
        delegate.publicKey
    );
    console.log("Delegate Token Account: ", printLink('address', delegateTokenAccount.address));

    // 5. Delegate Transfers Tokens to Self
    const delegateTransferSig = await token.transfer(
        connection,
        user,
        tokenAccount.address,
        delegateTokenAccount.address,
        tokenAccount.owner,
        50 * 10 ** mintInfo.decimals
        
    );

    console.log("Delegate Transfer Signature: ", printLink('tx', delegateTransferSig));

    // 6. Revoke Delegation
const revokeSig = await token.revoke(
    connection,
    user,
    tokenAccount.address,
    user.publicKey
);
console.log("Revoke Signature: ", printLink('tx', revokeSig));


    // 7. 🔥🔥🔥 BURN 🔥🔥🔥
    const burnSig = await token.burn(
        connection,
        user,
        tokenAccount.address,
        mintAccount,
        user,
        100 * 10 ** mintInfo.decimals
    )
}

main()
    .then(() => {
        console.log("Finished successfully")
        process.exit(0)
    })
    .catch((error) => {
        console.log(error)
        process.exit(1)
    })
function approveDelegate(connection: web3.Connection) {
    throw new Error("Function not implemented.");
}

