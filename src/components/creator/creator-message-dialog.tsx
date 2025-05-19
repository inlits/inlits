import React, { useState, useRef, useEffect } from 'react';
import { Send, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { ImageUpload } from '@/components/upload/image-upload';

interface Message {
  id: string;
  content: string;
  type: 'text' | 'image';
  sender_id: string;
  created_at: string;
}

interface CreatorMessageDialogProps {
  recipientId: string;
  recipientName: string;
  recipientAvatar?: string;
  onClose: () => void;
}

export function CreatorMessageDialog({ 
  recipientId, 
  recipientName,
  recipientAvatar,
  onClose 
}: CreatorMessageDialogProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load messages
  useEffect(() => {
    const loadMessages = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
          .order('created_at', { ascending: true });

        if (error) throw error;
        setMessages(data || []);

        // Mark messages as read
        await supabase
          .from('messages')
          .update({ read: true })
          .eq('recipient_id', user.id)
          .eq('sender_id', recipientId);
      } catch (error) {
        console.error('Error loading messages:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `sender_id=eq.${recipientId},recipient_id=eq.${user?.id}`
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            setMessages(prev => [...prev, payload.new as Message]);
            
            // Mark message as read
            await supabase
              .from('messages')
              .update({ read: true })
              .eq('id', payload.new.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, recipientId]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [newMessage]);

  const handleSend = async () => {
    if (!user || !newMessage.trim()) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          recipient_id: recipientId,
          content: newMessage.trim(),
          type: 'text'
        });

      if (error) throw error;
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleImageUpload = async (url: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          recipient_id: recipientId,
          content: url,
          type: 'image'
        });

      if (error) throw error;
      setShowImageUpload(false);
    } catch (error) {
      console.error('Error sending image:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
         onClick={onClose}>
      <div 
        className="bg-background rounded-lg shadow-xl w-full max-w-lg mx-4 flex flex-col max-h-[80vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-muted">
              {recipientAvatar ? (
                <img
                  src={recipientAvatar}
                  alt={recipientName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-medium">
                  {recipientName[0].toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <h3 className="font-medium">{recipientName}</h3>
              <p className="text-xs text-muted-foreground">Creator</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-accent rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length > 0 ? (
            messages.map(message => {
              const isOwn = message.sender_id === user?.id;
              return (
                <div
                  key={message.id}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[70%] ${isOwn ? 'bg-primary text-primary-foreground' : 'bg-muted'} rounded-lg px-4 py-2`}>
                    {message.type === 'text' ? (
                      <p className="whitespace-pre-wrap break-words text-sm">
                        {message.content}
                      </p>
                    ) : (
                      <img
                        src={message.content}
                        alt="Message"
                        className="rounded max-w-full"
                        onLoad={() => messagesEndRef.current?.scrollIntoView()}
                      />
                    )}
                    <p className="text-xs opacity-70 mt-1">
                      {new Date(message.created_at).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No messages yet
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Image Upload Dialog */}
        {showImageUpload && (
          <div className="p-4 border-t">
            <ImageUpload
              bucket="message-images"
              onUploadComplete={handleImageUpload}
              aspectRatio="square"
              className="w-full h-48"
            />
            <button
              onClick={() => setShowImageUpload(false)}
              className="w-full mt-2 px-4 py-2 text-sm rounded-lg border hover:bg-accent transition-colors"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Input */}
        {!showImageUpload && (
          <div className="p-4 border-t">
            <div className="flex items-end gap-2">
              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message..."
                  className="w-full px-4 py-2 pr-12 text-sm rounded-lg border bg-background resize-none max-h-32 focus:outline-none focus:ring-2 focus:ring-primary"
                  rows={1}
                />
                <button
                  onClick={() => setShowImageUpload(true)}
                  className="absolute right-2 bottom-2 p-1 hover:bg-accent rounded transition-colors"
                >
                  <ImageIcon className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
              <button
                onClick={handleSend}
                disabled={!newMessage.trim() || sending}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {sending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}