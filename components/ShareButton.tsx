import React from 'react';

interface ShareButtonProps {
  itemId?: string;
  itemName?: string;
  className?: string;
}

export const ShareButton: React.FC<ShareButtonProps> = ({ itemId, itemName, className = '' }) => {
  if (!itemId) {
    return null;
  }

  const url = `${window.location.origin}/item/${itemId}`;
  const text = itemName 
    ? `Check out "${itemName}" from Arcane Forge - ${url}`
    : `Check out this magic item from Arcane Forge - ${url}`;

  const shareToTwitter = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(twitterUrl, '_blank', 'width=550,height=420');
  };

  const shareToFacebook = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    window.open(facebookUrl, '_blank', 'width=550,height=420');
  };

  return (
    <div className={`flex gap-2 ${className}`}>
      <button
        onClick={shareToTwitter}
        className="flex-1 px-4 py-2 bg-[#0f0f13] border border-[#2a2a35] rounded text-sm font-fantasy uppercase tracking-wider transition-colors hover:border-blue-500 hover:bg-blue-950/20 text-slate-400 hover:text-blue-400"
        title="Share on Twitter"
      >
        Twitter
      </button>
      <button
        onClick={shareToFacebook}
        className="flex-1 px-4 py-2 bg-[#0f0f13] border border-[#2a2a35] rounded text-sm font-fantasy uppercase tracking-wider transition-colors hover:border-blue-600 hover:bg-blue-950/20 text-slate-400 hover:text-blue-400"
        title="Share on Facebook"
      >
        Facebook
      </button>
    </div>
  );
};

