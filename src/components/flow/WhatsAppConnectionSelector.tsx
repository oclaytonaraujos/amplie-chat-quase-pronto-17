import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { WhatsAppConnectionSelector as NewWhatsAppConnectionSelector, MultiWhatsAppConnectionSelector } from '@/components/whatsapp/WhatsAppConnectionSelector';

// Re-export new components for compatibility
export const WhatsAppConnectionSelector = NewWhatsAppConnectionSelector;
export { MultiWhatsAppConnectionSelector };