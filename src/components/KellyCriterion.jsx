import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const KellyCriterion = () => {
  const [winProb, setWinProb] = useState(0.55);
  const [winRatio, setWinRatio] = useState(1.0);
  const [lossRatio, setLossRatio] = useState(1.0);
  const [initialCapital, setInitialCapital] = useState(10000);
  const [numBets, setNumBets] = useState(100);
  const [simulationData, setSimulationData] = useState([]);
  const [kellyFraction, setKellyFraction] = useState(0);

  // Calculate Kelly fraction
  const calculateKellyFraction = () => {
    const p = winProb;
    const b = winRatio;
    const q = 1 - p;
    const a = lossRatio;
    
    const kelly = (p * b - q * a) / (a * b);
    return Math.max(0, Math.min(1, kelly)); // Clamp between 0 and 1
  };

  // Simulate betting strategy
  const simulateBetting = (fraction) => {
    const results = [];
    let capital = initialCapital;
    
    for (let i = 0; i <= numBets; i++) {
      results.push({
        bet: i,
        capital: Math.round(capital),
        kelly: capital,
        halfKelly: capital,
        doubleKelly: capital
      });
      
      if (i < numBets) {
        const betSize = capital * fraction;
        const isWin = Math.random() < winProb;
        
        if (isWin) {
          capital += betSize * winRatio;
        } else {
          capital -= betSize * lossRatio;
        }
        
        capital = Math.max(0, capital);
      }
    }
    
    return results;
  };

  // Compare different Kelly fractions
  const compareStrategies = () => {
    const kelly = calculateKellyFraction();
    const strategies = [
      { name: 'Full Kelly', fraction: kelly, data: [] },
      { name: 'Half Kelly', fraction: kelly / 2, data: [] },
      { name: 'Double Kelly', fraction: kelly * 2, data: [] },
      { name: 'Fixed 5%', fraction: 0.05, data: [] }
    ];

    // Run multiple simulations for each strategy
    const numSimulations = 10;
    
    strategies.forEach(strategy => {
      const allRuns = [];
      
      for (let sim = 0; sim < numSimulations; sim++) {
        let capital = initialCapital;
        const run = [];
        
        for (let i = 0; i <= numBets; i++) {
          run.push(capital);
          
          if (i < numBets) {
            const betSize = capital * strategy.fraction;
            const isWin = Math.random() < winProb;
            
            if (isWin) {
              capital += betSize * winRatio;
            } else {
              capital -= betSize * lossRatio;
            }
            
            capital = Math.max(0, capital);
          }
        }
        
        allRuns.push(run);
      }
      
      // Average the runs
      strategy.data = allRuns[0].map((_, i) => {
        const avg = allRuns.reduce((sum, run) => sum + run[i], 0) / numSimulations;
        return Math.round(avg);
      });
    });

    // Format for chart
    const chartData = [];
    for (let i = 0; i <= numBets; i++) {
      chartData.push({
        bet: i,
        'Full Kelly': strategies[0].data[i],
        'Half Kelly': strategies[1].data[i],
        'Double Kelly': strategies[2].data[i],
        'Fixed 5%': strategies[3].data[i]
      });
    }

    return chartData;
  };

  useEffect(() => {
    const kelly = calculateKellyFraction();
    setKellyFraction(kelly);
    setSimulationData(compareStrategies());
  }, [winProb, winRatio, lossRatio, initialCapital, numBets]);

  const expectedGrowthRate = (f) => {
    const p = winProb;
    const q = 1 - p;
    const b = winRatio;
    const a = lossRatio;
    
    return p * Math.log(1 + f * b) + q * Math.log(1 - f * a);
  };

  return (
    <div className="max-w-7xl mx-auto p-6 bg-[rgb(8,8,12)] min-h-screen">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-[rgb(240,255,255)] mb-2">Kelly Criterion Calculator</h1>
        <p className="text-[rgb(170,170,180)]">Optimal position sizing for maximizing long-term growth</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Controls */}
        <div className="bg-[rgba(18,18,24,0.95)] border border-[rgba(170,170,180,0.2)] rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold mb-4 text-[rgb(240,255,255)]">Parameters</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[rgb(170,170,180)] mb-1">
                Win Probability: {(winProb * 100).toFixed(1)}%
              </label>
              <input
                type="range"
                min="0.01"
                max="0.99"
                step="0.01"
                value={winProb}
                onChange={(e) => setWinProb(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[rgb(170,170,180)] mb-1">
                Win Ratio (Payout): {winRatio.toFixed(2)}x
              </label>
              <input
                type="range"
                min="0.1"
                max="5"
                step="0.1"
                value={winRatio}
                onChange={(e) => setWinRatio(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[rgb(170,170,180)] mb-1">
                Loss Ratio: {lossRatio.toFixed(2)}x
              </label>
              <input
                type="range"
                min="0.1"
                max="2"
                step="0.1"
                value={lossRatio}
                onChange={(e) => setLossRatio(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[rgb(170,170,180)] mb-1">
                Initial Capital: ${initialCapital.toLocaleString()}
              </label>
              <input
                type="range"
                min="1000"
                max="100000"
                step="1000"
                value={initialCapital}
                onChange={(e) => setInitialCapital(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[rgb(170,170,180)] mb-1">
                Number of Bets: {numBets}
              </label>
              <input
                type="range"
                min="10"
                max="500"
                step="10"
                value={numBets}
                onChange={(e) => setNumBets(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="bg-[rgba(18,18,24,0.95)] border border-[rgba(170,170,180,0.2)] rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold mb-4 text-[rgb(240,255,255)]">Kelly Analysis</h2>

          <div className="space-y-4">
            <div className="bg-[rgba(92,153,255,0.1)] border border-[rgba(92,153,255,0.3)] p-4 rounded-lg">
              <h3 className="font-semibold text-[#5c99ff]">Optimal Kelly Fraction</h3>
              <p className="text-3xl font-bold text-[#5c99ff]">
                {(kellyFraction * 100).toFixed(2)}%
              </p>
              <p className="text-sm text-[#5c99ff]">
                Bet this fraction of your capital each round
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[rgba(170,170,180,0.1)] border border-[rgba(170,170,180,0.3)] p-3 rounded">
                <p className="text-sm text-[rgb(170,170,180)]">Expected Growth Rate</p>
                <p className="text-lg font-semibold text-[rgb(240,255,255)]">
                  {(expectedGrowthRate(kellyFraction) * 100).toFixed(2)}%
                </p>
              </div>

              <div className="bg-[rgba(170,170,180,0.1)] border border-[rgba(170,170,180,0.3)] p-3 rounded">
                <p className="text-sm text-[rgb(170,170,180)]">Risk of Ruin</p>
                <p className="text-lg font-semibold text-[rgb(240,255,255)]">
                  {kellyFraction > 0 ? "Very Low" : "High"}
                </p>
              </div>
            </div>

            <div className="bg-[rgba(255,107,53,0.1)] border border-[rgba(255,107,53,0.3)] p-4 rounded-lg">
              <h4 className="font-semibold text-[#ff6b35] mb-2">Kelly Formula</h4>
              <p className="text-sm text-[#ff6b35]">
                f* = (bp - q) / b
              </p>
              <p className="text-xs text-[#ff6b35] mt-1">
                Where: b = win ratio, p = win probability, q = loss probability
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Simulation Chart */}
      <div className="mt-8 bg-[rgba(18,18,24,0.95)] border border-[rgba(170,170,180,0.2)] rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-semibold mb-4 text-[rgb(240,255,255)]">Strategy Comparison</h2>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={simulationData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(170,170,180,0.2)" />
              <XAxis
                dataKey="bet"
                label={{ value: 'Bet Number', position: 'insideBottom', offset: -5, style: { fill: 'rgb(170,170,180)' } }}
                tick={{ fill: 'rgb(170,170,180)' }}
              />
              <YAxis
                label={{ value: 'Capital ($)', angle: -90, position: 'insideLeft', style: { fill: 'rgb(170,170,180)' } }}
                tick={{ fill: 'rgb(170,170,180)' }}
              />
              <Tooltip
                formatter={(value) => [`$${value.toLocaleString()}`, '']}
                contentStyle={{ backgroundColor: 'rgba(18,18,24,0.95)', border: '1px solid rgba(170,170,180,0.3)', color: 'rgb(240,255,255)' }}
              />
              <Legend wrapperStyle={{ color: 'rgb(170,170,180)' }} />
              <Line type="monotone" dataKey="Full Kelly" stroke="#5c99ff" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Half Kelly" stroke="#16a34a" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Double Kelly" stroke="#ef4444" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Fixed 5%" stroke="#ff6b35" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="text-sm text-[rgb(170,170,180)] mt-2">
          Simulation shows average performance over 10 runs. Full Kelly maximizes growth but can be volatile.
        </p>
      </div>

      {/* Educational Content */}
      <div className="mt-8 bg-[rgba(18,18,24,0.95)] border border-[rgba(170,170,180,0.2)] rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-semibold mb-4 text-[rgb(240,255,255)]">Understanding Kelly Criterion</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-[rgb(240,255,255)] mb-2">Key Insights</h3>
            <ul className="text-sm text-[rgb(170,170,180)] space-y-1">
              <li>• Maximizes long-term logarithmic growth</li>
              <li>• Minimizes time to reach any wealth level</li>
              <li>• Never risks total ruin (when f* &lt; 1)</li>
              <li>• Assumes infinite time horizon</li>
              <li>• Requires accurate probability estimates</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-[rgb(240,255,255)] mb-2">Practical Applications</h3>
            <ul className="text-sm text-[rgb(170,170,180)] space-y-1">
              <li>• Portfolio management and sizing</li>
              <li>• Sports betting optimization</li>
              <li>• Trading position sizing</li>
              <li>• Investment allocation strategies</li>
              <li>• Risk management frameworks</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KellyCriterion;