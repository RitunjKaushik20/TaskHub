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
        const res = await tasksApi.getTasks();
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
          <h1 className="text-2xl font-extrabold text-white">Business Worker Thread Chat</h1>
          <p className="text-xs text-slate-400">Direct real-time support thread with assigned workers & file sharing.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isLiveConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
          <span className="text-xs text-slate-400">{isLiveConnected ? 'Socket.IO Live' : 'Connecting'}</span>
        </div>
      </div>

      <div className="rounded-3xl glass-panel border border-slate-800 flex flex-col h-[580px] overflow-hidden">
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white truncate max-w-md">
              {activeTask?.title || `Task Thread: ${activeTaskId}`}
            </h3>
            <p className="text-[10px] text-slate-400">Live Worker Chat Channel with Media Attachments</p>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-brand-500/10 text-brand-400 border border-brand-500/20">
            Room: task:{activeTaskId}
          </span>
        </div>

        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500 text-xs">
              <p>No messages in this chat thread yet.</p>
              <p className="text-[11px] text-slate-600 mt-1">Send instructions or attach reference files to coordinate with workers.</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isSelf = msg.senderRole === (user?.role || 'BUSINESS');
              const hasImage = isImageFile(msg.fileName || msg.fileUrl);
              return (
                <div key={msg.id} className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'} space-y-1`}>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                    <span className="font-semibold text-slate-300">{msg.senderName}</span>
                    <span>•</span>
                    <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>

                  <div
                    className={`p-3.5 rounded-2xl max-w-md text-xs leading-relaxed ${
                      isSelf
                        ? 'bg-brand-600 text-white rounded-tr-none'
                        : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none'
                    }`}
                  >
                    {msg.message && <p>{msg.message}</p>}

                    {/* Image Attachment Preview */}
                    {msg.fileUrl && hasImage && (
                      <div className="mt-2">
                        <a
                          href={msg.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block group/img overflow-hidden rounded-xl border border-white/10"
                        >
                          <img
                            src={msg.fileUrl}
                            alt={msg.fileName || 'Attachment'}
                            className="max-h-56 w-full object-cover rounded-xl group-hover/img:scale-105 transition-transform"
                          />
                        </a>
                        <span className="text-[10px] text-slate-300/80 mt-1 block truncate">
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
                        className="mt-2 p-2.5 rounded-xl bg-slate-950/70 border border-white/10 hover:border-white/30 flex items-center gap-2.5 transition-all text-xs group/file"
                      >
                        <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <p className="font-semibold text-white truncate">{msg.fileName || 'Attached File'}</p>
                          <p className="text-[10px] text-slate-300/70">Click to view / download</p>
                        </div>
                        <Download className="w-4 h-4 text-slate-300 group-hover/file:text-white shrink-0" />
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
          <div className="px-4 py-2 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-brand-300">
              {isImageFile(attachment.fileName) ? (
                <ImageIcon className="w-4 h-4 text-brand-accent" />
              ) : (
                <FileText className="w-4 h-4 text-brand-accent" />
              )}
              <span className="font-semibold truncate max-w-xs">{attachment.fileName}</span>
              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                Ready
              </span>
            </div>
            <button
              type="button"
              onClick={() => setAttachment(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-rose-400 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Send Form */}
        <form onSubmit={handleSend} className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
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
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-brand-300 transition-all disabled:opacity-50"
          >
            {isUploading ? <Loader2 className="w-4 h-4 animate-spin text-brand-400" /> : <Paperclip className="w-4 h-4" />}
          </button>

          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Answer worker questions or attach reference files..."
            className="flex-1 glass-input text-xs"
          />

          <button
            type="submit"
            disabled={(!newMessage.trim() && !attachment) || isUploading}
            className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white text-xs font-bold transition-all flex items-center gap-1.5"
          >
            Send <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default TaskChat;
