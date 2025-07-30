import React from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface ChatSearchProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  placeholder?: string;
}

export function ChatSearch({ value, onChange, onClear, placeholder = "Buscar conversas..." }: ChatSearchProps) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
      <Input 
        placeholder={placeholder}
        className="pl-10 pr-8 h-9 text-sm" 
        value={value} 
        onChange={e => onChange(e.target.value)} 
      />
      {value && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100"
        >
          <X className="w-3 h-3" />
        </Button>
      )}
    </div>
  );
}