const contractAddress = "0x636cb02da3e32b1a9d0a6b2744d288b65638c6fd";
const abi = [
    {
        "inputs": [],
        "name": "getNote",
        "outputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "_note",
                "type": "string"
            }
        ],
        "name": "setNote",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
];

let contract;
let userAddress;

// Wait for everything to load
window.addEventListener('load', function() {
    console.log('Page loaded, ethers available:', typeof ethers !== 'undefined');
    
    // Initialize the app
    initApp();
});

function initApp() {
    // Get DOM elements
    const connectButton = document.getElementById("connectButton");
    const setNoteButton = document.getElementById("setNoteButton");
    const getNoteButton = document.getElementById("getNoteButton");

    // Attach event listeners
    connectButton.addEventListener("click", connectWallet);
    setNoteButton.addEventListener("click", setNote);
    getNoteButton.addEventListener("click", getNote);

    // Check if MetaMask is installed
    if (typeof window.ethereum !== 'undefined') {
        console.log('MetaMask is installed!');
        checkConnection();
    } else {
        alert('Please install MetaMask to use this dApp!');
        document.getElementById('connectButton').disabled = true;
    }
}

async function checkConnection() {
    try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
            await initializeContract(accounts[0]);
        }
    } catch (error) {
        console.log('No existing connection:', error);
    }
}

async function connectWallet() {
    if (window.ethereum) {
        try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            await initializeContract(accounts[0]);
        } catch (error) {
            console.error('Wallet connection error:', error);
            alert('Wallet connection error: ' + error.message);
        }
    } else {
        alert('Please install MetaMask or another Ethereum wallet to use this feature.');
    }
}

async function initializeContract(userAccount) {
    try {
        // Check if ethers is available
        if (typeof ethers === 'undefined') {
            throw new Error('ethers.js library not loaded. Please refresh the page.');
        }
        
        userAddress = userAccount;
        
        // Initialize provider and signer
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        
        // Initialize contract with the signer
        contract = new ethers.Contract(contractAddress, abi, signer);
        
        // Update UI
        document.getElementById('walletStatus').textContent = `Connected: ${userAddress.substring(0, 6)}...${userAddress.substring(38)}`;
        document.getElementById('connectButton').textContent = 'Connected';
        document.getElementById('connectButton').disabled = true;
        
        console.log('Wallet connected:', userAddress);
        console.log('Contract initialized');
        
        // Test the contract
        await getNote();
        
    } catch (error) {
        console.error('Error initializing contract:', error);
        alert('Error: ' + error.message);
    }
}

async function setNote() {
    try {
        if (!contract) {
            alert("Please connect your wallet first!");
            return;
        }

        const noteInput = document.getElementById("note");
        const note = noteInput.value;
        
        if (!note) {
            alert("Please enter a note!");
            return;
        }

        const transactionStatus = document.getElementById("transactionStatus");
        transactionStatus.textContent = "Setting note...";
        transactionStatus.style.color = "blue";
        
        console.log("Setting note:", note);
        
        // Send transaction
        const tx = await contract.setNote(note);
        transactionStatus.textContent = "Transaction sent! Waiting for confirmation...";
        
        console.log("Transaction sent:", tx.hash);
        
        // Wait for confirmation
        await tx.wait();
        transactionStatus.textContent = "Note set successfully!";
        transactionStatus.style.color = "green";
        
        console.log("Transaction confirmed:", tx.hash);
        
        // Clear the input
        noteInput.value = "";
        
        // Refresh the displayed note
        await getNote();
        
    } catch (error) {
        console.error("Error setting note:", error);
        const transactionStatus = document.getElementById("transactionStatus");
        transactionStatus.textContent = "Error: " + error.message;
        transactionStatus.style.color = "red";
        
        // Check for common errors
        if (error.message.includes('gas') || error.message.includes('underpriced')) {
            transactionStatus.textContent += " - Make sure you have BNB for gas fees!";
        }
    }
}

async function getNote() {
    try {
        if (!contract) {
            document.getElementById("result").innerText = "Please connect wallet first";
            return;
        }

        const resultElement = document.getElementById("result");
        resultElement.textContent = "Loading...";
        
        // Call the contract function
        const note = await contract.getNote();
        
        // Display the result
        resultElement.textContent = note || "No note set yet";
        
        console.log("Retrieved note:", note);
        
    } catch (error) {
        console.error("Error getting note:", error);
        document.getElementById("result").innerText = "Error: " + error.message;
    }
}

// Listen for account changes
if (window.ethereum) {
    window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length === 0) {
            console.log('Please connect to MetaMask.');
            location.reload();
        } else {
            initializeContract(accounts[0]);
        }
    });

    window.ethereum.on('chainChanged', (chainId) => {
        console.log('Chain changed to:', chainId);
        location.reload();
    });
}