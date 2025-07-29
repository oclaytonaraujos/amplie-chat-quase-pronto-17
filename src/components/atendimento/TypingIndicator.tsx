import React, { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { MessageSquare } from 'lucide-react';
import { useConversationRealtime } from '@/hooks/useConversationRealtime';
import { supabase } from '@/integrations/supabase/client';

interface TypingIndicatorProps {
  conversaId: string;
  className?: string;
}

interface TypingUser {
  userId: string;
  nome?: string;
  timestamp: string;
}

export function TypingIndicator({ conversaId, className = '' }: TypingIndicatorProps) {
  const { typingUsers } = useConversationRealtime(conversaId);
  const [usersWithNames, setUsersWithNames] = useState<TypingUser[]>([]);

  // Fetch user names for typing users
  useEffect(() => {
    if (typingUsers.length === 0) {
      setUsersWithNames([]);
      return;
    }

    const fetchUserNames = async () => {
      const userIds = typingUsers.map(user => user.userId);
      
      try {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, nome')
          .in('id', userIds);

        const usersWithNamesData = typingUsers.map(user => ({
          ...user,
          nome: profiles?.find(p => p.id === user.userId)?.nome || 'Usuário'
        }));

        setUsersWithNames(usersWithNamesData);
      } catch (error) {
        console.error('Error fetching user names:', error);
        setUsersWithNames(typingUsers.map(user => ({ ...user, nome: 'Usuário' })));
      }
    };

    fetchUserNames();
  }, [typingUsers]);

  if (usersWithNames.length === 0) {
    return null;
  }

  const getTypingText = () => {
    if (usersWithNames.length === 1) {
      return `${usersWithNames[0].nome} está digitando...`;
    } else if (usersWithNames.length === 2) {
      return `${usersWithNames[0].nome} e ${usersWithNames[1].nome} estão digitando...`;
    } else {
      return `${usersWithNames[0].nome} e mais ${usersWithNames.length - 1} pessoas estão digitando...`;
    }
  };

  return (
    <Badge 
      variant="secondary" 
      className={`flex items-center gap-2 animate-pulse ${className}`}
    >
      <MessageSquare className="h-3 w-3" />
      <span className="text-xs">{getTypingText()}</span>
      <div className="flex gap-1">
        <div className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </Badge>
  );
}

interface SmartTypingInputProps {
  conversaId: string;
  onTypingChange?: (isTyping: boolean) => void;
  children: React.ReactNode;
}

export function SmartTypingInput({ conversaId, onTypingChange, children }: SmartTypingInputProps) {
  const { sendTypingIndicator } = useConversationRealtime(conversaId);
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);

  const handleInputChange = () => {
    if (!isTyping) {
      setIsTyping(true);
      sendTypingIndicator(true);
      onTypingChange?.(true);
    }

    // Clear existing timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    // Set new timeout to stop typing indicator
    const timeout = setTimeout(() => {
      setIsTyping(false);
      sendTypingIndicator(false);
      onTypingChange?.(false);
    }, 2000); // Stop typing after 2 seconds of inactivity

    setTypingTimeout(timeout);
  };

  const handleInputBlur = () => {
    if (isTyping) {
      setIsTyping(false);
      sendTypingIndicator(false);
      onTypingChange?.(false);
    }
    
    if (typingTimeout) {
      clearTimeout(typingTimeout);
      setTypingTimeout(null);
    }
  };

  useEffect(() => {
    return () => {
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
      if (isTyping) {
        sendTypingIndicator(false);
      }
    };
  }, [typingTimeout, isTyping, sendTypingIndicator]);

  return (
    <div
      onInput={handleInputChange}
      onBlur={handleInputBlur}
    >
      {children}
    </div>
  );
}