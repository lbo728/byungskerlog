'use client';

import { useState } from 'react';

interface BbaengguGreetingProps {
  name?: string;
}

export default function BbaengguGreeting({ name = '병스커' }: BbaengguGreetingProps) {
  const [clicks, setClicks] = useState(0);

  const messages = [
    `안녕 ${name}! 🦞`,
    `뺑뺑 돌면서 일하는 중이야! 🦞💪`,
    `${name}를 위해 24시간 대기 중! 🦞⚡`,
    `Never Gives Up! 🦞🔥`,
    `뺑구가 도와줄게! 🦞✨`,
  ];

  const handleClick = () => {
    setClicks((prev) => prev + 1);
  };

  return (
    <div
      onClick={handleClick}
      className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg cursor-pointer hover:scale-105 transition-transform duration-200 shadow-lg"
    >
      <span className="text-2xl animate-bounce">🦞</span>
      <span className="font-semibold">
        {messages[clicks % messages.length]}
      </span>
      {clicks > 0 && (
        <span className="text-xs opacity-75">
          (클릭: {clicks})
        </span>
      )}
    </div>
  );
}
