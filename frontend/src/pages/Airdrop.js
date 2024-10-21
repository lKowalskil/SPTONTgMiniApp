import React from 'react';
import { TonConnectUIProvider, TonConnectButton } from '@tonconnect/ui-react';

const Airdrop = () => {
    return (
        <TonConnectUIProvider manifestUrl="https://tgcasinoapp.fun/tonconnect-manifest.json">
            <div className="flex flex-col items-center justify-center bg-gray-900 min-h-screen p-4">
                {/* Main Airdrop Information Card */}
                <div className="bg-gray-800 rounded-lg shadow-lg p-8 max-w-md text-center">
                    <h1 className="text-4xl font-bold text-white mb-4">Welcome to Our Airdrop!</h1>
                    <p className="text-white mb-8">
                        Claim your tokens easily and securely. Connect your wallet to participate in our Airdrop.
                    </p>
                    <TonConnectButton className="btn btn-primary w-full max-w-xs hover:bg-blue-500 transition duration-200 ease-in-out">
                        Connect Wallet
                    </TonConnectButton>
                </div>

                {/* Additional Information Section */}
                <div className="bg-gray-800 rounded-lg shadow-lg p-6 max-w-md mt-8 text-left w-full">
                    <h2 className="text-2xl font-bold text-white mb-4">Airdrop Details</h2>
                    <p className="text-white mb-2">- Total Tokens: 350B</p>
                    <p className="text-white mb-2">- % of Emission: 70%</p>
                    <p className="text-white mb-2">- Distribution Date: TBD</p>
                    <p className="text-white">- Tokens distributed based on each user's percentage of total mined coins.</p>
                </div>

                {/* FAQ Section */}
                <div className="bg-gray-800 rounded-lg shadow-lg p-6 max-w-md mt-8 text-left">
                    <h2 className="text-2xl font-bold text-white mb-4">Frequently Asked Questions</h2>
                    <ul className="text-white list-disc list-inside">
                        <li>How do I participate? Simply connect your wallet and follow the prompts.</li>
                        <li>When will I receive my tokens? Tokens will be distributed on the date mentioned above.</li>
                        <li>What wallets are supported? We support TonConnect-compatible wallets.</li>
                        <li>Can I participate if I’m not a holder? Yes, anyone can participate in the airdrop.</li>
                        <li>What should I do if I face issues connecting my wallet? Please reach out to our support via the contact section below.</li>
                    </ul>
                </div>

                {/* Social Media Links Section */}
                <div className="mt-8 text-white w-full">
                    <h2 className="text-2xl font-bold mb-4">Follow Us</h2>
                    <div className="flex flex-col space-y-2 mt-2">
                        <a 
                            href="https://t.me/spacetoncolony" 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="hover:text-blue-400 transition duration-200 ease-in-out text-center p-2 bg-gray-700 rounded-md shadow-sm"
                        >
                            Telegram
                        </a>
                    </div>
                </div>

                {/* Contact Us Section */}
                <div className="mt-8 text-white w-full">
                    <h2 className="text-2xl font-bold mb-4">Contact Us</h2>
                    <p className="text-white mb-2">For any inquiries or support, feel free to reach out:</p>
                    <div className="flex space-x-4 mt-2">
                        <a 
                            href="mailto:unknownproger@proton.me" 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="hover:text-blue-400 transition duration-200 ease-in-out text-center p-2 bg-gray-700 rounded-md shadow-sm"
                        >
                            Email Us
                        </a>
                    </div>
                </div>
            </div>
        </TonConnectUIProvider>
    );
};

export default Airdrop;
