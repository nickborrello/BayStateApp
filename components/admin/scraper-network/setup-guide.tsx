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
                                <li>Network access to the callback URL</li>
                            </ul>
                        </section>

                        <section>
                            <h4 className="font-semibold text-gray-900">2. Register as a GitHub Runner</h4>
                            <p className="mt-1">Go to your repo Settings → Actions → Runners → New self-hosted runner</p>
                            <p className="mt-2">Follow the instructions GitHub provides, using these labels:</p>
                            <CodeBlock code="--labels self-hosted,docker" id="labels" copied={copied} onCopy={copyToClipboard} />
                        </section>

                        <section>
                            <h4 className="font-semibold text-gray-900">3. Build the Scraper Image</h4>
                            <p className="mt-1">Clone the repo and build the Docker image:</p>
                            <CodeBlock
                                code={`git clone https://github.com/Bay-State-Pet-and-Garden-Supply/BayStateApp.git
cd BayStateApp/scraper_backend
docker build -t baystate-scraper:latest .`}
                                id="docker-build"
                                copied={copied}
                                onCopy={copyToClipboard}
                            />
                        </section>

                        <section>
                            <h4 className="font-semibold text-gray-900">4. Start the Runner</h4>
                            <p className="mt-1">Run the GitHub Actions runner:</p>
                            <CodeBlock code="./run.sh" id="run" copied={copied} onCopy={copyToClipboard} />
                        </section>

                        <section>
                            <h4 className="font-semibold text-gray-900">5. Verify Connection</h4>
                            <p className="mt-1">
                                Once running, refresh this page. Your runner should appear in the grid above
                                with a green &quot;Ready&quot; status.
                            </p>
                        </section>
                    </div>
                </div>
            )}
        </div>
    );
}
