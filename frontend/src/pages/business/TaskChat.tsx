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
          <h1 className="text-2xl font-extrabold text-slate-900">Business Worker Thread Chat</h1>
          <p className="text-xs text-slate-600">Direct real-time support thread with assigned workers & file sharing.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isLiveConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
          <span className="text-xs text-slate-500">{isLiveConnected ? 'Socket.IO Live' : 'Connecting'}</span>
        </div>
      </div>

      <div className="rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col h-[580px] overflow-hidden">
        <div className="p-4 bg-white border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 truncate max-w-md">
              {activeTask?.title || `Task Thread: ${activeTaskId}`}
            </h3>
            <p className="text-[10px] text-slate-600">Live Worker Chat Channel with Media Attachments</p>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-200">
            Room: task:{activeTaskId}
          </span>
        </div>

        <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500 text-xs">
              <p>No messages in this chat thread yet.</p>
              <p className="text-[11px] text-slate-400 mt-1">Send instructions or attach reference files to coordinate with workers.</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isSelf = msg.senderRole === (user?.role || 'BUSINESS');
              const hasImage = isImageFile(msg.fileName || msg.fileUrl);
              return (
                <div key={msg.id} className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'} space-y-1`}>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                    <span className="text-slate-700 font-semibold">{msg.senderName}</span>
                    <span>•</span>
                    <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>

                  <div
                    className={`p-3.5 rounded-2xl max-w-md text-xs leading-relaxed shadow-sm ${
                      isSelf
                        ? 'bg-brand-600 text-white font-medium rounded-tr-none'
                        : 'bg-slate-100 border border-slate-200 text-slate-900 font-medium rounded-tl-none'
                    }`}
                  >
                    {msg.message && <p className={isSelf ? 'text-white' : 'text-slate-900'}>{msg.message}</p>}

                    {/* Image Attachment Preview */}
                    {msg.fileUrl && hasImage && (
                      <div className="mt-2">
                        <a
                          href={msg.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block group/img overflow-hidden rounded-xl border border-slate-200/50"
                        >
                          <img
                            src={msg.fileUrl}
                            alt={msg.fileName || 'Attachment'}
                            className="max-h-56 w-full object-cover rounded-xl group-hover/img:scale-105 transition-transform"
                          />
                        </a>
                        <span className={`text-[10px] mt-1 block truncate ${isSelf ? 'text-white/80' : 'text-slate-600'}`}>
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
                        className={`mt-2 p-2.5 rounded-xl border flex items-center gap-2.5 transition-all text-xs group/file ${
                          isSelf
                            ? 'bg-white/15 border-white/25 hover:bg-white/20 text-white'
                            : 'bg-white border-slate-200 hover:border-slate-300 text-slate-900 shadow-sm'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          isSelf ? 'bg-white/20 text-white' : 'bg-slate-100 border border-slate-200 text-slate-700'
                        }`}>
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <p className={`font-semibold truncate ${isSelf ? 'text-white' : 'text-slate-900'}`}>{msg.fileName || 'Attached File'}</p>
                          <p className={`text-[10px] ${isSelf ? 'text-white/75' : 'text-slate-500'}`}>Click to view / download</p>
                        </div>
                        <Download className={`w-4 h-4 shrink-0 ${isSelf ? 'text-white' : 'text-slate-500 group-hover/file:text-slate-700'}`} />
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
          <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-brand-700">
              {isImageFile(attachment.fileName) ? (
                <ImageIcon className="w-4 h-4 text-brand-600" />
              ) : (
                <FileText className="w-4 h-4 text-brand-600" />
              )}
              <span className="font-semibold truncate max-w-xs text-slate-900">{attachment.fileName}</span>
              <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                Ready
              </span>
            </div>
            <button
              type="button"
              onClick={() => setAttachment(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-rose-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Send Form */}
        <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
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
            className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-brand-600 transition-all disabled:opacity-50"
          >
            {isUploading ? <Loader2 className="w-4 h-4 animate-spin text-brand-600" /> : <Paperclip className="w-4 h-4" />}
          </button>

          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Answer worker questions or attach reference files..."
            className="flex-1 glass-input text-xs text-slate-900 placeholder:text-slate-400 bg-white border border-slate-300"
          />

          <button
            type="submit"
            disabled={(!newMessage.trim() && !attachment) || isUploading}
            className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md"
          >
            Send <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default TaskChat;
