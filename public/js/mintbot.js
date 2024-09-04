import { } from './library/barMenu';

const { 
    Keypair, 
    PublicKey, 
    Connection,
    Transaction,
    TransactionInstruction,
    SystemProgram } = require('@solana/web3.js');

const bs58 = require('bs58').default; 

import { Buffer } from 'buffer';
window.Buffer = window.Buffer || Buffer;

document.addEventListener('DOMContentLoaded', async () => {

    const startMint_Btn = document.getElementById('start-mint');
    const stopMint_Btn = document.getElementById('stop-mint');

    const errorNotificationDiv = document.getElementById('errorNotification');
    const errorNotificationMessage = document.getElementById('errorNotification_message');

    const successNotificationiv = document.getElementById('successNotification');
    const successNotificationMessage = document.getElementById('successNotification_message');

    let mintLoop = true;
    let rank = 1;
    const mintCost = 0.00003;
    const regex = /data:,{"p":"fast-20","op":"mint","tick":"([^"]+)","amt":"([^"]+)"}/;
    const JWT_TOKEN = "";
    const rpcEndpoint = "https://solana-mainnet.core.chainstack.com/8c40d3506bbc7b836ec2617aebfd33cc";

    function getConnection() {
        const connection = new Connection(rpcEndpoint);
        return connection;
    }
    const logIn = getConnection();

    startMint_Btn.addEventListener('click', function(event) {
        try {

            // Error notification
            errorNotificationDiv.classList.remove('d-flex');
            errorNotificationDiv.classList.add('d-none');

            // Success notification
            successNotificationiv.classList.remove('d-flex');
            successNotificationiv.classList.add('d-none');

            // Get input value
            const privatekey_input = document.getElementById('private_key').value.trim();
            const data_input = document.getElementById('data').value.trim();

            // Get Public key from Private Key
            const privateKeyBytes = bs58.decode(privatekey_input);
            const keypair = Keypair.fromSecretKey(privateKeyBytes);
            const publicKey = new PublicKey(keypair.publicKey.toString());
            
            logIn.getBalance(publicKey).then(async (_balance) => {
                const balance = (_balance / 1e9).toFixed(4);
                const numberOfMints = Math.floor(balance / mintCost);

                if (balance > 0.005) {
                    const matches = data_input.match(regex);
                    if (matches && Number(matches[2]) >=1) {

                        successNotificationMessage.innerHTML = `<p>Balance: ${balance} Sol</p>  <p>Number of Mint : ${numberOfMints}</p> `;
                        successNotificationiv.classList.remove('d-none');
                        successNotificationiv.classList.add('d-flex');
        
                        startMint_Btn.style.display = "none";
                        stopMint_Btn.style.display = "block";

                        mintLoop = true;
                        submitTransaction(keypair, publicKey, data_input, matches);                
                    } else {
                        errorNotificationMessage.innerHTML = `<p>Invalid data</p>`;
                        errorNotificationDiv.classList.remove('d-none');
                        errorNotificationDiv.classList.add('d-flex');
                    }
                } else {
                    errorNotificationMessage.innerHTML = `<p>Insuffisant balance</p>`;
                    errorNotificationDiv.classList.remove('d-none');
                    errorNotificationDiv.classList.add('d-flex');
                }
            }).catch((error) => {
                errorNotificationMessage.innerHTML = `<p>Refresh the page and try again</p>`;
                errorNotificationDiv.classList.remove('d-none');
                errorNotificationDiv.classList.add('d-flex');
            });

        } catch (error) {
            errorNotificationMessage.innerHTML = `Incorrect private key`;;
            errorNotificationDiv.classList.remove('d-none');
            errorNotificationDiv.classList.add('d-flex');
        }
    });

    stopMint_Btn.addEventListener('click', function(event) {
        startMint_Btn.style.display = "block";
        stopMint_Btn.style.display = "none";

        mintLoop = false;
    });


async function submitMint(signature) {
    const response = await fetch(`/fastprotocol/mint?signature=${encodeURIComponent(signature)}`, {
        method: 'POST ',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${JWT_TOKEN}`
        }
      });
      const data = await response.json();
    return data.data;
}


async function submitTransaction(keypair, publicKey, data, tokenInfo) {
    const transaction = await CreateTransactionForMint(keypair, publicKey.toString(), data, logIn);
    const signature = await logIn.sendTransaction(transaction, [keypair]);
    const confirmedTransaction = await WaitForConfirmations(logIn, signature);
    const balance = await logIn.getBalance(publicKey);
    const _continue = (balance > 0.005) ? true : false;

    const tick = tokenInfo[1]; 
    const amt = tokenInfo[2]; 

    // Sent Trx to back for verification
    // submitMint(signature);

    const tbody = document.getElementById('transaction-body');
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${rank}</td>
      <td><a href="https://solscan.io/tx/${signature}" target="_blank">${signature}</a></td>
      <td>${tick}</td>
      <td>${amt}</td>
    `;
    tbody.appendChild(row);
    rank++;

    if (_continue && mintLoop) {
        submitTransaction(keypair, publicKey, data, tokenInfo);
    }
}

async function CreateTransactionForMint(fromWallet, toAddress, data, connection) {
    const toPublicKey = new PublicKey(toAddress);
    const instruction = new TransactionInstruction({
    keys: [{ pubkey: fromWallet.publicKey, isSigner: true, isWritable: true }],
    programId: 'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr',
    data: Buffer.from(data), 
    });

    const transaction = new Transaction().add(
    SystemProgram.transfer({
        fromPubkey: fromWallet.publicKey,
        toPubkey: toPublicKey,
        lamports: 0.00000001 * 1e9, 
    }),
    instruction
    );

    const { blockhash } = await connection.getRecentBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = fromWallet.publicKey;

    return transaction;
};

async function WaitForConfirmations (connection, signature) {
    let confirmedTransaction = null;
    // Polling mechanism to wait for the desired number of confirmations
    for (let attempt = 0; attempt < 20; attempt++) { // Maximum 20 attempts
        await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for 5 seconds between each attempt

        confirmedTransaction = await connection.getTransaction(signature, {
            maxSupportedTransactionVersion: 0,
        });

        if (confirmedTransaction && confirmedTransaction.slot > 0) {
            return confirmedTransaction;
        }
    }
    return null;
};


});