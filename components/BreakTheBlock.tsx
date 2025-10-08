"use client";

import { useState, useEffect } from "react";

const MINECRAFT_FACTS = [
  "Creepers were originally a coding mistake when making pigs!",
  "The Enderman language is actually English played backwards.",
  "Minecraft has over 140 million monthly players worldwide!",
  "The first version of Minecraft was made in just 6 days.",
  "Diamonds are most common at Y-level 12 (now Y-level -58).",
  "A full day-night cycle in Minecraft is exactly 20 minutes.",
  "The Nether is 8 times smaller than the Overworld.",
  "Villagers can't climb ladders, but they can climb vines!",
  "Redstone was inspired by electrical circuits.",
  "The default player skin 'Steve' is 1.8 blocks tall.",
  "Minecraft worlds are bigger than planet Earth!",
  "Pigs can be ridden with a saddle and carrot on a stick.",
  "Water and lava make cobblestone when they meet.",
  "You can use a clock to tell time even underground.",
  "Wolves only spawn in forest and taiga biomes.",
  "Ice melts faster in the Nether than in the Overworld.",
  "TNT doesn't hurt you underwater (but still destroys blocks).",
  "Sheep regrow their wool by eating grass blocks.",
  "Bees get angry if you harvest honey without a campfire below.",
  "You can tame cats with raw fish in villages.",
  "Slimes only spawn in certain chunks called 'slime chunks'.",
  "The Dragon Egg is the rarest block in Minecraft.",
  "Zombies can break down doors on Hard difficulty.",
  "You can dye sheep with different colors of dye.",
  "Cacti can be used as a natural trash disposal system.",
  "Boats are faster than walking on ice blocks.",
  "Fishing gives you a chance to catch treasure items!",
  "Endermen are afraid of water and will teleport away.",
  "You can sleep in beds to skip the dangerous night.",
  "Compasses always point to your world spawn point.",
];

export default function BreakTheBlock() {
  const [hits, setHits] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [fact, setFact] = useState("");
  const [loading, setLoading] = useState(false);
  const [usedFacts, setUsedFacts] = useState<string[]>([]);

  // Try to load cached fact from localStorage
  useEffect(() => {
    try {
      const cached = localStorage.getItem("btb:lastFact");
      const cachedDate = localStorage.getItem("btb:lastDate");
      if (cached && cachedDate) {
        const today = new Date().toISOString().split("T")[0];
        if (cachedDate === today && cached) {
          setFact(cached);
          setRevealed(true);
          setHits(10);
          return;
        }
      }
    } catch (e) {
      // Ignore localStorage errors
    }
  }, []);

  const getFact = async () => {
    setLoading(true);
    
    try {
      // Try to fetch from AI endpoint
      const response = await fetch("/api/ai-funfact");
      if (response.ok) {
        const data = await response.json();
        if (data.fact) {
          setFact(data.fact);
          cacheFact(data.fact);
          setLoading(false);
          return;
        }
      }
    } catch (e) {
      // AI API failed, use fallback
    }
    
    // Fallback to local facts
    const availableFacts = MINECRAFT_FACTS.filter(f => !usedFacts.includes(f));
    let selectedFact: string;
    
    if (availableFacts.length === 0) {
      // All facts used, reset and pick from full list
      setUsedFacts([]);
      selectedFact = MINECRAFT_FACTS[Math.floor(Math.random() * MINECRAFT_FACTS.length)];
    } else {
      selectedFact = availableFacts[Math.floor(Math.random() * availableFacts.length)];
    }
    
    setUsedFacts(prev => [...prev, selectedFact]);
    setFact(selectedFact);
    cacheFact(selectedFact);
    setLoading(false);
  };

  const cacheFact = (factText: string) => {
    try {
      const today = new Date().toISOString().split("T")[0];
      localStorage.setItem("btb:lastFact", factText);
      localStorage.setItem("btb:lastDate", today);
    } catch (e) {
      // Ignore localStorage errors
    }
  };

  const handleClick = async () => {
    if (revealed) return;
    
    const newHits = hits + 1;
    setHits(newHits);
    
    if (newHits >= 10) {
      setRevealed(true);
      await getFact();
    }
  };

  const resetGame = () => {
    setHits(0);
    setRevealed(false);
    setFact("");
    setLoading(false);
    try {
      localStorage.removeItem("btb:lastFact");
      localStorage.removeItem("btb:lastDate");
    } catch (e) {
      // Ignore localStorage errors
    }
  };

  const crackIntensity = Math.min(hits, 10) / 10;
  const shakeClass = hits > 0 && !revealed ? "animate-pulse" : "";

  if (revealed) {
    return (
      <div className="flex flex-col items-center gap-3">
        <div className="w-60 min-h-[120px] card-block p-3 text-center text-sm space-y-3">
          <div className="text-lg">🎉</div>
          <p className="font-semibold text-mc-wood-dark">Block Broken!</p>
          {loading ? (
            <p className="text-mc-stone">⛏️ Mining fun fact...</p>
          ) : (
            <div className="card-block bg-mc-sky/80 p-3 rounded text-center text-sm">
              💡 <strong>Minecraft Fun Fact:</strong> {fact}
            </div>
          )}
          <button
            onClick={resetGame}
            className="btn-mc text-xs mt-2"
          >
            Break Another Block?
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        onClick={handleClick}
        role="button"
        aria-label={`Hit count: ${hits} of 10`}
        aria-pressed={revealed}
        className={`
          relative w-24 h-24 bg-gradient-to-b from-gray-400 to-gray-600 
          border-4 border-gray-700 rounded-lg shadow-lg
          hover:scale-105 active:scale-95 transition-transform
          ${shakeClass}
        `}
        style={{
          backgroundImage: `
            linear-gradient(45deg, transparent 40%, rgba(0,0,0,0.1) 50%, transparent 60%),
            ${crackIntensity > 0.3 ? 'linear-gradient(135deg, transparent 20%, rgba(0,0,0,0.2) 30%, transparent 40%),' : ''}
            ${crackIntensity > 0.6 ? 'linear-gradient(-45deg, transparent 60%, rgba(0,0,0,0.3) 70%, transparent 80%),' : ''}
            linear-gradient(to bottom, #9ca3af, #6b7280)
          `,
        }}
      >
        <div className="absolute inset-2 bg-gradient-to-br from-gray-300 to-gray-500 rounded">
          <div className="absolute inset-1 bg-gradient-to-br from-gray-200 to-gray-400 rounded flex items-center justify-center">
            {crackIntensity > 0.8 && (
              <div className="text-gray-800 font-bold text-lg">💥</div>
            )}
          </div>
        </div>
        
        {/* Progress indicator */}
        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-16 h-1 bg-gray-300 rounded">
          <div 
            className="h-full bg-red-500 rounded transition-all duration-200"
            style={{ width: `${(hits / 10) * 100}%` }}
          />
        </div>
      </button>
      
      <p className="text-xs italic text-mc-stone text-center max-w-48">
        💬 Ebot whispers: What happens if you tap this block?
      </p>
    </div>
  );
}