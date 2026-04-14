import React, { useMemo } from 'react';

const FLOWER_EMOJIS = ['🌸', '🌺', '💮', '🏵️'];

export const FallingFlowers = () => {
  // Generate random flowers positioned only on the left (0-15%) and right (85-100%) edges
  const flowers = useMemo(() => {
    const list = [];
    for (let i = 0; i < 20; i++) {
        // Randomly pick left or right side
        const isLeft = Math.random() > 0.5;
        const xPos = isLeft 
            ? Math.random() * 15 // 0% to 15%
            : 85 + (Math.random() * 15); // 85% to 100%
        
        list.push({
            id: i,
            emoji: FLOWER_EMOJIS[Math.floor(Math.random() * FLOWER_EMOJIS.length)],
            left: `${xPos}%`,
            animationDuration: `${10 + Math.random() * 15}s`,
            animationDelay: `${Math.random() * 20}s`,
            fontSize: `${1 + Math.random() * 1.5}rem`,
            opacity: 0.3 + Math.random() * 0.5
        });
    }
    return list;
  }, []);

  return (
    <>
      {flowers.map(f => (
        <span 
          key={f.id} 
          className="flower-petal"
          style={{
            left: f.left,
            animationDuration: f.animationDuration,
            animationDelay: f.animationDelay,
            fontSize: f.fontSize,
            opacity: f.opacity
          }}
        >
          {f.emoji}
        </span>
      ))}
    </>
  );
};
