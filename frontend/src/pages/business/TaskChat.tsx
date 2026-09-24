import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {
  Send,
  Paperclip,
  X,
  FileText,
  Download,
  Loader2,
  Image as ImageIcon,
} from 'lucide-react';
import { chatApi } from '../../api/chat';
import { tasksApi } from '../../api/tasks';
import { uploadsApi } from '../../api/uploads';
import { getSocket } from '../../lib/socket';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import type { ChatMessage, Task } from '../../types';

const isImageFile = (fileNameOrUrl?: string) => {
  if (!fileNameOrUrl) return false;
  return /\.(jpeg|jpg|png|gif|webp|svg)$/i.test(fileNameOrUrl);
};

const TaskChat: React.FC = () => {
  const { taskId: paramTaskId } = useParams<{ taskId?: string }>();
  const { user } = useAuth();
  const toast = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTaskId, setActiveTaskId] = useState<string>(paramTaskId || '');
  const [newMessage, setNewMessage] = useState('');
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [attachment, setAttachment] = useState<{ fileUrl: string; fileName: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const loadTasks = async () => {
      try {
        const res = await tasksApi.getMyTasks();
        if (res.success && res.data && res.data.length > 0) {
          setTasks(res.data);
          if (!activeTaskId) {
            setActiveTaskId(res.data[0].id);
          }
        }
      } catch (err) {
        console.warn('Failed to load tasks for chat:', err);
      }
    };
    loadTasks();
  }, [activeTaskId]);

  useEffect(() => {
    if (!activeTaskId) return;

    // Fetch initial chat messages from backend
    const loadMessages = async () => {
      try {
        const res = await chatApi.getMessages(activeTaskId);
        if (res.success && res.data) {
          setMessages(res.data);
        }
      } catch (err) {
        console.warn('Could not fetch task messages:', err);
      }
    };
    loadMessages();

    // Setup real-time Socket.IO connection
    const socket = getSocket();
    setIsLiveConnected(socket.connected);

    socket.on('connect', () => {
      setIsLiveConnected(true);
      socket.emit('join-task', activeTaskId);
    });

    socket.emit('join-task', activeTaskId);

    const handleNewMessage = (msg: ChatMessage) => {
      if (msg.taskId === activeTaskId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      }
    };

    socket.on('new-message', handleNewMessage);

    return () => {
      socket.emit('leave-task', activeTaskId);
      socket.off('new-message', handleNewMessage);
    };
  }, [activeTaskId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const res = await uploadsApi.uploadFile(file);
      if (res.success && res.data) {
        setAttachment({
          fileUrl: res.data.fileUrl,
          fileName: res.data.originalName || file.name,
        });
        toast.success('Attachment Uploaded', `${file.name} ready to send.`);
      } else {
        toast.error('Upload Failed', res.message || 'Unable to upload file.');
      }
    } catch {
      toast.error('Upload Failed', 'Network error during file upload.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && !attachment) || !activeTaskId) return;

    const messageText = newMessage.trim();
    const fileUrl = attachment?.fileUrl;
    const fileName = attachment?.fileName;

    setNewMessage('');
    setAttachment(null);

    const res = await chatApi.sendMessage(
      activeTaskId,
      messageText,
      user?.role || 'BUSINESS',
      fileUrl,
      fileName
    );

    if (res.success && res.data) {
      const msg = res.data;
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    }
  };

  const activeTask = tasks.find((t) => t.id === activeTaskId);

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-ink-text">Business Worker Thread Chat</h1>
          <p className="text-xs text-ink-muted">Direct real-time support thread with assigned workers & file sharing.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isLiveConnected ? 'bg-moss-primary animate-pulse' : 'bg-moss-primary'}`} />
          <span className="text-xs text-ink-muted">{isLiveConnected ? 'Socket.IO Live' : 'Connecting'}</span>
        </div>
      </div>

      <div className="rounded-3xl bg-paper-bg border border-hairline shadow-sm flex flex-col h-[580px] overflow-hidden">
        <div className="p-4 bg-paper-bg border-b border-hairline flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-ink-text truncate max-w-md">
              {activeTask?.title || `Task Thread: ${activeTaskId}`}
            </h3>
            <p className="text-[10px] text-ink-muted">Live Worker Chat Channel with Media Attachments</p>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-moss-sage text-moss-deep border border-moss-sage">
            Room: task:{activeTaskId}
          </span>
        </div>

        <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-paper-bg/50">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-ink-muted text-xs">
              <p>No messages in this chat thread yet.</p>
              <p className="text-[11px] text-ink-muted mt-1">Send instructions or attach reference files to coordinate with workers.</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isSelf = (user?.id && msg.senderId)
                ? msg.senderId === user.id
                : msg.senderRole === (user?.role || 'BUSINESS');
              const hasImage = isImageFile(msg.fileName || msg.fileUrl);
              return (
                <div key={msg.id} className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'} space-y-1`}>
                  <div className="flex items-center gap-1.5 text-[10px] text-ink-muted">
                    <span className="text-ink-text font-semibold">{isSelf ? 'You' : msg.senderName}</span>
                    <span>•</span>
                    <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>

                  <div
                    className={`p-3.5 rounded-2xl max-w-md text-xs leading-relaxed shadow-sm ${
                      isSelf
                        ? 'bg-moss-sage border border-moss-sage text-ink-text font-medium rounded-tr-none'
                        : 'bg-paper-bg border border-hairline text-ink-text font-medium rounded-tl-none'
                    }`}
                  >
                    {msg.message && <p className="text-ink-text font-medium break-words">{msg.message}</p>}

                    {/* Image Attachment Preview */}
                    {msg.fileUrl && hasImage && (
                      <div className="mt-2">
                        <a
                          href={msg.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block group/img overflow-hidden rounded-xl border border-hairline/80 bg-paper-bg"
                        >
                          <img
                            src={msg.fileUrl}
                            alt={msg.fileName || 'Attachment'}
                            className="max-h-56 w-full object-cover rounded-xl group-hover/img:scale-105 transition-transform"
                          />
                        </a>
                        <span className="text-[10px] text-ink-muted mt-1 block truncate">
                          📎 {msg.fileName || 'Attached image'}
                        </span>
                      </div>
                    )}

                    {/* Document / File Card */}
                    {msg.fileUrl && !hasImage && (
                      <a
                        href={msg.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        download={msg.fileName}
                        className="mt-2 p-2.5 rounded-xl border border-hairline bg-paper-bg hover:border-moss-sage flex items-center gap-2.5 transition-all text-xs group/file text-ink-text shadow-sm"
                      >
                        <div className="w-8 h-8 rounded-lg bg-paper-bg border border-hairline flex items-center justify-center text-ink-text shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <p className="font-semibold text-ink-text truncate">{msg.fileName || 'Attached File'}</p>
                          <p className="text-[10px] text-ink-muted">Click to view / download</p>
                        </div>
                        <Download className="w-4 h-4 text-ink-muted group-hover/file:text-ink-text shrink-0" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Attachment Preview Chip */}
        {attachment && (
          <div className="px-4 py-2 bg-paper-bg border-t border-hairline flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-moss-primary">
              {isImageFile(attachment.fileName) ? (
                <ImageIcon className="w-4 h-4 text-moss-deep" />
              ) : (
                <FileText className="w-4 h-4 text-moss-deep" />
              )}
              <span className="font-semibold truncate max-w-xs text-ink-text">{attachment.fileName}</span>
              <span className="text-[10px] text-moss-deep bg-moss-sage px-1.5 py-0.5 rounded border border-moss-sage">
                Ready
              </span>
            </div>
            <button
              type="button"
              onClick={() => setAttachment(null)}
              className="p-1 rounded-lg text-ink-muted hover:text-moss-deep transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Send Form */}
        <form onSubmit={handleSend} className="p-3 bg-paper-bg border-t border-hairline flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*,.pdf,.doc,.docx,.txt,.zip,.csv,.json"
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            title="Attach image or document"
            className="p-2.5 rounded-xl bg-paper-bg border border-hairline hover:border-moss-sage text-ink-muted hover:text-moss-deep transition-all disabled:opacity-50"
          >
            {isUploading ? <Loader2 className="w-4 h-4 animate-spin text-moss-deep" /> : <Paperclip className="w-4 h-4" />}
          </button>

          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Answer worker questions or attach reference files..."
            className="flex-1 glass-input text-xs text-ink-text placeholder:text-ink-muted/70 bg-paper-bg border border-moss-sage"
          />

          <button
            type="submit"
            disabled={(!newMessage.trim() && !attachment) || isUploading}
            className="px-5 py-2.5 rounded-xl bg-moss-deep hover:bg-moss-primary disabled:opacity-50 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md"
          >
            Send <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default TaskChat;
