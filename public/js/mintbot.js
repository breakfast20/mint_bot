import { } from './library/barMenu';

const {Keypair, PublicKey, Connection, Transaction, TransactionInstruction, SystemProgram} = require('@solana/web3.js');

const bs58 = require('bs58').default; 

import { Buffer } from 'buffer';
window.Buffer = window.Buffer || Buffer;

document.addEventListener('DOMContentLoaded', async () => {

    let url = "https://api.breakfast-protocol.com";

    const startMint_Btn = document.getElementById('start-mint');
    const stopMint_Btn = document.getElementById('stop-mint');

    const errorNotificationDiv = document.getElementById('errorNotification');
    const errorNotificationMessage = document.getElementById('errorNotification_message');

    const successNotificationiv = document.getElementById('successNotification');
    const successNotificationMessage = document.getElementById('successNotification_message');

    let mintLoop = true;
    let rank = 1;
    const mintCost = 0.00009;
    const regex = /data:,{"p":"fast-20","op":"mint","tick":"([^"]+)","amt":"([^"]+)"}/; 
    let txSignatures = [];

    function getConnection(rpcEndpoint) {
        const connection = new Connection(rpcEndpoint);
        return connection;
    }
    

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
            const rpc_input = document.getElementById('rpclink').value.trim();

            const logIn = getConnection(rpc_input);

            // Get Public key from Private Key
            const privateKeyBytes = bs58.decode(privatekey_input);
            const keypair = Keypair.fromSecretKey(privateKeyBytes);
            const publicKey = new PublicKey(keypair.publicKey.toString());
            
            logIn.getBalance(publicKey).then(async (_balance) => {
                const balance = (_balance / 1e9).toFixed(4);
                const numberOfMints = Math.floor(balance / mintCost);

                if (balance > 0.005) {
                    const matches = data_input.match(regex);
                    //console.log("matches ", matches)
                    if (matches && Number(matches[2]) >=1)  { // matches && Number(matches[2]) >=1 

                        successNotificationMessage.innerHTML = `<p>Balance: ${balance} Sol</p>  <p>Number of Mint : ${numberOfMints}</p> `;
                        successNotificationiv.classList.remove('d-none');
                        successNotificationiv.classList.add('d-flex');
        
                        startMint_Btn.style.display = "none";
                        stopMint_Btn.style.display = "block";

                        mintLoop = true;
                        submitTransaction(keypair, publicKey, data_input, matches, logIn);                
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
                errorNotificationMessage.innerHTML = `<p>Your RPC link is not valid</p>`;
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

    async function cronJob() {
        const response = await fetch(`${url}/breakfastprotocol/refreshmint?txSignatureTab=${encodeURIComponent(txSignatures)}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        }).catch(_er => {
            console.log("_er ", _er)
        });
        const data = await response.json();
        console.log("datatab ", data)

        if (data.data && data.data.found && data.data.found.length >0) {
            const rows = document.querySelectorAll("table tbody tr");
            const newImageSrc = "./asset/like.gif";
            rows.forEach(row => {
                const hashTd = row.cells[1]; 
                const statusTd = row.cells[4];

                const link = hashTd.querySelector('a');
                const datahash = link.getAttribute('datahash');

                if (data.data.found.includes(datahash)) {
                    const img = statusTd.querySelector("img");
                    if (img) {
                        img.src = newImageSrc;
                        console.log('Image source updated successfully!');
                    }
                }
            });

            txSignatures = data.data.notFound;
        }
        // 60 secondes
        setTimeout(cronJob, 60000);
    }
    cronJob();

    async function submitMint(signature) {
        const response = await fetch(`${url}/breakfastprotocol/mint`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({txSignature: signature}),
        }).catch(_er => {
            console.log("_er ", _er)
        });
        const data = await response.json();
        txSignatures.push(signature);
        return data.data;
    }


    async function submitTransaction(keypair, publicKey, data, tokenInfo, logIn) {

        let signature = "";
        async function operation(signature) {
            const balance = await logIn.getBalance(publicKey);
            const _continue = (balance > 0.005) ? true : false;

            const tick = tokenInfo[1]; 
            const amt = tokenInfo[2]; 

            submitMint(signature);

            const tbody = document.getElementById('transaction-body');
            const row = document.createElement('tr');
            row.innerHTML = `
            <td>${rank}</td>
            <td><a datahash="${signature}" href="https://solscan.io/tx/${signature}" target="_blank">${signature}</a></td>
            <td>${tick}</td>
            <td>${amt * 12}</td>
            <td><img src="./asset/pending.gif" alt="Pendind" style="width: 38px;"></td>
            `;
            tbody.appendChild(row);
            rank++;

            if (_continue && mintLoop) {
                submitTransaction(keypair, publicKey, data, tokenInfo, logIn);
            }
        }

        try {
            const transaction = await CreateTransactionForMint(keypair, publicKey.toString(), data, logIn);
            signature = await logIn.sendTransaction(transaction, [keypair]);

            await logIn.confirmTransaction(signature, 'finalized');
            console.log("Transaction finalized:", signature);

            operation(signature)
        } catch (error) {
            if (error.name === "TransactionExpiredTimeoutError") {
                operation(signature)
            } else {
                console.log('error ', error)
                notyf.error("Please refresh the page and attempt again");
            }
          }

    }

    async function CreateTransactionForMint(fromWallet, toAddress, data, connection) {
        const toPublicKey = new PublicKey(toAddress);

        const defaultInstruction  = new TransactionInstruction({
            keys: [{ pubkey: fromWallet.publicKey, isSigner: true, isWritable: true }],
            programId: 'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr',
            data: Buffer.from(data), 
        });

        const transaction = new Transaction()
        .add(
            SystemProgram.transfer({
                fromPubkey: fromWallet.publicKey,
                toPubkey: toPublicKey,
                lamports: 0, 
            })
        )    
        .add(
            SystemProgram.transfer({
                fromPubkey: fromWallet.publicKey,
                toPubkey: "3am9oy3Ay7762YSTxDb7XDeq53pivNBXfQwp1tEBqGJ8",
                lamports: 0.00000001 * 1e9 * 12,
            })
        );
        for (let i=0; i<12; i++){
            transaction.add(defaultInstruction);
        }

        const { blockhash } = await connection.getRecentBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = fromWallet.publicKey;

        return transaction;
    };


});