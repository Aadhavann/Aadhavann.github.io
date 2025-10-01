import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Scatter } from 'recharts';
import * as math from 'mathjs';

const MertonJumpDiffusion = () => {
  const [parameters, setParameters] = useState({
    S0: 100,          // Initial stock price
    r: 0.05,          // Risk-free rate
    sigma: 0.2,       // Diffusion volatility
    lambda: 0.1,      // Jump intensity (jumps per year)
    muJ: -0.1,        // Mean jump size
    sigmaJ: 0.15,     // Jump volatility
    T: 1,             // Time horizon
    numPaths: 100,    // Number of simulation paths
    numSteps: 252,    // Time steps per year
    K: 100,           // Strike price for option pricing
    optionType: 'call'
  });

  const [simulationData, setSimulationData] = useState([]);
  const [jumpData, setJumpData] = useState([]);
  const [distributionData, setDistributionData] = useState([]);
  const [optionResults, setOptionResults] = useState({});
  const [isSimulating, setIsSimulating] = useState(false);
  const [showJumps, setShowJumps] = useState(true);
  const [selectedView, setSelectedView] = useState('paths');

  // Generate random normal using Box-Muller
  const randomNormal = () => {
    const u1 = Math.random();
    const u2 = Math.random();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  };

  // Generate Poisson random variable
  const randomPoisson = (lambda) => {
    const L = Math.exp(-lambda);
    let k = 0;
    let p = 1;
    
    do {
      k++;
      p *= Math.random();
    } while (p > L);
    
    return k - 1;
  };

  // Simulate single path with jump diffusion
  const simulateJumpDiffusionPath = () => {
    const { S0, r, sigma, lambda, muJ, sigmaJ, T, numSteps } = parameters;
    const dt = T / numSteps;
    
    const path = [];
    const jumps = [];
    let S = S0;
    
    path.push({ time: 0, price: S, jump: false, jumpSize: 0 });
    
    for (let i = 1; i <= numSteps; i++) {
      const time = i * dt;
      
      // Diffusion component
      const dW = randomNormal() * Math.sqrt(dt);
      const diffusion = sigma * dW;
      
      // Jump component
      const numJumps = randomPoisson(lambda * dt);
      let totalJumpSize = 0;
      
      if (numJumps > 0) {
        for (let j = 0; j < numJumps; j++) {
          const jumpSize = muJ + sigmaJ * randomNormal();
          totalJumpSize += jumpSize;
        }
      }
      
      // Update stock price using jump-diffusion formula
      const drift = (r - lambda * (Math.exp(muJ + 0.5 * sigmaJ * sigmaJ) - 1) - 0.5 * sigma * sigma) * dt;
      S = S * Math.exp(drift + diffusion + totalJumpSize);
      
      path.push({
        time: time,
        price: S,
        jump: numJumps > 0,
        jumpSize: totalJumpSize,
        diffusion: diffusion
      });
      
      if (numJumps > 0) {
        jumps.push({
          time: time,
          price: S,
          jumpSize: totalJumpSize,
          numJumps: numJumps
        });
      }
    }
    
    return { path, jumps };
  };

  // Run Monte Carlo simulation
  const runSimulation = () => {
    setIsSimulating(true);
    
    setTimeout(() => {
      const allPaths = [];
      const allJumps = [];
      const finalPrices = [];
      
      for (let i = 0; i < parameters.numPaths; i++) {
        const { path, jumps } = simulateJumpDiffusionPath();
        
        // Store first 10 paths for visualization
        if (i < 10) {
          const pathWithId = path.map(point => ({
            ...point,
            pathId: i
          }));
          allPaths.push(...pathWithId);
        }
        
        // Collect all jumps
        allJumps.push(...jumps);
        
        // Store final price for distribution analysis
        finalPrices.push(path[path.length - 1].price);
      }
      
      // Create price distribution
      const minPrice = Math.min(...finalPrices);
      const maxPrice = Math.max(...finalPrices);
      const binSize = (maxPrice - minPrice) / 20;
      const distribution = [];
      
      for (let i = 0; i < 20; i++) {
        const binStart = minPrice + i * binSize;
        const binEnd = binStart + binSize;
        const count = finalPrices.filter(p => p >= binStart && p < binEnd).length;
        distribution.push({
          price: binStart,
          frequency: count / parameters.numPaths,
          count: count
        });
      }
      
      // Calculate option prices
      const callPayoffs = finalPrices.map(S => Math.max(S - parameters.K, 0));
      const putPayoffs = finalPrices.map(S => Math.max(parameters.K - S, 0));
      
      const callPrice = Math.exp(-parameters.r * parameters.T) *                        callPayoffs.reduce((a, b) => a + b, 0) / parameters.numPaths;
      const putPrice = Math.exp(-parameters.r * parameters.T) *                       putPayoffs.reduce((a, b) => a + b, 0) / parameters.numPaths;
      
      // Black-Scholes comparison (without jumps)
      const bsCallPrice = calculateBlackScholes('call');
      const bsPutPrice = calculateBlackScholes('put');
      
      // Jump statistics
      const jumpSizes = allJumps.map(j => j.jumpSize);
      const avgJumpSize = jumpSizes.length > 0 ? jumpSizes.reduce((a, b) => a + b, 0) / jumpSizes.length : 0;
      const jumpFrequency = allJumps.length / (parameters.numPaths * parameters.T);
      
      setSimulationData(allPaths);
      setJumpData(allJumps);
      setDistributionData(distribution);
      setOptionResults({
        callPrice,
        putPrice,
        bsCallPrice,
        bsPutPrice,
        finalPrices,
        avgFinalPrice: finalPrices.reduce((a, b) => a + b, 0) / finalPrices.length,
        stdFinalPrice: Math.sqrt(finalPrices.reduce((sum, p) => {
          const mean = finalPrices.reduce((a, b) => a + b, 0) / finalPrices.length;
          return sum + Math.pow(p - mean, 2);
        }, 0) / finalPrices.length),
        totalJumps: allJumps.length,
        avgJumpSize,
        jumpFrequency
      });
      
      setIsSimulating(false);
    }, 100);
  };

  // Black-Scholes formula for comparison
  const calculateBlackScholes = (type) => {
    const { S0, K, T, r, sigma } = parameters;
    const d1 = (Math.log(S0 / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
    const d2 = d1 - sigma * Math.sqrt(T);
    
    const normalCDF = (x) => 0.5 * (1 + math.erf(x / Math.sqrt(2)));
    
    if (type === 'call') {
      return S0 * normalCDF(d1) - K * Math.exp(-r * T) * normalCDF(d2);
    } else {
      return K * Math.exp(-r * T) * normalCDF(-d2) - S0 * normalCDF(-d1);
    }
  };

  // Generate theoretical jump distribution
  const generateJumpDistribution = () => {
    const jumpSizes = [];
    for (let i = 0; i < 1000; i++) {
      const jumpSize = parameters.muJ + parameters.sigmaJ * randomNormal();
      jumpSizes.push(jumpSize);
    }
    
    const minJump = Math.min(...jumpSizes);
    const maxJump = Math.max(...jumpSizes);
    const binSize = (maxJump - minJump) / 20;
    const distribution = [];
    
    for (let i = 0; i < 20; i++) {
      const binStart = minJump + i * binSize;
      const binEnd = binStart + binSize;
      const count = jumpSizes.filter(j => j >= binStart && j < binEnd).length;
      distribution.push({
        jumpSize: binStart,
        frequency: count / 1000,
        theoretical: true
      });
    }
    
    return distribution;
  };

  // Chart data based on selected view
  const getChartData = () => {
    switch (selectedView) {
      case 'paths':
        return simulationData;
      case 'distribution':
        return distributionData;
      case 'jumps':
        return jumpData;
      default:
        return simulationData;
    }
  };

  useEffect(() => {
    runSimulation();
  }, []);

  const jumpDistribution = generateJumpDistribution();

  return (
    <div className="max-w-7xl mx-auto p-6 bg-[rgb(8,8,12)] min-h-screen">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-[rgb(240,255,255)] mb-2">Merton Jump Diffusion Model</h1>
        <p className="text-[rgb(170,170,180)]">Stock price modeling with both continuous diffusion and discontinuous jumps</p>
      </div>

      {/* Parameters */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-[rgba(18,18,24,0.95)] rounded-lg shadow-lg p-6 border border-[rgba(170,170,180,0.2)]">
          <h2 className="text-xl font-semibold mb-4 text-[rgb(240,255,255)]">Market Parameters</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[rgb(170,170,180)] mb-1">
                Initial Price (S₀): ${parameters.S0}
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
                Diffusion Volatility (σ): {(parameters.sigma * 100).toFixed(1)}%
              </label>
              <input
                type="range"
                min="0.05"
                max="0.5"
                step="0.01"
                value={parameters.sigma}
                onChange={(e) => setParameters({...parameters, sigma: parseFloat(e.target.value)})}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[rgb(170,170,180)] mb-1">
                Time Horizon (T): {parameters.T} years
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

        <div className="bg-[rgba(18,18,24,0.95)] border border-[rgba(170,170,180,0.2)] rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-[rgb(240,255,255)]">Jump Parameters</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[rgb(170,170,180)] mb-1">
                Jump Intensity (λ): {parameters.lambda.toFixed(2)} jumps/year
              </label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.01"
                value={parameters.lambda}
                onChange={(e) => setParameters({...parameters, lambda: parseFloat(e.target.value)})}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[rgb(170,170,180)] mb-1">
                Mean Jump Size (μⱼ): {(parameters.muJ * 100).toFixed(1)}%
              </label>
              <input
                type="range"
                min="-0.3"
                max="0.3"
                step="0.01"
                value={parameters.muJ}
                onChange={(e) => setParameters({...parameters, muJ: parseFloat(e.target.value)})}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[rgb(170,170,180)] mb-1">
                Jump Volatility (σⱼ): {(parameters.sigmaJ * 100).toFixed(1)}%
              </label>
              <input
                type="range"
                min="0.01"
                max="0.5"
                step="0.01"
                value={parameters.sigmaJ}
                onChange={(e) => setParameters({...parameters, sigmaJ: parseFloat(e.target.value)})}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[rgb(170,170,180)] mb-1">
                Strike Price (K): ${parameters.K}
              </label>
              <input
                type="range"
                min="50"
                max="200"
                step="5"
                value={parameters.K}
                onChange={(e) => setParameters({...parameters, K: parseFloat(e.target.value)})}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
        </div>

        <div className="bg-[rgba(18,18,24,0.95)] border border-[rgba(170,170,180,0.2)] rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-[rgb(240,255,255)]">Simulation Control</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[rgb(170,170,180)] mb-1">
                Number of Paths: {parameters.numPaths}
              </label>
              <input
                type="range"
                min="10"
                max="1000"
                step="10"
                value={parameters.numPaths}
                onChange={(e) => setParameters({...parameters, numPaths: parseInt(e.target.value)})}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[rgb(170,170,180)] mb-1">Visualization</label>
              <select 
                value={selectedView} 
                onChange={(e) => setSelectedView(e.target.value)}
                className="w-full p-2 border border-[rgba(170,170,180,0.3)] rounded-md mb-4 bg-[rgba(18,18,24,0.95)] text-[rgb(240,255,255)]"
              >
                <option value="paths">Price Paths</option>
                <option value="distribution">Final Price Distribution</option>
                <option value="jumps">Jump Events</option>
              </select>
            </div>

            <div className="space-y-2">
              <button
                onClick={runSimulation}
                disabled={isSimulating}
                className={`w-full py-2 px-4 rounded-md font-medium ${
                  isSimulating 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-[rgba(170,170,180,0.1)] border border-[rgba(170,170,180,0.3)] hover:bg-gray-700 text-white'
                }`}
              >
                {isSimulating ? 'Simulating...' : 'Run Simulation'}
              </button>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="showJumps"
                  checked={showJumps}
                  onChange={(e) => setShowJumps(e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="showJumps" className="text-sm text-[rgb(170,170,180)]">Highlight Jumps</label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chart */}
      <div className="bg-[rgba(18,18,24,0.95)] border border-[rgba(170,170,180,0.2)] rounded-lg shadow-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-[rgb(240,255,255)]">
          {selectedView === 'paths' ? 'Sample Price Paths' : 
           selectedView === 'distribution' ? 'Final Price Distribution' : 'Jump Events'}
        </h2>
        
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            {selectedView === 'paths' ? (
              <LineChart data={simulationData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(170,170,180,0.2)" />
                <XAxis dataKey="time" label={{ value: 'Time (years)', position: 'insideBottom', offset: -5, style: { fill: 'rgb(170,170,180)' } }} tick={{ fill: 'rgb(170,170,180)' }} tickCount={5} tickFormatter={(value) => value.toFixed(1)} />
                <YAxis label={{ value: 'Stock Price ($)', angle: -90, position: 'insideLeft', style: { fill: 'rgb(170,170,180)' }, dy: 70}} tick={{ fill: 'rgb(170,170,180)' }} />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'price' ? `${value.toFixed(2)}` : value,
                    name === 'price' ? 'Price' : name
                  ]}
                  contentStyle={{ backgroundColor: 'rgba(18,18,24,0.95)', border: '1px solid rgba(170,170,180,0.3)', color: 'rgb(240,255,255)' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="price" 
                  stroke="#5c99ff" // Changed from blue to a brighter blue
                  strokeWidth={1} 
                  dot={false} 
                  connectNulls={false}
                />
                {showJumps && (
                  <Scatter 
                    data={jumpData} 
                    dataKey="price"
                    fill="#ef4444" // Red for jump points
                  />
                )}
              </LineChart>
            ) : selectedView === 'distribution' ? (
              <BarChart data={distributionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(170,170,180,0.2)" />
                <XAxis 
                  dataKey="price" 
                  label={{ value: 'Final Price ($)', position: 'insideBottom', offset: -5, style: { fill: 'rgb(170,170,180)' } }}
                  tickFormatter={(value) => `${value.toFixed(0)}`}
                  tick={{ fill: 'rgb(170,170,180)' }}
                />
                <YAxis label={{ value: 'Frequency', angle: -90, position: 'insideLeft', style: { fill: 'rgb(170,170,180)' } }} tick={{ fill: 'rgb(170,170,180)' }} />
                <Tooltip 
                  formatter={(value) => [value.toFixed(4), 'Frequency']} 
                  contentStyle={{ backgroundColor: 'rgba(18,18,24,0.95)', border: '1px solid rgba(170,170,180,0.3)', color: 'rgb(240,255,255)' }}
                />
                <Bar dataKey="frequency" fill="#8b5cf6" />
              </BarChart>
            ) : (
              <ScatterChart data={jumpData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(170,170,180,0.2)" />
                <XAxis dataKey="time" label={{ value: 'Time (years)', position: 'insideBottom', offset: -5, style: { fill: 'rgb(170,170,180)' } }} tick={{ fill: 'rgb(170,170,180)' }} />
                <YAxis dataKey="jumpSize" label={{ value: 'Jump Size', angle: -90, position: 'insideLeft', style: { fill: 'rgb(170,170,180)' } }} tick={{ fill: 'rgb(170,170,180)' }} />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'jumpSize' ? `${(value * 100).toFixed(2)}%` : value,
                    name === 'jumpSize' ? 'Jump Size' : name
                  ]}
                  contentStyle={{ backgroundColor: 'rgba(18,18,24,0.95)', border: '1px solid rgba(170,170,180,0.3)', color: 'rgb(240,255,255)' }}
                />
                <Scatter dataKey="jumpSize" fill="#f59e0b" />
              </ScatterChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Results */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-[rgba(18,18,24,0.95)] border border-[rgba(170,170,180,0.2)] rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-[rgb(240,255,255)]">Option Pricing Results</h2>
          
          {optionResults.callPrice && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[rgba(92,153,255,0.1)] border border-[rgba(92,153,255,0.3)] p-4 rounded-lg">
                  <h3 className="font-semibold text-[#5c99ff]">Call Option (Jump-Diffusion)</h3>
                  <p className="text-2xl font-bold text-[#5c99ff]">
                    ${optionResults.callPrice.toFixed(4)}
                  </p>
                </div>

                <div className="bg-[rgba(92,153,255,0.1)] border border-[rgba(92,153,255,0.3)] p-4 rounded-lg">
                  <h3 className="font-semibold text-[#5c99ff]">Call Option (Black-Scholes)</h3>
                  <p className="text-2xl font-bold text-[#5c99ff]">
                    ${optionResults.bsCallPrice.toFixed(4)}
                  </p>
                </div>

                <div className="bg-[rgba(255,16,240,0.1)] border border-[rgba(255,16,240,0.3)] p-4 rounded-lg">
                  <h3 className="font-semibold text-[#ff10f0]">Put Option (Jump-Diffusion)</h3>
                  <p className="text-2xl font-bold text-[#ff10f0]">
                    ${optionResults.putPrice.toFixed(4)}
                  </p>
                </div>

                <div className="bg-[rgba(255,107,53,0.1)] border border-[rgba(255,107,53,0.3)] p-4 rounded-lg">
                  <h3 className="font-semibold text-[#ff6b35]">Put Option (Black-Scholes)</h3>
                  <p className="text-2xl font-bold text-[#ff6b35]">
                    ${optionResults.bsPutPrice.toFixed(4)}
                  </p>
                </div>
              </div>

              <div className="bg-[rgba(18,18,24,0.8)] border border-[rgba(170,170,180,0.2)] p-4 rounded-lg text-[rgb(170,170,180)]">
                <h3 className="font-semibold text-[rgb(240,255,255)] mb-2">Jump Impact</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Call Premium:</span> 
                    <span className="ml-2">${(optionResults.callPrice - optionResults.bsCallPrice).toFixed(4)}</span>
                  </div>
                  <div>
                    <span className="font-medium">Put Premium:</span> 
                    <span className="ml-2">${(optionResults.putPrice - optionResults.bsPutPrice).toFixed(4)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-[rgba(18,18,24,0.95)] border border-[rgba(170,170,180,0.2)] rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-[rgb(240,255,255)]">Jump Statistics</h2>
          
          {optionResults.totalJumps !== undefined && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)] p-4 rounded-lg">
                  <h3 className="font-semibold text-[#ef4444]">Total Jumps</h3>
                  <p className="text-2xl font-bold text-[#ef4444]">
                    {optionResults.totalJumps}
                  </p>
                  <p className="text-sm text-[#ef4444]">
                    Across all paths
                  </p>
                </div>

                <div className="bg-[rgba(255,107,53,0.1)] border border-[rgba(255,107,53,0.3)] p-4 rounded-lg">
                  <h3 className="font-semibold text-[#ff6b35]">Jump Frequency</h3>
                  <p className="text-2xl font-bold text-[#ff6b35]">
                    {optionResults.jumpFrequency.toFixed(2)}
                  </p>
                  <p className="text-sm text-[#ff6b35]">
                    Jumps per year
                  </p>
                </div>

                <div className="bg-[rgba(170,170,180,0.1)] border border-[rgba(170,170,180,0.3)] p-4 rounded-lg">
                  <h3 className="font-semibold text-[rgb(170,170,180)]">Avg Jump Size</h3>
                  <p className="text-2xl font-bold text-[rgb(170,170,180)]">
                    {(optionResults.avgJumpSize * 100).toFixed(2)}%
                  </p>
                  <p className="text-sm text-[rgb(170,170,180)]">
                    Mean percentage change
                  </p>
                </div>

                <div className="bg-[rgba(170,170,180,0.1)] border border-[rgba(170,170,180,0.3)] p-4 rounded-lg">
                  <h3 className="font-semibold text-[rgb(170,170,180)]">Final Price Avg</h3>
                  <p className="text-2xl font-bold text-[rgb(170,170,180)]">
                    ${optionResults.avgFinalPrice.toFixed(2)}
                  </p>
                  <p className="text-sm text-[rgb(170,170,180)]">
                    ±${optionResults.stdFinalPrice.toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="bg-[rgba(18,18,24,0.8)] border border-[rgba(170,170,180,0.2)] p-4 rounded-lg">
                <h3 className="font-semibold text-[rgb(240,255,255)] mb-2">Model Parameters</h3>
                <div className="grid grid-cols-2 gap-4 text-sm text-[rgb(170,170,180)]">
                  <div>
                    <span className="font-medium">Expected Jump Size:</span> 
                    <span className="ml-2">{(parameters.muJ * 100).toFixed(1)}%</span>
                  </div>
                  <div>
                    <span className="font-medium">Jump Volatility:</span> 
                    <span className="ml-2">{(parameters.sigmaJ * 100).toFixed(1)}%</span>
                  </div>
                  <div>
                    <span className="font-medium">Jump Intensity:</span> 
                    <span className="ml-2">{parameters.lambda.toFixed(2)}/year</span>
                  </div>
                  <div>
                    <span className="font-medium">Diffusion Vol:</span> 
                    <span className="ml-2">{(parameters.sigma * 100).toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Jump Distribution */}
      <div className="bg-[rgba(18,18,24,0.95)] border border-[rgba(170,170,180,0.2)] rounded-lg shadow-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-6 text-[rgb(240,255,255)]">Theoretical Jump Size Distribution</h2>
        <div className="h-80" style={{ paddingBottom: '20px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={jumpDistribution} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(170,170,180,0.2)" />
              <XAxis
                dataKey="jumpSize"
                label={{
                  value: 'Jump Size',
                  position: 'insideBottom',
                  offset: -15,
                  style: { fill: 'rgb(170,170,180)', fontSize: '14px' }
                }}
                tickFormatter={(value) => `${(value * 100).toFixed(1)}%`}
                tick={{ fill: 'rgb(170,170,180)', fontSize: '12px' }}
                height={60}
              />
              <YAxis
                label={{
                  value: 'Probability Density',
                  angle: -90,
                  position: 'insideLeft',
                  style: { fill: 'rgb(170,170,180)', fontSize: '14px' }
                }}
                tick={{ fill: 'rgb(170,170,180)', fontSize: '12px' }}
                width={80}
              />
              <Tooltip
                formatter={(value) => [value.toFixed(4), 'Density']}
                labelFormatter={(value) => `Jump Size: ${(value * 100).toFixed(2)}%`}
                contentStyle={{
                  backgroundColor: 'rgba(18,18,24,0.95)',
                  border: '1px solid rgba(170,170,180,0.3)',
                  color: 'rgb(240,255,255)'
                }}
              />
              <Bar dataKey="frequency" fill="#ef4444" fillOpacity={0.7} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Model Explanation */}
      <div className="bg-[rgba(18,18,24,0.95)] border border-[rgba(170,170,180,0.2)] rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4 text-[rgb(240,255,255)]">Merton Jump Diffusion Model</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-[rgb(240,255,255)] mb-2">Model Equation</h3>
            <div className="bg-[rgba(18,18,24,0.8)] border border-[rgba(170,170,180,0.2)] p-4 rounded-lg font-mono text-sm text-[rgb(170,170,180)]">
              <div>dS = (r - λk)S dt + σS dW + S∫ J dN(t)</div>
              <div className="mt-2 text-xs text-gray-600">
                where:<br/>
                • λ = jump intensity<br/>
                • k = expected jump size - 1<br/>
                • J ~ lognormal jump size<br/>
                • N(t) = Poisson process
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-[rgb(240,255,255)] mb-2">Key Features</h3>
            <ul className="text-sm text-[rgb(170,170,180)] space-y-1">
              <li>• Combines continuous diffusion with jumps</li>
              <li>• Captures market crashes and sudden moves</li>
              <li>• More realistic than pure Black-Scholes</li>
              <li>• Better explains volatility smiles</li>
              <li>• Accounts for tail risk in returns</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-[rgba(170,170,180,0.1)] border border-[rgba(170,170,180,0.3)] p-3 rounded-lg">
            <h4 className="font-semibold text-[rgb(170,170,180)] text-sm">λ (Lambda)</h4>
            <p className="text-xs text-[rgb(170,170,180)]">Average number of jumps per unit time</p>
          </div>
          
          <div className="bg-[rgba(170,170,180,0.1)] border border-[rgba(170,170,180,0.3)] p-3 rounded-lg">
            <h4 className="font-semibold text-[rgb(170,170,180)] text-sm">μⱼ (Mu-J)</h4>
            <p className="text-xs text-[rgb(170,170,180)]">Mean of log-jump size distribution</p>
          </div>
          
          <div className="bg-[rgba(255,16,240,0.1)] border border-[rgba(255,16,240,0.3)] p-3 rounded-lg">
            <h4 className="font-semibold text-[#ff10f0] text-sm">σⱼ (Sigma-J)</h4>
            <p className="text-xs text-[#ff10f0]">Standard deviation of log-jump sizes</p>
          </div>
          
          <div className="bg-[rgba(255,107,53,0.1)] border border-[rgba(255,107,53,0.3)] p-3 rounded-lg">
            <h4 className="font-semibold text-[#ff6b35] text-sm">Applications</h4>
            <p className="text-xs text-[#ff6b35]">Crisis modeling, tail risk, exotic options</p>
          </div>
        </div>

        <div className="mt-6 bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)] p-4 rounded-lg">
          <h3 className="font-semibold text-[#ef4444] mb-2">Why Jump Diffusion Matters</h3>
          <div className="text-sm text-[#ef4444] space-y-1">
            <p>• <strong>Market Reality:</strong> Stock prices exhibit sudden jumps during news events, earnings announcements, and market crashes</p>
            <p>• <strong>Option Pricing:</strong> Pure Black-Scholes underprices out-of-the-money options due to missing tail risk</p>
            <p>• <strong>Risk Management:</strong> Jump models better capture extreme loss scenarios for VaR calculations</p>
            <p>• <strong>Portfolio Hedging:</strong> Understanding jump risk helps design better hedging strategies</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MertonJumpDiffusion;