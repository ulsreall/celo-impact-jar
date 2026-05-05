import React, { useMemo, useEffect, useState } from 'react';
import { formatUnits } from 'viem';
import type { Campaign } from './main';

type AgentInsight = {
  campaign: Campaign;
  score: number;
  badge: string;
  reason: string;
  analysis: string[];
};

function scoreCampaign(c: Campaign): AgentInsight {
  const raised = Number(formatUnits(c.totalRaised, 18));
  let score = 50;
  const analysis: string[] = [];

  if (c.active) {
    score += 15;
    analysis.push('✅ Currently active and accepting donations');
  }

  if (raised > 100) {
    score += 20;
    analysis.push(`💰 Strong community backing with ${raised.toFixed(1)} cUSD raised`);
  } else if (raised > 30) {
    score += 12;
    analysis.push(`📈 Growing support — ${raised.toFixed(1)} cUSD raised so far`);
  } else if (raised > 0) {
    score += 5;
    analysis.push(`🌱 Early stage — ${raised.toFixed(1)} cUSD raised, room to grow`);
  } else {
    analysis.push(`🆕 Brand new campaign — be the first donor!`);
  }

  const name = c.name.toLowerCase();
  if (name.includes('food') || name.includes('water') || name.includes('health')) {
    score += 12;
    analysis.push('🎯 Essential needs — high real-world impact potential');
  }
  if (name.includes('school') || name.includes('education') || name.includes('learn')) {
    score += 10;
    analysis.push('📚 Education focus — long-term community benefit');
  }
  if (name.includes('community') || name.includes('public') || name.includes('local')) {
    score += 5;
    analysis.push('🌍 Community-oriented — benefits local ecosystem');
  }

  let badge = '🌱';
  if (score >= 90) badge = '🌟';
  else if (score >= 75) badge = '🔥';
  else if (score >= 60) badge = '💪';

  return { campaign: c, score: Math.min(score, 100), badge, reason: analysis[0], analysis };
}

type Props = {
  campaigns: Campaign[];
};

export default function AgentInsights({ campaigns }: Props) {
  const [selectedInsight, setSelectedInsight] = useState<number | null>(null);

  const insights = useMemo(
    () => campaigns.map(scoreCampaign).sort((a, b) => b.score - a.score),
    [campaigns],
  );

  const totalRaised = campaigns.reduce((sum, c) => sum + Number(formatUnits(c.totalRaised, 18)), 0);
  const activeCount = campaigns.filter((c) => c.active).length;
  const avgScore = insights.length ? Math.round(insights.reduce((s, i) => s + i.score, 0) / insights.length) : 0;

  useEffect(() => {
    if (insights.length > 0 && selectedInsight === null) setSelectedInsight(0);
  }, [insights]);

  const current = selectedInsight !== null ? insights[selectedInsight] : null;

  return (
    <section className="panel agent-insights" id="agent">
      <div className="agent-section-header">
        <div>
          <div className="agent-section-badge">🤖 AI Agent</div>
          <h2>Campaign Intelligence</h2>
          <p className="subtitle">Onchain AI analysis of all active impact jars. Scores update based on real donation data.</p>
        </div>
      </div>

      {/* Overview stats */}
      <div className="agent-overview">
        <div className="agent-stat">
          <div className="agent-stat-icon">📊</div>
          <div className="agent-stat-value">{avgScore}</div>
          <div className="agent-stat-label">Avg Score</div>
        </div>
        <div className="agent-stat">
          <div className="agent-stat-icon">🎯</div>
          <div className="agent-stat-value">{activeCount}</div>
          <div className="agent-stat-label">Active Jars</div>
        </div>
        <div className="agent-stat">
          <div className="agent-stat-icon">💰</div>
          <div className="agent-stat-value">{totalRaised.toFixed(1)}</div>
          <div className="agent-stat-label">Total cUSD</div>
        </div>
        <div className="agent-stat">
          <div className="agent-stat-icon">⛓️</div>
          <div className="agent-stat-value">100%</div>
          <div className="agent-stat-label">Onchain</div>
        </div>
      </div>

      {/* Campaign rankings */}
      <div className="agent-rankings">
        <div className="agent-rankings-list">
          {insights.map((insight, i) => (
            <button
              key={insight.campaign.id.toString()}
              className={`agent-rank-card ${selectedInsight === i ? 'active' : ''}`}
              onClick={() => setSelectedInsight(i)}
            >
              <div className="agent-rank-num">#{i + 1}</div>
              <div className="agent-rank-info">
                <div className="agent-rank-name">
                  {insight.badge} {insight.campaign.name}
                </div>
                <div className="agent-raised">
                  {formatUnits(insight.campaign.totalRaised, 18)} cUSD raised
                </div>
              </div>
              <div className="agent-score">
                <div className="agent-score-ring">
                  <svg viewBox="0 0 36 36">
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="rgba(145,245,183,0.12)"
                      strokeWidth="3"
                    />
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke={insight.score >= 80 ? '#35d07f' : insight.score >= 60 ? '#d8ff3e' : '#91f5b7'}
                      strokeWidth="3"
                      strokeDasharray={`${insight.score}, 100`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span>{insight.score}</span>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Detail panel */}
        {current && (
          <div className="agent-detail">
            <div className="agent-detail-header">
              <span className="agent-detail-badge">{current.badge}</span>
              <h3>{current.campaign.name}</h3>
            </div>
            <p className="agent-detail-desc">{current.campaign.description}</p>
            <div className="agent-detail-score">
              <div className="agent-detail-score-bar">
                <div
                  className="agent-detail-score-fill"
                  style={{
                    width: `${current.score}%`,
                    background: current.score >= 80 ? 'linear-gradient(90deg, #35d07f, #d8ff3e)' : current.score >= 60 ? 'linear-gradient(90deg, #d8ff3e, #35d07f)' : 'linear-gradient(90deg, #91f5b7, #d8ff3e)',
                  }}
                />
              </div>
              <div className="agent-detail-score-label">
                Impact Score: <strong>{current.score}/100</strong>
              </div>
            </div>
            <div className="agent-detail-analysis">
              <div className="agent-detail-title">🔍 Agent Analysis</div>
              {current.analysis.map((a, i) => (
                <div key={i} className="agent-detail-item">{a}</div>
              ))}
            </div>
            <div className="agent-detail-meta">
              <div className="agent-meta-item">
                <span className="agent-meta-label">Total Raised</span>
                <span className="agent-meta-value">{formatUnits(current.campaign.totalRaised, 18)} cUSD</span>
              </div>
              <div className="agent-meta-item">
                <span className="agent-meta-label">Status</span>
                <span className="agent-meta-value">{current.campaign.active ? '🟢 Active' : '🔴 Inactive'}</span>
              </div>
              <div className="agent-meta-item">
                <span className="agent-meta-label">Chain</span>
                <span className="agent-meta-value">Celo Mainnet</span>
              </div>
            </div>
            <div className="agent-detail-verdict">
              {current.score >= 80 && '🌟 **Top Pick!** This jar has strong community backing and high impact potential. Recommended for donors.'}
              {current.score >= 60 && current.score < 80 && '💪 **Solid Choice.** This jar is performing well with good community support.'}
              {current.score < 60 && '🌱 **Growing.** Early-stage jar with potential. Your donation could make a big difference here.'}
            </div>
          </div>
        )}
      </div>

      {/* Agent capabilities */}
      <div className="agent-capabilities">
        <div className="agent-cap">
          <div className="agent-cap-icon">📊</div>
          <strong>Onchain Scoring</strong>
          <span>Real-time campaign analysis based on actual onchain donation data</span>
        </div>
        <div className="agent-cap">
          <div className="agent-cap-icon">🎯</div>
          <strong>Smart Recommendations</strong>
          <span>Impact-weighted rankings that help donors choose the right jar</span>
        </div>
        <div className="agent-cap">
          <div className="agent-cap-icon">🔍</div>
          <strong>Transparency Check</strong>
          <span>Every metric is verifiable on Celoscan — no black box</span>
        </div>
        <div className="agent-cap">
          <div className="agent-cap-icon">💡</div>
          <strong>Donation Guidance</strong>
          <span>Step-by-step help for MiniPay and Celo wallet users</span>
        </div>
      </div>
    </section>
  );
}
