const { ethers } = require("ethers");
require("dotenv").config();
const fs = require("fs");
const readline = require("readline");

// Ambil private key dari .env
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const TEA_RPC_URL = "https://tea-sepolia.g.alchemy.com/public";

if (!PRIVATE_KEY) {
    console.error("Harap isi PRIVATE_KEY di file .env");
    process.exit(1);
}

const provider = new ethers.JsonRpcProvider(TEA_RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

// Fungsi untuk mengirim TEA ke daftar alamat
const sendTea = async (addresses) => {
    const sentAddresses = []; // Array untuk menyimpan alamat yang sudah dikirim

    for (let address of addresses) {
        try {
            // Validasi alamat Ethereum
            if (!ethers.isAddress(address)) {
                console.error(`Alamat ${address} tidak valid. Melewati...`);
                continue;
            }

            const tx = await wallet.sendTransaction({
                to: address,
                value: ethers.parseEther("0.01"), // Kirim 0.01 TEA ke setiap alamat
            });
            console.log(`Mengirim 0.01 TEA ke ${address}. Tx Hash: ${tx.hash}`);
            await tx.wait();

            // Simpan alamat yang berhasil dikirim ke array
            sentAddresses.push(address);
        } catch (error) {
            console.error(`Gagal mengirim ke ${address}:`, error);
        }
    }

    // Simpan alamat yang sudah dikirim ke file
    fs.writeFileSync("sent_addresses.txt", sentAddresses.join("\n"), "utf8");
    console.log("Daftar alamat yang sudah dikirim token disimpan di 'sent_addresses.txt'");
};

// Fungsi untuk meminta input daftar alamat secara manual
const askForCustomAddresses = () => {
    return new Promise((resolve) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });

        console.log("Masukkan daftar alamat Ethereum satu per baris. Ketik 'done' jika sudah selesai:");
        let addresses = [];

        rl.on("line", (line) => {
            if (line.trim().toLowerCase() === "done") {
                rl.close();
                resolve(addresses);
            } else {
                addresses.push(line.trim());
            }
        });
    });
};

(async () => {
    // Langsung minta daftar alamat kustom (tanpa opsi untuk menghasilkan alamat acak)
    const addresses = await askForCustomAddresses();
    
    if (addresses.length === 0) {
        console.error("Tidak ada alamat yang dimasukkan.");
        process.exit(1);
    }

    console.log("Daftar alamat yang akan dikirim token:", addresses);

    await sendTea(addresses);
})();
