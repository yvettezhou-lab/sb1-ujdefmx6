import React from 'react';
import quillGold from '../assets/quill-gold.png';

type QuillIconProps = {
  size?: number;
  strokeWidth?: number;
  className?: string;
};

export default function QuillIcon({
  size = 24,
  className,
}: QuillIconProps) {
  return (
    <img
      src={quillGold}
      width={size}
      height={size}
      className={className}
      alt=""
      aria-hidden="true"
      style={{
        objectFit: 'contain',
        display: 'block',
      }}
    />
  );
}
