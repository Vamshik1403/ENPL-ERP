'use client';

import React, { useEffect } from 'react';
import { useFormPanel } from '@/components/contexts/FormPanelContext';
import { X } from 'lucide-react';
import { cn } from '@/app/lib/utils';

interface SlideFormPanelProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  width?: string;
}

const COLLAPSED_SIDEBAR_WIDTH = '4rem'; // 64px = w-16

export default function SlideFormPanel({
  title,
  description,
  children,
  isOpen,
  onClose,
  width,
}: SlideFormPanelProps) {
  const { openPanel, closePanel } = useFormPanel();

  useEffect(() => {
    if (isOpen) {
      openPanel();
    } else {
      closePanel();
    }
  }, [isOpen, openPanel, closePanel]);

  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  return (
    <>
      {/* Overlay */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px] transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />

      {/* Panel — stretches from collapsed sidebar edge to right edge */}
      <div
        className={cn(
          'fixed top-0 right-0 z-50 h-full bg-white shadow-2xl border-l border-gray-200 transition-transform duration-300 ease-in-out flex flex-col',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
        style={{ width: width || `calc(100% - ${COLLAPSED_SIDEBAR_WIDTH})` }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50/50 shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            {description && (
              <p className="text-sm text-gray-500 mt-0.5">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {children}
        </div>
      </div>
    </>
  );
}
