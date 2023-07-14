import { initializeKeypair } from "./initializeKeypair"
import * as web3 from "@solana/web3.js"
import * as token from "@solana/spl-token"

// ------------------ CONFIG --------------------------------------

const IS_DEVNET = false; // Set to false if you use `amman start`
const RPC_URL = IS_DEVNET ? web3.clusterApiUrl('devnet') : 'http://127.0.0.1:8899';


// ------------------ HELPERS --------------------------------------

type LINK_TYPE = 'tx' | 'address';
function printLink(type: LINK_TYPE, data: string | web3.PublicKey){
    return `https://amman-explorer.metaplex.com/#/${type}/${data.toString()}${IS_DEVNET ? '?cluster=devnet' : ''}`;
}

async function keypress(){
    console.log('\nPress a key to continue...')
    process.stdin.setRawMode(true)
    return new Promise<void>(resolve => process.stdin.once('data', () => {
      process.stdin.setRawMode(false)
      resolve()
    }))
  }

// ------------------ SOLANA FUNCTIONS --------------------------------------


async function createNewMint(
    connection: web3.Connection,
    payer: web3.Keypair,
    mintAuthority: web3.PublicKey,
    freezeAuthority: web3.PublicKey,
    decimals: number
): Promise<web3.PublicKey> {
    const tokenMint = await token.createMint(
        connection,
        payer,
        mintAuthority,
        freezeAuthority,
        decimals
    )

    console.log(
        `Token Mint: ${printLink('address', tokenMint)}`
    )

    return tokenMint
}

async function createTokenAccount(
    connection: web3.Connection,
    payer: web3.Keypair,
    mint: web3.PublicKey,
    owner: web3.PublicKey
) {
    const tokenAccount = await token.getOrCreateAssociatedTokenAccount(
        connection,
        payer,
        mint,
        owner
    )

    console.log(
        `Token Account: ${printLink('address', tokenAccount.address)}`
    )

    return tokenAccount
}

async function mintTokens(
    connection: web3.Connection,
    payer: web3.Keypair,
    mint: web3.PublicKey,
    destination: web3.PublicKey,
    authority: web3.Keypair,
    amount: number
) {
    const transactionSignature = await token.mintTo(
        connection,
        payer,
        mint,
        destination,
        authority,
        amount
    )

    console.log(
        `Mint Token Transaction: ${printLink('tx', transactionSignature)}`
    )
}

async function approveDelegate(
  connection: web3.Connection,
  payer: web3.Keypair,
  account: web3.PublicKey,
  delegate: web3.PublicKey,
  owner: web3.Signer | web3.PublicKey,
  amount: number
) {
  const transactionSignature = await token.approve(
    connection,
    payer,
    account,
    delegate,
    owner,
    amount
  )

  console.log(
    `Approve Delegate Transaction: ${printLink('tx', transactionSignature)}`
  )
}

async function revokeDelegate(
  connection: web3.Connection,
  payer: web3.Keypair,
  account: web3.PublicKey,
  owner: web3.Signer | web3.PublicKey,
) {
  const transactionSignature = await token.revoke(
    connection,
    payer,
    account,
    owner,
  )

  console.log(
    `Revote Delegate Transaction: ${printLink('tx', transactionSignature)}`
  )
}

async function transferTokens(
    connection: web3.Connection,
    payer: web3.Keypair,
    source: web3.PublicKey,
    destination: web3.PublicKey,
    owner: web3.Keypair,
    amount: number
) {
    const transactionSignature = await token.transfer(
        connection,
        payer,
        source,
        destination,
        owner,
        amount
    )

    console.log(
        `Transfer Transaction: ${printLink('tx', transactionSignature)}`
    )
}

async function burnTokens(
    connection: web3.Connection,
    payer: web3.Keypair,
    account: web3.PublicKey,
    mint: web3.PublicKey,
    owner: web3.Keypair,
    amount: number
) {
    const transactionSignature = await token.burn(
        connection,
        payer,
        account,
        mint,
        owner,
        amount
    )

    console.log(
        `Burn Transaction: ${printLink('tx', transactionSignature)}`
    )
}

// ------------------ MAIN --------------------------------------

async function main() {
    // Talk about RPC Url and Commitment
    const connection = new web3.Connection(RPC_URL);

    const user = await initializeKeypair(connection);

    // 1. Create New Mint Account

    // 1a. Fetch the Mint Info

    // 2. Create Token Account ( For User )

    // 3. Mint Tokens

    // 4. Create Deligate

    // 4. Create Deligate Token Account

    // 5. Delegate Transfers Tokens to Self

    // 6. Revoke Delegation

    // 7. 🔥🔥🔥 BURN 🔥🔥🔥

    await keypress();
    console.log('Creating New Mint Account');
    const mint = await createNewMint(
        connection,
        user,
        user.publicKey,
        user.publicKey,
        2
    )
    
    const mintInfo = await token.getMint(connection, mint);

    await keypress();
    console.log('Creating Token Account');
    const tokenAccount = await createTokenAccount(
        connection,
        user,
        mint,
        user.publicKey
    )

    await keypress();
    console.log('Minting Tokens to Account');
    await mintTokens(
      connection,
      user,
      mint,
      tokenAccount.address,
      user,
      100 * 10 ** mintInfo.decimals
    )

    await keypress();
    console.log('Creating Delegate');
    const delegate = web3.Keypair.generate();
    await approveDelegate(
      connection,
      user,
      tokenAccount.address,
      delegate.publicKey,
      user.publicKey,
      50 * 10 ** mintInfo.decimals
    )

    const receiver = web3.Keypair.generate().publicKey
    const receiverTokenAccount = await createTokenAccount(
        connection,
        user,
        mint,
        receiver
    )

    await keypress();
    console.log('Transfering Tokens To Delegate');
    await transferTokens(
      connection,
      user,
      tokenAccount.address,
      receiverTokenAccount.address,
      delegate,
      50 * 10 ** mintInfo.decimals
    )

    await keypress();
    console.log('Removing Delegate');
    await revokeDelegate(
      connection,
      user,
      tokenAccount.address,
      user.publicKey,
    )

    await keypress();
    console.log('Burning Tokens');
    await burnTokens(
      connection,
      user,
      tokenAccount.address,
      mint,
      user,
      25 * 10 ** mintInfo.decimals
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
