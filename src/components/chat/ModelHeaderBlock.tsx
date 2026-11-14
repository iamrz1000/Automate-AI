import React from 'react';
import { Info, ThumbsUp, ArrowRight, User } from 'lucide-react';
import { ModelInfo } from '../../types';

interface ModelHeaderBlockProps {
  model: ModelInfo;
  onOpenDetails: () => void;
  onOpenModelSelector?: () => void;
}

export const ModelHeaderBlock: React.FC<ModelHeaderBlockProps> = ({
  model,
  onOpenDetails,
}) => {
  return (
    <div className="flex flex-col items-center text-center max-w-xl mx-auto pt-8 pb-4 px-4 select-none">
      {/* Terracotta/Coral Sunburst Star matching Screenshot 1 */}
      <div
        className="w-16 h-16 mb-4 flex items-center justify-center cursor-pointer hover:scale-105 transition-transform"
        onClick={onOpenDetails}
        title="View Model Specs"
      >
        <svg
          viewBox="0 0 100 100"
          className="w-16 h-16 text-[#c86d51] fill-current"
        >
          {/* 12-pointed organic sunburst matching Opus 5 icon in Screenshot 1 */}
          <g transform="translate(50,50)">
            {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg, i) => (
              <rect
                key={i}
                x="-3.5"
                y="-30"
                width="7"
                height="22"
                rx="3.5"
                transform={`rotate(${deg})`}
                className="fill-[#c86d51]"
              />
            ))}
          </g>
        </svg>
      </div>

      {/* Model Name + Info Icon */}
      <div className="flex items-center gap-1.5 mb-1.5">
        <h1 className="text-xl sm:text-2xl font-bold text-[#1e293b] tracking-tight">
          {model.name}
        </h1>
        <button
          onClick={onOpenDetails}
          title="Inspect Model Details"
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <Info className="w-4 h-4" />
        </button>
      </div>

      {/* Provider Attribution with Likes */}
      <div className="flex items-center justify-center gap-1.5 text-xs text-[#64748b] mb-3">
        <User className="w-3.5 h-3.5" />
        <span>By {model.provider}</span>
        <span>•</span>
        <span>250.1K</span>
        <ThumbsUp className="w-3.5 h-3.5 text-[#64748b] fill-[#64748b]/10" />
      </div>

      {/* Description matching Reference A */}
      <p className="text-xs sm:text-[13px] text-[#475569] max-w-lg leading-relaxed mb-4">
        {model.description}
      </p>

      {/* Pricing Strip with 30% off matching Reference A */}
      <div className="flex items-center justify-center gap-2 text-xs text-[#475569]">
        <div className="flex items-center gap-1">
          <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
          <span className="line-through text-gray-400">$6.02</span>
          <span className="font-bold text-gray-900">$4.22/M</span>
          <span className="bg-[#ecfdf5] text-[#059669] text-[10px] font-bold px-1.5 py-0.5 rounded">
            30% off
          </span>
        </div>

        <span className="text-gray-300">|</span>

        <div className="flex items-center gap-1">
          <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
          <span className="line-through text-gray-400">$30.12</span>
          <span className="font-bold text-gray-900">$21.08/M</span>
        </div>
      </div>
    </div>
  );
};
