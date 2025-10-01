import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';
import * as math from 'mathjs';

const HestonModel = () => {
  const [parameters, setParameters] = useState({
    S0: 100,    // Initial stock price
    V0: 0.04,   // Initial volatility
    r: 0.05,    // Risk-free rate
    kappa: 2.0, // Speed of mean reversion
    theta: 0.04, // Long-term volatility
    sigma: 0.3, // Volatility of volatility
    rho: -0.7,  // Correlation between price and volatility
    T: 1.0,     // Time to maturity
    steps: 252  // Number of time steps
  });

  const [paths, setPaths] = useState([]);
  const [volatilityPaths, setVolatilityPaths] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [isSimulating, setIsSimulating] = useState(false);
  const [numPaths, setNumPaths] = useState(100);
  const [showVolatility, setShowVolatility] = useState(false);

  // Generate correlated random numbers using Cholesky decomposition
  const generateCorrelatedRandoms = (rho) => {
    const z1 = math.random();
    const z2 = math.random();
    
    // Box-Muller transformation
    const u1 = Math.sqrt(-2 * Math.log(z1)) * Math.cos(2 * Math.PI * z2);
    const u2 = Math.sqrt(-2 * Math.log(z1)) * Math.sin(2 * Math.PI * z2);
    
    // Apply correlation
    const w1 = u1;
    const w2 = rho * u1 + Math.sqrt(1 - rho * rho) * u2;
    
    return [w1, w2];
  };

  // Simulate single path using Euler scheme
  const simulateHestonPath = (params) => {
    const { S0, V0, r, kappa, theta, sigma, rho, T, steps } = params;
    const dt = T / steps;
    
    const pricePath = [S0];
    const volPath = [V0];
    
    let S = S0;
    let V = V0;
    
    for (let i = 0; i < steps; i++) {
      const [dW1, dW2] = generateCorrelatedRandoms(rho);
      const sqrtDt = Math.sqrt(dt);
      
      // Ensure volatility stays positive (Feller condition)
      const sqrtV = Math.max(Math.sqrt(Math.abs(V)), 0.001);
      
      // Heston model dynamics
      const dS = r * S * dt + sqrtV * S * dW1 * sqrtDt;
      const dV = kappa * (theta - V) * dt + sigma * sqrtV * dW2 * sqrtDt;
      
      S += dS;
      V = Math.max(V + dV, 0.001); // Ensure volatility stays positive
      
      pricePath.push(S);
      volPath.push(V);
    }
    
    return { pricePath, volPath };
  };

  // Monte Carlo simulation
  const runSimulation = () => {
    setIsSimulating(true);
    
    setTimeout(() => {
      const allPricePaths = [];
      const allVolPaths = [];
      const finalPrices = [];
      
      for (let i = 0; i < numPaths; i++) {
        const { pricePath, volPath } = simulateHestonPath(parameters);
        
        // Store paths for visualization (only first 10 paths to avoid clutter)
        if (i < 10) {
          const pathData = pricePath.map((price, idx) => ({
            time: idx / parameters.steps * parameters.T,
            price: price,
            volatility: volPath[idx],
            pathId: i
          }));
          allPricePaths.push(pathData);
          allVolPaths.push(pathData);
        }
        
        finalPrices.push(pricePath[pricePath.length - 1]);
      }
      
      // Calculate statistics
      const avgFinalPrice = finalPrices.reduce((a, b) => a + b, 0) / numPaths;
      const stdFinalPrice = Math.sqrt(
        finalPrices.reduce((sum, price) => sum + Math.pow(price - avgFinalPrice, 2), 0) / numPaths
      );
      
      // Calculate option prices (European call with strike = S0)
      const callPayoffs = finalPrices.map(price => Math.max(price - parameters.S0, 0));
      const callPrice = Math.exp(-parameters.r * parameters.T) * 
                       callPayoffs.reduce((a, b) => a + b, 0) / numPaths;
      
      // Calculate Black-Scholes price for comparison
      const d1 = (Math.log(parameters.S0 / parameters.S0) + 
                 (parameters.r + 0.5 * parameters.V0) * parameters.T) / 
                (Math.sqrt(parameters.V0 * parameters.T));
      const d2 = d1 - Math.sqrt(parameters.V0 * parameters.T);
      
      const normalCDF = (x) => 0.5 * (1 + math.erf(x / Math.sqrt(2)));
      const bsPrice = parameters.S0 * normalCDF(d1) - 
                     parameters.S0 * Math.exp(-parameters.r * parameters.T) * normalCDF(d2);
      
      setPaths(allPricePaths);
      setVolatilityPaths(allVolPaths);
      setStatistics({
        avgFinalPrice,
        stdFinalPrice,
        callPrice,
        bsPrice,
        volatilityOfVolatility: Math.sqrt(parameters.V0) * parameters.sigma,
        fellerCondition: 2 * parameters.kappa * parameters.theta / (parameters.sigma * parameters.sigma)
      });
      
      setIsSimulating(false);
    }, 100);
  };

  // Flatten paths for chart display
  const chartData = paths.flat().map(point => ({
    time: point.time,
    price: point.price,
    volatility: point.volatility * 100 // Convert to percentage
  }));

  const volatilityData = volatilityPaths.flat().map(point => ({
    time: point.time,
    volatility: point.volatility * 100
  }));

  useEffect(() => {
    runSimulation();
  }, []);

  return (
    <div className="max-w-7xl mx-auto p-6 bg-[rgb(8,8,12)] min-h-screen">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-[rgb(240,255,255)] mb-2" style={{textShadow: '0 0 10px rgba(0,255,65,0.3)'}}>Heston Stochastic Volatility Model</h1>
        <p className="text-[rgb(170,170,180)]">Advanced option pricing with stochastic volatility</p>
      </div>

      {/* Parameters */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-[rgba(18,18,24,0.95)] border border-[rgba(0,255,65,0.2)] rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-[rgb(240,255,255)]">Market Parameters</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[rgb(170,170,180)] mb-1">
                Initial Stock Price (S₀): ${parameters.S0}
              </label>
              <input
                type="range"
                min="50"
                max="200"
                step="5"
                value={parameters.S0}
                onChange={(e) => setParameters({...parameters, S0: parseFloat(e.target.value)})}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[rgb(170,170,180)] mb-1">
                Initial Volatility (V₀): {(parameters.V0 * 100).toFixed(1)}%
              </label>
              <input
                type="range"
                min="0.01"
                max="0.1"
                step="0.001"
                value={parameters.V0}
                onChange={(e) => setParameters({...parameters, V0: parseFloat(e.target.value)})}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[rgb(170,170,180)] mb-1">
                Risk-free Rate (r): {(parameters.r * 100).toFixed(1)}%
              </label>
              <input
                type="range"
                min="0"
                max="0.1"
                step="0.001"
                value={parameters.r}
                onChange={(e) => setParameters({...parameters, r: parseFloat(e.target.value)})}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[rgb(170,170,180)] mb-1">
                Time to Maturity (T): {parameters.T} years
              </label>
              <input
                type="range"
                min="0.1"
                max="3"
                step="0.1"
                value={parameters.T}
                onChange={(e) => setParameters({...parameters, T: parseFloat(e.target.value)})}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
        </div>

        <div className="bg-[rgba(18,18,24,0.95)] border border-[rgba(0,255,65,0.2)] rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-[rgb(240,255,255)]">Heston Parameters</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[rgb(170,170,180)] mb-1">
                Mean Reversion Speed (κ): {parameters.kappa.toFixed(2)}
              </label>
              <input
                type="range"
                min="0.1"
                max="10"
                step="0.1"
                value={parameters.kappa}
                onChange={(e) => setParameters({...parameters, kappa: parseFloat(e.target.value)})}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[rgb(170,170,180)] mb-1">
                Long-term Volatility (θ): {(parameters.theta * 100).toFixed(1)}%
              </label>
              <input
                type="range"
                min="0.01"
                max="0.1"
                step="0.001"
                value={parameters.theta}
                onChange={(e) => setParameters({...parameters, theta: parseFloat(e.target.value)})}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[rgb(170,170,180)] mb-1">
                Vol of Vol (σ): {parameters.sigma.toFixed(2)}
              </label>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.01"
                value={parameters.sigma}
                onChange={(e) => setParameters({...parameters, sigma: parseFloat(e.target.value)})}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[rgb(170,170,180)] mb-1">
                Correlation (ρ): {parameters.rho.toFixed(2)}
              </label>
              <input
                type="range"
                min="-0.99"
                max="0.99"
                step="0.01"
                value={parameters.rho}
                onChange={(e) => setParameters({...parameters, rho: parseFloat(e.target.value)})}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
        </div>

        <div className="bg-[rgba(18,18,24,0.95)] border border-[rgba(0,255,65,0.2)] rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-[rgb(240,255,255)]">Simulation Control</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[rgb(170,170,180)] mb-1">
                Number of Paths: {numPaths}
              </label>
              <input
                type="range"
                min="10"
                max="1000"
                step="10"
                value={numPaths}
                onChange={(e) => setNumPaths(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[rgb(170,170,180)] mb-1">
                Time Steps: {parameters.steps}
              </label>
              <input
                type="range"
                min="50"
                max="1000"
                step="50"
                value={parameters.steps}
                onChange={(e) => setParameters({...parameters, steps: parseInt(e.target.value)})}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div className="space-y-3">
              <button
                onClick={runSimulation}
                disabled={isSimulating}
                className={`w-full py-3 px-4 rounded-md font-medium border ${
                  isSimulating
                    ? 'bg-[rgba(170,170,180,0.1)] border-[rgba(170,170,180,0.3)] cursor-not-allowed text-[rgb(170,170,180)]'
                    : 'bg-[rgba(0,255,65,0.1)] border-[rgba(0,255,65,0.3)] hover:bg-[rgba(0,255,65,0.2)] text-[#00ff41]'
                }`}
              >
                {isSimulating ? 'Simulating...' : 'Run Simulation'}
              </button>

              <button
                onClick={() => setShowVolatility(!showVolatility)}
                className="w-full py-3 px-4 bg-[rgba(0,255,255,0.1)] border border-[rgba(0,255,255,0.3)] hover:bg-[rgba(0,255,255,0.2)] text-[#00ffff] rounded-md font-medium"
              >
                {showVolatility ? 'Show Prices' : 'Show Volatility'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Price/Volatility Chart */}
      <div className="bg-[rgba(18,18,24,0.95)] border border-[rgba(0,255,65,0.2)] rounded-lg shadow-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-6 text-[rgb(240,255,255)]">
          {showVolatility ? 'Volatility Paths' : 'Price Paths'}
        </h2>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={showVolatility ? volatilityData : chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(170,170,180,0.2)" />
            <XAxis
              dataKey="time"
              label={{
                value: 'Time (years)',
                position: 'insideBottom',
                offset: -15,
                style: { fill: 'rgb(170,170,180)', fontSize: '14px' }
              }}
              tick={{ fill: 'rgb(170,170,180)', fontSize: '12px' }}
              height={60}
            />
            <YAxis
              domain={['auto', 'auto']}
              label={{
                value: showVolatility ? 'Volatility (%)' : 'Price ($)',
                angle: -90,
                position: 'insideLeft',
                style: { fill: 'rgb(170,170,180)', fontSize: '14px' }
              }}
              tick={{ fill: 'rgb(170,170,180)', fontSize: '12px' }}
              width={80}
            />
            <Tooltip
              formatter={(value) => [
                showVolatility ? `${value.toFixed(2)}%` : `$${value.toFixed(2)}`,
                showVolatility ? 'Volatility' : 'Price'
              ]}
              contentStyle={{
                backgroundColor: 'rgba(18,18,24,0.95)',
                border: '1px solid rgba(0,255,65,0.3)',
                color: 'rgb(240,255,255)'
              }}
            />
            <Line
              type="monotone"
              dataKey={showVolatility ? 'volatility' : 'price'}
              stroke={showVolatility ? "#ff10f0" : "#00ff41"}
              strokeWidth={1.5}
              dot={false}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Statistics */}
      <div className="bg-[rgba(18,18,24,0.95)] border border-[rgba(0,255,65,0.2)] rounded-lg shadow-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-[rgb(240,255,255)]">Statistics & Pricing</h2>
          
          {statistics.avgFinalPrice && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[rgba(0,255,65,0.1)] border border-[rgba(0,255,65,0.3)] p-4 rounded-lg">
                  <h3 className="font-semibold text-[#00ff41]">Final Price</h3>
                  <p className="text-2xl font-bold text-[#00ff41]">
                    ${statistics.avgFinalPrice.toFixed(2)}
                  </p>
                  <p className="text-sm text-[#00ff41]">
                    ±${statistics.stdFinalPrice.toFixed(2)}
                  </p>
                </div>

                <div className="bg-[rgba(0,255,255,0.1)] border border-[rgba(0,255,255,0.3)] p-4 rounded-lg">
                  <h3 className="font-semibold text-[#00ffff]">Call Option Price</h3>
                  <p className="text-2xl font-bold text-[#00ffff]">
                    ${statistics.callPrice.toFixed(2)}
                  </p>
                  <p className="text-sm text-[#00ffff]">
                    Heston Monte Carlo
                  </p>
                </div>

                <div className="bg-[rgba(255,16,240,0.1)] border border-[rgba(255,16,240,0.3)] p-4 rounded-lg">
                  <h3 className="font-semibold text-[#ff10f0]">Black-Scholes Price</h3>
                  <p className="text-2xl font-bold text-[#ff10f0]">
                    ${statistics.bsPrice.toFixed(2)}
                  </p>
                  <p className="text-sm text-[#ff10f0]">
                    Constant volatility
                  </p>
                </div>

                <div className="bg-[rgba(255,107,53,0.1)] border border-[rgba(255,107,53,0.3)] p-4 rounded-lg">
                  <h3 className="font-semibold text-[#ff6b35]">Price Difference</h3>
                  <p className="text-2xl font-bold text-[#ff6b35]">
                    ${(statistics.callPrice - statistics.bsPrice).toFixed(2)}
                  </p>
                  <p className="text-sm text-[#ff6b35]">
                    Heston - Black-Scholes
                  </p>
                </div>
              </div>

              <div className="bg-[rgba(18,18,24,0.8)] border border-[rgba(170,170,180,0.2)] p-4 rounded-lg">
                <h3 className="font-semibold text-[rgb(240,255,255)] mb-2">Model Diagnostics</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Feller Condition:</span> 
                    <span className={`ml-2 ${statistics.fellerCondition >= 1 ? 'text-[#00ffff]' : 'text-red-600'}`}>
                      {statistics.fellerCondition.toFixed(2)} {statistics.fellerCondition >= 1 ? '✓' : '✗'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Vol of Vol:</span> 
                    <span className="ml-2">{(statistics.volatilityOfVolatility * 100).toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </div>
          )}
      </div>

      {/* Model Explanation */}
      <div className="bg-[rgba(18,18,24,0.95)] border border-[rgba(0,255,65,0.2)] rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4 text-[rgb(240,255,255)]">Heston Model Equations</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-[rgb(240,255,255)] mb-2">Stochastic Differential Equations</h3>
            <div className="bg-[rgba(18,18,24,0.8)] border border-[rgba(170,170,180,0.2)] p-4 rounded-lg font-mono text-sm">
              <div className="mb-2">dS = rS dt + √V S dW₁</div>
              <div>dV = κ(θ - V) dt + σ√V dW₂</div>
              <div className="mt-2 text-xs text-[rgb(170,170,180)]">
                where dW₁ and dW₂ are correlated with correlation ρ
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-[rgb(240,255,255)] mb-2">Key Features</h3>
            <ul className="text-sm text-[rgb(170,170,180)] space-y-1">
              <li>• Stochastic volatility (not constant)</li>
              <li>• Mean-reverting volatility process</li>
              <li>• Correlation between price and volatility</li>
              <li>• Captures volatility clustering</li>
              <li>• Better fit to market option prices</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-[rgba(0,255,65,0.1)] border border-[rgba(0,255,65,0.3)] p-3 rounded-lg">
            <h4 className="font-semibold text-[#00ff41] text-sm">κ (Kappa)</h4>
            <p className="text-xs text-[#00ff41]">Speed of mean reversion for volatility</p>
          </div>
          
          <div className="bg-[rgba(0,255,255,0.1)] border border-[rgba(0,255,255,0.3)] p-3 rounded-lg">
            <h4 className="font-semibold text-[#00ffff] text-sm">θ (Theta)</h4>
            <p className="text-xs text-[#00ffff]">Long-term average volatility level</p>
          </div>
          
          <div className="bg-[rgba(255,16,240,0.1)] border border-[rgba(255,16,240,0.3)] p-3 rounded-lg">
            <h4 className="font-semibold text-[#ff10f0] text-sm">σ (Sigma)</h4>
            <p className="text-xs text-[#ff10f0]">Volatility of volatility parameter</p>
          </div>
          
          <div className="bg-[rgba(255,107,53,0.1)] border border-[rgba(255,107,53,0.3)] p-3 rounded-lg">
            <h4 className="font-semibold text-[#ff6b35] text-sm">ρ (Rho)</h4>
            <p className="text-xs text-[#ff6b35]">Correlation between price and volatility</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HestonModel;