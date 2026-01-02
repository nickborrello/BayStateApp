'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Terminal, Copy, Check } from 'lucide-react';

interface CodeBlockProps {
    code: string;
    id: string;
    copied: string | null;
    onCopy: (text: string, id: string) => void;
}

function CodeBlock({ code, id, copied, onCopy }: CodeBlockProps) {
    return (
        <div className="relative mt-2 rounded-lg bg-gray-900 p-3">
            <button
                onClick={() => onCopy(code, id)}
                className="absolute right-2 top-2 rounded p-1 text-gray-400 hover:bg-gray-800 hover:text-white"
            >
                {copied === id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </button>
            <pre className="overflow-x-auto text-sm text-green-400">
                <code>{code}</code>
            </pre>
        </div>
    );
}

export function SetupGuide() {
    const [isOpen, setIsOpen] = useState(false);
    const [copied, setCopied] = useState<string | null>(null);

    const copyToClipboard = async (text: string, id: string) => {
        await navigator.clipboard.writeText(text);
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
    };

    return (
        <div className="rounded-lg border border-gray-200 bg-white">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex w-full items-center justify-between px-4 py-3 text-left"
            >
                <div className="flex items-center gap-2">
                    <Terminal className="h-5 w-5 text-gray-400" />
                    <span className="font-medium text-gray-900">Runner Setup Guide</span>
                </div>
                {isOpen ? (
                    <ChevronUp className="h-5 w-5 text-gray-400" />
                ) : (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                )}
            </button>

            {isOpen && (
                <div className="border-t border-gray-200 px-4 py-4 text-sm text-gray-600">
                    <div className="space-y-6">
                        <section>
                            <h4 className="font-semibold text-gray-900">1. Prerequisites</h4>
                            <ul className="mt-2 list-inside list-disc space-y-1">
                                <li>Docker installed on your machine</li>
                                <li>Access to the GitHub repository</li>
                                <li>Network access to this admin panel URL</li>
                            </ul>
                        </section>

                        <section>
                            <h4 className="font-semibold text-gray-900">2. Generate an API Key</h4>
                            <p className="mt-1">
                                Scroll up to the <strong>Runner Accounts</strong> section on this page.
                            </p>
                            <ul className="mt-2 list-inside list-disc space-y-1">
                                <li>Click <strong>Create Account</strong></li>
                                <li>Enter a unique runner name (e.g. <code className="bg-gray-100 px-1 rounded">my-server-1</code>)</li>
                                <li>Copy the generated <strong>API Key</strong> (starts with <code className="bg-gray-100 px-1 rounded">bsr_</code>)</li>
                            </ul>
                            <p className="mt-2 text-amber-600 font-medium italic">
                                Note: API keys are only displayed once. If lost, you must revoke and create a new key.
                            </p>
                        </section>

                        <section>
                            <h4 className="font-semibold text-gray-900">3. Add GitHub Secrets</h4>
                            <p className="mt-1">Go to your repository Settings → Secrets and variables → Actions → New repository secret:</p>
                            <ul className="mt-2 list-inside list-disc space-y-1 font-mono text-xs">
                                <li>SCRAPER_API_URL (this app&apos;s URL)</li>
                                <li>SCRAPER_API_KEY (the key from step 2)</li>
                            </ul>
                        </section>

                        <section>
                            <h4 className="font-semibold text-gray-900">4. Register as a GitHub Runner</h4>
                            <p className="mt-1">Go to your repo Settings → Actions → Runners → New self-hosted runner</p>
                            <p className="mt-2">Follow the instructions GitHub provides, using these labels:</p>
                            <CodeBlock code="--labels self-hosted,docker" id="labels" copied={copied} onCopy={copyToClipboard} />
                        </section>

                        <section>
                            <h4 className="font-semibold text-gray-900">5. Quick Install (Recommended)</h4>
                            <p className="mt-1">Run the one-line installer on your runner machine:</p>
                            <CodeBlock
                                code={`curl -fsSL https://raw.githubusercontent.com/Bay-State-Pet-and-Garden-Supply/BayStateScraper/main/install.py | python3 -`}
                                id="curl-install"
                                copied={copied}
                                onCopy={copyToClipboard}
                            />
                            <p className="mt-2 text-gray-500">The installer will prompt you for your API key and configure everything automatically.</p>
                        </section>

                        <section>
                            <h4 className="font-semibold text-gray-900">6. Manual Install (Alternative)</h4>
                            <p className="mt-1">Clone the repo and build the Docker image manually:</p>
                            <CodeBlock
                                code={`git clone https://github.com/Bay-State-Pet-and-Garden-Supply/BayStateScraper.git
cd BayStateScraper
docker build -t baystate-scraper:latest .`}
                                id="docker-build"
                                copied={copied}
                                onCopy={copyToClipboard}
                            />
                        </section>

                        <section>
                            <h4 className="font-semibold text-gray-900">7. Start the Runner</h4>
                            <p className="mt-1">Run the GitHub Actions runner:</p>
                            <CodeBlock code="./run.sh" id="run" copied={copied} onCopy={copyToClipboard} />
                        </section>

                        <section>
                            <h4 className="font-semibold text-gray-900">8. Verify Connection</h4>
                            <p className="mt-1">
                                Once running, your runner will appear in the <strong>Connected Runners</strong> grid above
                                with a green &quot;Ready&quot; status.
                            </p>
                        </section>
                    </div>
                </div>
            )}
        </div>
    );
}
