import React, { useEffect, useMemo, useState } from 'react';
import ReactDOM from 'react-dom/client';
import {
  createPublicClient,
  createWalletClient,
  custom,
  formatUnits,
  http,
  parseUnits,
  zeroAddress,
  type Address,
} from 'viem';
import { celo } from 'viem/chains';
import { ERC20_ABI, IMPACT_JAR_ABI } from './abi';
import AgentInsights from './AgentInsights';
import AgentChat from './AgentChat';
import './styles.css';

declare global {
  interface Window {
    ethereum?: { isMiniPay?: boolean; request: (args: { method: string; params?: unknown[] }) => Promise<unknown> };
  }
}

export type Campaign = {
  id: bigint;
  name: string;
  description: string;
  recipient: Address;
  active: boolean;
  totalRaised: bigint;
};

const CONTRACT_ADDRESS = (import.meta.env.VITE_IMPACT_JAR_ADDRESS || zeroAddress) as Address;
const TOKEN_ADDRESS = (import.meta.env.VITE_DEFAULT_TOKEN_ADDRESS || '0x765DE816845861e75A25fCA122bb6898B8B1282a') as Address;
const isConfigured = CONTRACT_ADDRESS !== zeroAddress;
const publicClient = createPublicClient({ chain: celo, transport: http('https://forno.celo.org') });

const demoCampaigns: Campaign[] = [
  { id: 0n, name: 'Community Food Jar', description: 'A small public jar for local food support, funded with MiniPay-friendly stablecoin tips.', recipient: zeroAddress, active: true, totalRaised: 128750000000000000000n },
  { id: 1n, name: 'School Supplies Jar', description: 'Collect micro-donations for notebooks, pens, and simple learning kits.', recipient: zeroAddress, active: true, totalRaised: 73300000000000000000n },
];

function Nav({ isMiniPay, onConnect }: { isMiniPay: boolean; onConnect: () => void }) {
  return (
    <nav className="nav">
      <div className="nav-brand"><span className="dot" /> Celo Impact Jar</div>
      <div className="nav-links">
        <a href="#donate">Donate</a>
        <a href="#agent" className="agent-link">🤖 AI Agent</a>
        <a href="#about">About</a>
        <a href="https://github.com/ulsreall/celo-impact-jar" target="_blank">GitHub</a>
        {!isMiniPay && <button className="btn-primary" onClick={onConnect}>Connect Wallet</button>}
      </div>
    </nav>
  );
}

function Hero({ isMiniPay, onConnect }: { isMiniPay: boolean; onConnect: () => void }) {
  return (
    <section className="hero">
      <div className="badge">Built for Celo Proof of Ship</div>
      <h1>Celo Impact Jar</h1>
      <p>MiniPay-compatible micro-donation jars for local impact campaigns. Small stablecoin payments, transparent onchain support.</p>
      <div className="hero-actions">
        <a className="btn-cta" href="#donate">Donate Now</a>
        <a className="btn-outline" href="https://talent.app/~/earn/celo-proof-of-ship" target="_blank">Proof of Ship ↗</a>
      </div>
    </section>
  );
}

function Stats() {
  return (
    <div className="stats">
      <div className="stat-card"><div className="stat-value">4</div><div className="stat-label">Active Jars</div></div>
      <div className="stat-card"><div className="stat-value">Celo</div><div className="stat-label">Mainnet</div></div>
      <div className="stat-card"><div className="stat-value">14M+</div><div className="stat-label">MiniPay Users</div></div>
      <div className="stat-card"><div className="stat-value">MIT</div><div className="stat-label">Open Source</div></div>
    </div>
  );
}

function App() {
  const [account, setAccount] = useState<Address | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>(demoCampaigns);
  const [selectedCampaign, setSelectedCampaign] = useState<bigint>(0n);
  const [amount, setAmount] = useState('1');
  const [note, setNote] = useState('MiniPay micro-donation');
  const [status, setStatus] = useState('Ready. Connect MiniPay or any injected Celo wallet.');
  const [isMiniPay, setIsMiniPay] = useState(false);

  const selected = useMemo(
    () => campaigns.find((c) => c.id === selectedCampaign) || campaigns[0],
    [campaigns, selectedCampaign],
  );

  useEffect(() => {
    const miniPay = Boolean(window.ethereum?.isMiniPay);
    setIsMiniPay(miniPay);
    if (miniPay) void connectWallet();
    if (isConfigured) void loadCampaigns();
  }, []);

  async function connectWallet() {
    if (!window.ethereum) { setStatus('No injected wallet found. Open inside MiniPay or use a browser wallet on Celo.'); return; }
    const walletClient = createWalletClient({ chain: celo, transport: custom(window.ethereum) });
    const [address] = await walletClient.requestAddresses();
    setAccount(address);
    setStatus(window.ethereum.isMiniPay ? 'MiniPay detected. Wallet connected automatically.' : 'Wallet connected.');
  }

  async function loadCampaigns() {
    try {
      const count = await publicClient.readContract({ address: CONTRACT_ADDRESS, abi: IMPACT_JAR_ABI, functionName: 'campaignCount' });
      const loaded = await Promise.all(
        Array.from({ length: Number(count) }, async (_, i) => {
          const r = await publicClient.readContract({ address: CONTRACT_ADDRESS, abi: IMPACT_JAR_ABI, functionName: 'campaigns', args: [BigInt(i)] });
          return { id: BigInt(i), name: r[0], description: r[1], recipient: r[2], active: r[3], totalRaised: r[4] };
        }),
      );
      if (loaded.length) { setCampaigns(loaded); setSelectedCampaign(loaded[0].id); }
    } catch (e) { console.error(e); setStatus('Could not load contract campaigns yet. Showing demo data.'); }
  }

  async function donate() {
    if (!isConfigured) { setStatus('Demo mode: deploy ImpactJar and set VITE_IMPACT_JAR_ADDRESS before real donations.'); return; }
    if (!window.ethereum || !account) { await connectWallet(); return; }
    const value = parseUnits(amount || '0', 18);
    if (value <= 0n) { setStatus('Amount must be greater than zero.'); return; }
    const walletClient = createWalletClient({ chain: celo, transport: custom(window.ethereum) });
    setStatus('Step 1/2: approving stablecoin spend...');
    const approveHash = await walletClient.writeContract({ account, address: TOKEN_ADDRESS, abi: ERC20_ABI, functionName: 'approve', args: [CONTRACT_ADDRESS, value] });
    await publicClient.waitForTransactionReceipt({ hash: approveHash });
    setStatus('Step 2/2: sending donation to ImpactJar...');
    const donateHash = await walletClient.writeContract({ account, address: CONTRACT_ADDRESS, abi: IMPACT_JAR_ABI, functionName: 'donate', args: [selectedCampaign, TOKEN_ADDRESS, value, note] });
    await publicClient.waitForTransactionReceipt({ hash: donateHash });
    setStatus(`Donation shipped on Celo: ${donateHash}`);
    await loadCampaigns();
  }

  return (
    <>
      <Nav isMiniPay={isMiniPay} onConnect={connectWallet} />
      <Hero isMiniPay={isMiniPay} onConnect={connectWallet} />
      <Stats />

      <main>
        {/* Donate */}
        <section className="panel grid" id="donate">
          <div>
            <h2>Support a jar</h2>
            <p className="subtitle">Choose a campaign and send a micro-donation with stablecoin.</p>
            <label>
              Campaign
              <select value={selectedCampaign.toString()} onChange={(e) => setSelectedCampaign(BigInt(e.target.value))}>
                {campaigns.map((c) => <option key={c.id.toString()} value={c.id.toString()}>{c.name}</option>)}
              </select>
            </label>
            <label>
              Amount (USDm / cUSD)
              <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" placeholder="1.0" />
            </label>
            <label>
              Public note
              <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={80} placeholder="Your message..." />
            </label>
            <button className="btn-donate" onClick={donate}>Send Micro-Donation</button>
            <div className="status-box">{status}</div>
          </div>

          <div className="jar-card">
            <div className="jar-eyebrow">Selected Jar</div>
            <h3>{selected?.name}</h3>
            <p>{selected?.description}</p>
            <div className="jar-raised">{formatUnits(selected?.totalRaised || 0n, 18)}</div>
            <div className="jar-token">USDm raised on Celo</div>
            <div className="jar-mode">
              <span className="dot-live" />
              {isConfigured ? 'Live on Celo Mainnet' : 'Demo mode'}
            </div>
          </div>
        </section>

        {/* AI Agent Insights */}
        <AgentInsights campaigns={campaigns} />

        {/* Features */}
        <section className="panel" id="about">
          <h2>Why Celo Impact Jar?</h2>
          <p className="subtitle">Built for the real-world use case that Celo cares about.</p>
          <div className="features">
            <div className="feature-card">
              <div className="feature-icon">📱</div>
              <strong>MiniPay Ready</strong>
              <span>Detects MiniPay and auto-connects. No wallet friction for 14M+ global users.</span>
            </div>
            <div className="feature-card">
              <div className="feature-icon">⛓️</div>
              <strong>Onchain Proof</strong>
              <span>Every donation emits a public event on Celo mainnet. Transparent and verifiable.</span>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🌍</div>
              <strong>Local Impact</strong>
              <span>Food aid, school supplies, creator support, community public goods.</span>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔒</div>
              <strong>Self-Custody</strong>
              <span>No seed phrases. No custody. Users approve every transaction themselves.</span>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="panel">
          <h2>How it works</h2>
          <p className="subtitle">Three steps from setup to impact.</p>
          <div className="steps">
            <div className="step-card">
              <div className="step-num">1</div>
              <h4>Create a Jar</h4>
              <p>Project owner creates a donation campaign with a name, description, and recipient address.</p>
            </div>
            <div className="step-card">
              <div className="step-num">2</div>
              <h4>Receive Donations</h4>
              <p>Supporters send stablecoin (USDm, cUSD, USDC, USDT) directly to the jar via MiniPay or any Celo wallet.</p>
            </div>
            <div className="step-card">
              <div className="step-num">3</div>
              <h4>Withdraw to Impact</h4>
              <p>Campaign recipient withdraws funds and uses them for real-world local impact.</p>
            </div>
          </div>
        </section>

        {/* Contract info */}
        <section className="panel">
          <h2>Contract</h2>
          <p className="subtitle">Verified on Celo Mainnet.</p>
          <div className="contract-info">
            <div className="info-item">
              <div className="info-label">Network</div>
              <div className="info-value">Celo Mainnet (42220)</div>
            </div>
            <div className="info-item">
              <div className="info-label">Contract</div>
              <div className="info-value"><a href={`https://celoscan.io/address/${CONTRACT_ADDRESS}`} target="_blank">{CONTRACT_ADDRESS}</a></div>
            </div>
            <div className="info-item">
              <div className="info-label">Default Token</div>
              <div className="info-value"><a href={`https://celoscan.io/address/${TOKEN_ADDRESS}`} target="_blank">USDm</a></div>
            </div>
            <div className="info-item">
              <div className="info-label">License</div>
              <div className="info-value">MIT — Fully Open Source</div>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="footer-left">Celo Impact Jar © 2026</div>
        <div className="footer-links">
          <a href="https://github.com/ulsreall/celo-impact-jar" target="_blank">GitHub</a>
          <a href="https://celoscan.io/address/0xf2b690a0b0cab089ccb84beec5b40afcb9661040" target="_blank">Contract</a>
          <a href="https://talent.app/~/earn/celo-proof-of-ship" target="_blank">Proof of Ship</a>
          <a href="https://docs.celo.org" target="_blank">Celo Docs</a>
        </div>
      </footer>
      {/* AI Agent Chat Widget */}
      <AgentChat
        campaigns={campaigns}
        walletConnected={!!account}
        isMiniPay={isMiniPay}
        selectedCampaignId={selectedCampaign}
        onSelectCampaign={(id) => setSelectedCampaign(id)}
      />

    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
