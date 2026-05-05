// AI Agent Engine for KindJar
// Intelligent rules-based agent that analyzes campaigns, recommends jars,
// and guides users through the donation process.

import { formatUnits, type Address } from 'viem';

export type AgentRole = 'advisor' | 'analyzer' | 'guide' | 'scout';

export type CampaignData = {
  id: bigint;
  name: string;
  description: string;
  recipient: Address;
  active: boolean;
  totalRaised: bigint;
};

export type AgentMessage = {
  id: string;
  role: 'user' | 'agent';
  content: string;
  timestamp: number;
  suggestions?: string[];
};

export type AgentContext = {
  campaigns: CampaignData[];
  walletConnected: boolean;
  isMiniPay: boolean;
  selectedCampaignId: bigint;
};

// ─── Campaign Scoring Engine ────────────────────────────────────────

type CampaignScore = {
  campaign: CampaignData;
  score: number;
  reason: string;
  badge: string;
};

function scoreCampaign(c: CampaignData): CampaignScore {
  const raised = Number(formatUnits(c.totalRaised, 18));
  let score = 50; // base
  const reasons: string[] = [];

  // Activity bonus
  if (c.active) {
    score += 20;
    reasons.push('currently active');
  }

  // Engagement scoring
  if (raised > 100) {
    score += 25;
    reasons.push(`strong community support (${raised.toFixed(1)} cUSD raised)`);
  } else if (raised > 50) {
    score += 15;
    reasons.push(`growing support (${raised.toFixed(1)} cUSD raised)`);
  } else if (raised > 10) {
    score += 8;
    reasons.push(`early momentum (${raised.toFixed(1)} cUSD raised)`);
  } else if (raised > 0) {
    score += 5;
    reasons.push('just started receiving donations');
  }

  // Name-based category bonus
  const name = c.name.toLowerCase();
  if (name.includes('food') || name.includes('water') || name.includes('health')) {
    score += 10;
    reasons.push('essential needs category');
  }
  if (name.includes('school') || name.includes('education') || name.includes('learn')) {
    score += 8;
    reasons.push('education impact');
  }
  if (name.includes('community') || name.includes('public')) {
    score += 5;
    reasons.push('community good');
  }

  // Badge assignment
  let badge = '🌱';
  if (score >= 85) badge = '🌟';
  else if (score >= 70) badge = '🔥';
  else if (score >= 55) badge = '💪';

  return {
    campaign: c,
    score: Math.min(score, 100),
    reason: reasons.join(', ') || 'new campaign',
    badge,
  };
}

// ─── Agent Intelligence ─────────────────────────────────────────────

function generateAnalysis(ctx: AgentContext): string {
  const { campaigns } = ctx;
  if (!campaigns.length) return 'No active campaigns found. Check back later!';

  const scored = campaigns.map(scoreCampaign).sort((a, b) => b.score - a.score);
  const top = scored[0];
  const totalRaised = campaigns.reduce((sum, c) => sum + Number(formatUnits(c.totalRaised, 18)), 0);
  const activeCount = campaigns.filter((c) => c.active).length;

  let analysis = `📊 **Campaign Intelligence Report**\n\n`;
  analysis += `• **${activeCount}** active jars across the platform\n`;
  analysis += `• **${totalRaised.toFixed(2)} cUSD** total raised on Celo mainnet\n`;
  analysis += `• All donations are onchain — fully transparent & verifiable\n\n`;
  analysis += `🏆 **Top Recommendation:**\n`;
  analysis += `${top.badge} **${top.campaign.name}** (Score: ${top.score}/100)\n`;
  analysis += `↳ ${top.reason}\n`;
  analysis += `↳ Raised: ${formatUnits(top.campaign.totalRaised, 18)} cUSD\n\n`;

  if (scored.length > 1) {
    analysis += `📋 **All Campaigns Ranked:**\n`;
    scored.forEach((s, i) => {
      analysis += `${i + 1}. ${s.badge} ${s.campaign.name} — ${s.score}/100 (${s.reason})\n`;
    });
  }

  return analysis;
}

function getDonationGuide(ctx: AgentContext): string {
  const selected = ctx.campaigns.find((c) => c.id === ctx.selectedCampaignId);
  let guide = `🎯 **How to Donate on KindJar**\n\n`;

  if (!ctx.walletConnected) {
    guide += `📱 **Step 1: Connect your wallet**\n`;
    if (ctx.isMiniPay) {
      guide += `MiniPay detected! Your wallet will auto-connect.\n\n`;
    } else {
      guide += `Click "Connect Wallet" or open this app in MiniPay.\n\n`;
    }
  } else {
    guide += `✅ Wallet connected!\n\n`;
  }

  guide += `💰 **${ctx.walletConnected ? 'Step 1' : 'Step 2'}: Choose a jar**\n`;
  if (selected) {
    guide += `Currently selected: **${selected.name}**\n`;
    guide += `"${selected.description}"\n\n`;
  } else {
    guide += `Pick a campaign from the dropdown above.\n\n`;
  }

  guide += `💵 **${ctx.walletConnected ? 'Step 2' : 'Step 3'}: Set amount**\n`;
  guide += `Enter how much cUSD/USDm to donate. Even 1 cUSD makes a difference!\n\n`;
  guide += `✅ **${ctx.walletConnected ? 'Step 3' : 'Step 4'}: Send**\n`;
  guide += `Click "Send Micro-Donation" — you'll approve the token spend first, then confirm the donation. Both happen onchain on Celo.\n\n`;
  guide += `🔒 All transactions are self-custody. You sign every step.`;

  return guide;
}

function getJarAdvice(ctx: AgentContext, query: string): string {
  const q = query.toLowerCase();

  // Find matching campaigns
  const scored = ctx.campaigns.map(scoreCampaign).sort((a, b) => b.score - a.score);

  if (q.includes('food') || q.includes('eat') || q.includes('hungry') || q.includes('makan')) {
    const food = ctx.campaigns.find((c) => c.name.toLowerCase().includes('food'));
    if (food) {
      return `🍚 **Community Food Jar** is perfect for you!\n\nThis jar supports local food security — small stablecoin donations that help families in need. Every micro-donation goes directly to the recipient address on Celo.\n\nRaised so far: **${formatUnits(food.totalRaised, 18)} cUSD**\n\nReady to donate? Select "Community Food Jar" from the dropdown!`;
    }
  }

  if (q.includes('school') || q.includes('education') || q.includes('learn') || q.includes('study') || q.includes('sekolah')) {
    const school = ctx.campaigns.find((c) => c.name.toLowerCase().includes('school'));
    if (school) {
      return `📚 **School Supplies Jar** helps provide notebooks, pens, and learning kits.\n\nMicro-donations from the community add up — your 1 cUSD contribution buys real supplies for students.\n\nRaised so far: **${formatUnits(school.totalRaised, 18)} cUSD**\n\nSelect "School Supplies Jar" to support education!`;
    }
  }

  if (q.includes('best') || q.includes('recommend') || q.includes('suggest') || q.includes('help') || q.includes('mana') || q.includes('bagus')) {
    const top = scored[0];
    return `🌟 My recommendation: **${top.campaign.name}**\n\n${top.badge} Score: ${top.score}/100\n↳ ${top.reason}\n↳ Raised: ${formatUnits(top.campaign.totalRaised, 18)} cUSD\n\nThis jar has the strongest community support right now. Want to donate to it?`;
  }

  if (q.includes('how') || q.includes('cara') || q.includes('gimana') || q.includes('tutorial') || q.includes('guide')) {
    return getDonationGuide(ctx);
  }

  if (q.includes('safe') || q.includes('aman') || q.includes('scam') || q.includes('trust') || q.includes('legit')) {
    return `🔒 **Safety on KindJar**\n\n✅ All contracts are open-source on GitHub\n✅ Every donation is onchain — verifiable on Celoscan\n✅ Self-custody: YOU sign every transaction\n✅ No seed phrases stored, no custody risk\n✅ Contract: 0xf2b6...040 on Celo Mainnet\n\nYou can verify every transaction yourself at celoscan.io. That's the beauty of onchain transparency!`;
  }

  if (q.includes('what') || q.includes('apa') || q.includes('tentang') || q.includes('about') || q.includes('siapa')) {
    return `🌱 **What is KindJar?**\n\nA MiniPay-compatible micro-donation platform on Celo. Think of it as "tip jars for real-world impact" — small stablecoin donations that fund local campaigns.\n\n**Key features:**\n• Works on MiniPay (14M+ users)\n• Donate with cUSD, USDm, USDC, USDT\n• Every donation is onchain & transparent\n• 3 steps: Pick jar → Set amount → Send\n\nBuilt for **Celo Proof of Ship** 🚢`;
  }

  // Default: full analysis
  return generateAnalysis(ctx);
}

// ─── Main Agent Function ────────────────────────────────────────────

const WELCOME_MSG = `👋 **Hi! I'm the KindJar AI Agent.**

I help you make smarter donations on Celo. Here's what I can do:

• 📊 **Analyze campaigns** — see which jars are performing best
• 🌟 **Recommend jars** — get personalized suggestions
• 🎯 **Guide donations** — step-by-step help
• 🔍 **Check safety** — verify onchain transparency
• 💡 **Answer questions** — anything about KindJar

**Try asking me:**
• "Which jar should I donate to?"
• "How do I donate?"
• "Is this safe?"
• "Analyze all campaigns"`;

export function createAgent() {
  let context: AgentContext = {
    campaigns: [],
    walletConnected: false,
    isMiniPay: false,
    selectedCampaignId: 0n,
  };

  function updateContext(updates: Partial<AgentContext>) {
    context = { ...context, ...updates };
  }

  function processMessage(userMessage: string): AgentMessage {
    const q = userMessage.toLowerCase().trim();

    let content: string;
    let suggestions: string[] = [];

    // Quick commands
    if (q === 'hi' || q === 'hello' || q === 'gm' || q === 'hey' || q === 'halo') {
      content = `Hey! 👋 Welcome to KindJar. I'm your AI donation advisor.\n\nWhat would you like to do?\n• 📊 See campaign analysis\n• 🌟 Get jar recommendation\n• 🎯 Learn how to donate\n• 🔒 Check if it's safe`;
      suggestions = ['Analyze all campaigns', 'Which jar should I donate to?', 'How do I donate?', 'Is this safe?'];
    } else if (q.includes('analyz') || q.includes('analys') || q.includes('analisis') || q.includes('report') || q.includes('overview') || q.includes('all')) {
      content = generateAnalysis(ctx);
      const top = ctx.campaigns.map(scoreCampaign).sort((a, b) => b.score - a.score)[0];
      suggestions = top ? [`Donate to ${top.campaign.name}`, 'How do I donate?', 'Check safety'] : ['How do I donate?'];
    } else if (q.includes('recommend') || q.includes('suggest') || q.includes('best') || q.includes('which') || q.includes('bagus') || q.includes('mana') || q.includes('pilih')) {
      content = getJarAdvice(ctx, userMessage);
      suggestions = ['How do I donate?', 'Analyze all campaigns', 'Is this safe?'];
    } else if (q.includes('how') || q.includes('donate') || q.includes('cara') || q.includes('guide') || q.includes('tutorial') || q.includes('gimana') || q.includes('start')) {
      content = getDonationGuide(ctx);
      suggestions = ['Which jar should I donate to?', 'Is this safe?', 'Analyze all campaigns'];
    } else if (q.includes('safe') || q.includes('scam') || q.includes('trust') || q.includes('aman') || q.includes('legit') || q.includes('verify')) {
      content = getJarAdvice(ctx, userMessage);
      suggestions = ['How do I donate?', 'Analyze all campaigns', 'Which jar should I donate to?'];
    } else if (q.includes('what') || q.includes('apa') || q.includes('about') || q.includes('siapa') || q.includes('tentang')) {
      content = getJarAdvice(ctx, userMessage);
      suggestions = ['Analyze all campaigns', 'How do I donate?', 'Is this safe?'];
    } else if (q.includes('food') || q.includes('makan') || q.includes('school') || q.includes('sekolah')) {
      content = getJarAdvice(ctx, userMessage);
      suggestions = ['How do I donate?', 'Analyze all campaigns'];
    } else if (q.includes('minipay') || q.includes('wallet') || q.includes('connect') || q.includes('dompet')) {
      content = `📱 **MiniPay & Wallet Info**\n\n${ctx.isMiniPay ? '✅ MiniPay detected! Your wallet auto-connects — just approve the donation.' : ctx.walletConnected ? '✅ Wallet connected. You\'re ready to donate!' : '⚠️ No wallet connected yet.'}\n\n**How to connect:**\n• Open this page in MiniPay (auto-connect)\n• Or use any Celo-compatible browser wallet\n• Click "Connect Wallet" in the nav\n\n**Supported wallets:**\n• MiniPay (recommended — 14M+ users)\n• MetaMask (with Celo network)\n• Valora\n• Any injected wallet`;
      suggestions = ['How do I donate?', 'Is this safe?'];
    } else if (q.includes('celo') || q.includes('stablecoin') || q.includes('cusd') || q.includes('usdm')) {
      content = `⛓️ **About Celo & Stablecoins**\n\nCelo is a mobile-first blockchain built for real-world payments. KindJar uses:\n\n• **cUSD** — Celo Dollar (native stablecoin)\n• **USDm** — MiniPay stablecoin\n• **USDC / USDT** — also supported\n\nAll on **Celo Mainnet (chain ID: 42220)** — fast, low fees, carbon-negative.\n\nMiniPay is Opera's self-custodial stablecoin wallet with 14M+ global users. Perfect for micro-donations!`;
      suggestions = ['How do I donate?', 'Analyze all campaigns'];
    } else {
      // Smart fallback — try to help anyway
      content = `🤔 I'm not sure I understood that. Here's what I can help with:\n\n• 📊 **"Analyze all campaigns"** — see rankings & scores\n• 🌟 **"Which jar should I donate to?"** — get recommendations\n• 🎯 **"How do I donate?"** — step-by-step guide\n• 🔒 **"Is this safe?"** — verify onchain transparency\n• 📱 **"MiniPay info"** — wallet connection help\n• ⛓️ **"About Celo"** — blockchain & stablecoin info\n\nJust type a question or tap a suggestion below!`;
      suggestions = ['Analyze all campaigns', 'Which jar should I donate to?', 'How do I donate?', 'Is this safe?'];
    }

    return {
      id: crypto.randomUUID(),
      role: 'agent',
      content,
      timestamp: Date.now(),
      suggestions,
    };
  }

  function getWelcome(): AgentMessage {
    return {
      id: crypto.randomUUID(),
      role: 'agent',
      content: WELCOME_MSG,
      timestamp: Date.now(),
      suggestions: ['Analyze all campaigns', 'Which jar should I donate to?', 'How do I donate?', 'Is this safe?'],
    };
  }

  return { updateContext, processMessage, getWelcome };
}
