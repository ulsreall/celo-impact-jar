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

const DEPLOYED_IMPACT_JAR = '0xf2b690a0b0cab089ccb84beec5b40afcb9661040' as Address;
const CONTRACT_ADDRESS = (import.meta.env.VITE_IMPACT_JAR_ADDRESS || DEPLOYED_IMPACT_JAR) as Address;
const TOKEN_ADDRESS = (import.meta.env.VITE_DEFAULT_TOKEN_ADDRESS || '0x765DE816845861e75A25fCA122bb6898B8B1282a') as Address;
const isConfigured = CONTRACT_ADDRESS !== zeroAddress;
const publicClient = createPublicClient({ chain: celo, transport: http('https://forno.celo.org') });

const demoCampaigns: Campaign[] = [
  {
    id: 0n,
    name: 'Community Food Jar',
    description: 'A public jar for local food support, funded with MiniPay-friendly stablecoin tips.',
    recipient: zeroAddress,
    active: true,
    totalRaised: 128750000000000000000n,
  },
  {
    id: 1n,
    name: 'School Supplies Jar',
    description: 'Collect micro-donations for notebooks, pens, and learning kits for local students.',
    recipient: zeroAddress,
    active: true,
    totalRaised: 73300000000000000000n,
  },
];

const explorerUrl = `https://celoscan.io/address/${CONTRACT_ADDRESS}`;

function shortAddress(address: Address) {
  if (!address || address === zeroAddress) return 'Not configured';
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function Nav({ isMiniPay, account, onConnect }: { isMiniPay: boolean; account: Address | null; onConnect: () => void }) {
  return (
    <nav className="nav">
      <a className="nav-brand" href="#top" aria-label="KindJar home">
        <span className="brand-mark">◎</span>
        <span>KindJar</span>
      </a>
      <div className="nav-links">
        <a href="#donate">Donate</a>
        <a href="#agent" className="agent-link">AI Agent</a>
        <a href="#about">About</a>
        <a href="https://github.com/ulsreall/celo-impact-jar" target="_blank" rel="noreferrer">GitHub</a>
        <button className="btn-primary nav-wallet" onClick={onConnect}>
          {account ? shortAddress(account) : isMiniPay ? 'MiniPay Ready' : 'Connect Wallet'}
        </button>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <header className="hero" id="top">
      <div className="hero-grid-bg" />
      <div className="hero-copy">
        <div className="badge"><span>🚢</span> Built for Celo Proof of Ship</div>
        <h1>Micro-donations for real local impact.</h1>
        <p>
          A MiniPay-compatible Celo mini app where communities fund transparent impact jars with stablecoins — guided by an AI donation advisor.
        </p>
        <div className="hero-actions">
          <a className="btn-cta" href="#donate">Start donating</a>
          <a className="btn-outline" href="#agent">Ask the AI Agent</a>
        </div>
        <div className="trust-row" aria-label="Project trust indicators">
          <span>✓ Celo Mainnet</span>
          <span>✓ MiniPay-ready</span>
          <span>✓ Open-source</span>
          <span>✓ Self-custody</span>
        </div>
      </div>
      <div className="hero-visual" aria-hidden="true">
        <div className="phone-frame">
          <div className="phone-top" />
          <div className="phone-card active">
            <span className="mini-label">KindJar</span>
            <strong>Community Food</strong>
            <div className="mini-progress"><span style={{ width: '82%' }} /></div>
            <small>128.75 cUSD raised</small>
          </div>
          <div className="phone-card">
            <span className="mini-label">AI score</span>
            <strong>100 / 100</strong>
            <small>Top pick for donors</small>
          </div>
          <div className="phone-action">Send 1 cUSD →</div>
        </div>
        <div className="float-chip chip-one">MiniPay</div>
        <div className="float-chip chip-two">AI Agent</div>
      </div>
    </header>
  );
}

function Stats({ campaigns }: { campaigns: Campaign[] }) {
  const totalRaised = campaigns.reduce((sum, c) => sum + Number(formatUnits(c.totalRaised, 18)), 0);
  const activeCount = campaigns.filter((c) => c.active).length;
  return (
    <section className="stats" aria-label="Impact stats">
      <div className="stat-card"><div className="stat-value">{activeCount}</div><div className="stat-label">Active Jars</div></div>
      <div className="stat-card"><div className="stat-value">{totalRaised.toFixed(1)}</div><div className="stat-label">cUSD Raised</div></div>
      <div className="stat-card"><div className="stat-value">14M+</div><div className="stat-label">MiniPay Users</div></div>
      <div className="stat-card"><div className="stat-value">100%</div><div className="stat-label">Onchain Proof</div></div>
    </section>
  );
}

function DonatePanel({
  campaigns,
  selectedCampaign,
  setSelectedCampaign,
  selected,
  amount,
  setAmount,
  note,
  setNote,
  status,
  donate,
}: {
  campaigns: Campaign[];
  selectedCampaign: bigint;
  setSelectedCampaign: (id: bigint) => void;
  selected?: Campaign;
  amount: string;
  setAmount: (amount: string) => void;
  note: string;
  setNote: (note: string) => void;
  status: string;
  donate: () => void;
}) {
  return (
    <section className="panel donate-panel" id="donate">
      <div className="section-kicker">Stablecoin micro-giving</div>
      <div className="donate-grid">
        <div className="donate-form">
          <h2>Support an impact jar</h2>
          <p className="subtitle">Choose a local campaign and send a transparent micro-donation with cUSD/USDm.</p>

          <label>
            Campaign
            <select value={selectedCampaign.toString()} onChange={(e) => setSelectedCampaign(BigInt(e.target.value))}>
              {campaigns.map((c) => <option key={c.id.toString()} value={c.id.toString()}>{c.name}</option>)}
            </select>
          </label>

          <div className="quick-amounts">
            {['1', '2.5', '5', '10'].map((value) => (
              <button key={value} type="button" className={amount === value ? 'active' : ''} onClick={() => setAmount(value)}>
                {value} cUSD
              </button>
            ))}
          </div>

          <label>
            Custom amount
            <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" placeholder="1.0" />
          </label>
          <label>
            Public note
            <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={80} placeholder="Your message..." />
          </label>
          <button className="btn-donate" onClick={donate}>Send Micro-Donation</button>
          <div className="status-box">{status}</div>
        </div>

        <aside className="jar-card">
          <div className="jar-eyebrow">Selected Jar</div>
          <h3>{selected?.name}</h3>
          <p>{selected?.description}</p>
          <div className="jar-raised">{formatUnits(selected?.totalRaised || 0n, 18)}</div>
          <div className="jar-token">cUSD / USDm raised on Celo</div>
          <div className="jar-mode"><span className="dot-live" />{isConfigured ? 'Live on Celo Mainnet' : 'Demo mode'}</div>
        </aside>
      </div>
    </section>
  );
}

function About() {
  return (
    <section className="panel" id="about">
      <div className="section-kicker">Why it matters</div>
      <h2>Built for practical Celo usage, not just a demo.</h2>
      <p className="subtitle">KindJar focuses on small payments, transparent public-good funding, and mobile-first UX for MiniPay users.</p>
      <div className="features">
        <div className="feature-card"><div className="feature-icon">📱</div><strong>MiniPay Ready</strong><span>Detects MiniPay and reduces wallet friction for mobile-first donors.</span></div>
        <div className="feature-card"><div className="feature-icon">🤖</div><strong>AI Donation Advisor</strong><span>Ranks jars, explains risk, and guides users with campaign intelligence.</span></div>
        <div className="feature-card"><div className="feature-icon">⛓️</div><strong>Onchain Proof</strong><span>Every donation is transparent, verifiable, and linked to Celo mainnet data.</span></div>
        <div className="feature-card"><div className="feature-icon">🌍</div><strong>Local Impact</strong><span>Useful for food aid, education supplies, community goods, and creator support.</span></div>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section className="panel">
      <div className="section-kicker">Flow</div>
      <h2>Three steps from donation to impact.</h2>
      <div className="steps">
        <div className="step-card"><div className="step-num">1</div><h4>Choose a Jar</h4><p>Pick a campaign or ask the AI Agent which jar has the strongest impact signal.</p></div>
        <div className="step-card"><div className="step-num">2</div><h4>Send Stablecoin</h4><p>Donate cUSD/USDm using MiniPay or any injected Celo wallet. You approve every transaction.</p></div>
        <div className="step-card"><div className="step-num">3</div><h4>Verify Onchain</h4><p>Donation events and totals are transparent on Celo, making the impact trail public.</p></div>
      </div>
    </section>
  );
}

function ContractInfo() {
  return (
    <section className="panel">
      <div className="section-kicker">Verification</div>
      <h2>Contract & deployment</h2>
      <p className="subtitle">Public infrastructure for Celo Proof of Ship submission.</p>
      <div className="contract-info">
        <div className="info-item"><div className="info-label">Network</div><div className="info-value">Celo Mainnet (42220)</div></div>
        <div className="info-item"><div className="info-label">Contract</div><div className="info-value"><a href={explorerUrl} target="_blank" rel="noreferrer">{CONTRACT_ADDRESS}</a></div></div>
        <div className="info-item"><div className="info-label">Default Token</div><div className="info-value"><a href={`https://celoscan.io/address/${TOKEN_ADDRESS}`} target="_blank" rel="noreferrer">USDm / cUSD compatible</a></div></div>
        <div className="info-item"><div className="info-label">Source</div><div className="info-value"><a href="https://github.com/ulsreall/celo-impact-jar" target="_blank" rel="noreferrer">Open-source on GitHub</a></div></div>
      </div>
    </section>
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

  const selected = useMemo(() => campaigns.find((c) => c.id === selectedCampaign) || campaigns[0], [campaigns, selectedCampaign]);

  useEffect(() => {
    const miniPay = Boolean(window.ethereum?.isMiniPay);
    setIsMiniPay(miniPay);
    if (miniPay) void connectWallet();
    if (isConfigured) void loadCampaigns();
  }, []);

  async function connectWallet() {
    if (!window.ethereum) { setStatus('No injected wallet found. Open inside MiniPay or use a Celo browser wallet.'); return; }
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
    } catch (e) { console.error(e); setStatus('Could not load contract campaigns yet. Showing fallback demo data.'); }
  }

  async function donate() {
    if (!isConfigured) { setStatus('Demo mode: set VITE_IMPACT_JAR_ADDRESS before real donations.'); return; }
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
      <Nav isMiniPay={isMiniPay} account={account} onConnect={connectWallet} />
      <Hero />
      <Stats campaigns={campaigns} />
      <main>
        <DonatePanel
          campaigns={campaigns}
          selectedCampaign={selectedCampaign}
          setSelectedCampaign={setSelectedCampaign}
          selected={selected}
          amount={amount}
          setAmount={setAmount}
          note={note}
          setNote={setNote}
          status={status}
          donate={donate}
        />
        <AgentInsights campaigns={campaigns} />
        <About />
        <HowItWorks />
        <ContractInfo />
      </main>
      <footer className="footer">
        <div className="footer-left">KindJar © 2026 — Built for Celo Proof of Ship</div>
        <div className="footer-links">
          <a href="https://github.com/ulsreall/celo-impact-jar" target="_blank" rel="noreferrer">GitHub</a>
          <a href={explorerUrl} target="_blank" rel="noreferrer">Contract</a>
          <a href="https://talent.app/~/earn/celo-proof-of-ship" target="_blank" rel="noreferrer">Proof of Ship</a>
          <a href="https://docs.celo.org" target="_blank" rel="noreferrer">Celo Docs</a>
        </div>
      </footer>
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
