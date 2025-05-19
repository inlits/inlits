import React from 'react';
import { BookOpen, FileText, Headphones, BookMarked } from 'lucide-react';
import { ContentType } from '@/lib/types';

interface ContentTypeIconProps {
  type: ContentType;
  className?: string;
}

export function ContentTypeIcon({ type, className }: ContentTypeIconProps) {
  switch (type) {
    case 'article':
      return <FileText className={className} />;
    case 'ebook':
    case 'book':
      return <BookOpen className={className} />;
    case 'audiobook':
    case 'podcast':
      return <Headphones className={className} />;
    case 'summary':
      return <BookMarked className={className} />;
    default:
      return null;
  }
}