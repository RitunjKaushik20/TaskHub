import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, DollarSign, Users, ShieldCheck } from 'lucide-react';
import { useWatch } from 'react-hook-form';
import { tasksApi } from '../../api/tasks';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../lib/utils';

const createTaskSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(15, 'Description must be at least 15 characters'),
  instructions: z.string().min(20, 'Instructions must be detailed (min 20 chars)'),
  category: z.string().min(1, 'Please select a category'),
  difficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']),
  currency: z.enum(['USD', 'INR']),
  reward: z.number().min(0.5, 'Minimum reward per worker is 0.50'),
  workerLimit: z.number().min(1, 'Worker limit must be at least 1'),
  deadline: z.string().min(1, 'Please select a deadline date'),
  requiredSkills: z.string().min(2, 'Enter at least one skill comma-separated'),
  proofRequirements: z.string().min(10, 'Specify proof requirements clearly'),
});

type CreateTaskFormValues = z.infer<typeof createTaskSchema>;

const CreateTask: React.FC = () => {
  const toast = useToast();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateTaskFormValues>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      title: 'Annotate 300 Video Frames for RLHF Autonomous Steering',
      description: 'Draw bounding boxes around traffic lights and lane switches.',
      instructions: '1. Open portal link\n2. Label frames\n3. Export JSON',
      category: 'AI & Data Annotation',
      difficulty: 'INTERMEDIATE',
      currency: 'USD',
      reward: 35.0,
      workerLimit: 5,
      deadline: '2026-10-01',
      requiredSkills: 'Bounding Box, Computer Vision, JSON',
      proofRequirements: 'Exported JSON file or raw public URL gist link',
    },
  });

  const watchCurrency = useWatch({ control, name: 'currency' }) || 'USD';
  const watchReward = useWatch({ control, name: 'reward' }) || 0;
  const watchWorkerLimit = useWatch({ control, name: 'workerLimit' }) || 0;
  const totalAllocatedReward = Math.max(0, watchReward * watchWorkerLimit);

  const onSubmit = async (data: CreateTaskFormValues) => {
    const skillsArray = data.requiredSkills.split(',').map((s) => s.trim());
    const response = await tasksApi.createTask({
      ...data,
      currency: data.currency,
      requiredSkills: skillsArray,
    });

    if (response.success && response.data) {
      toast.success('Task Batch Posted!', `Your task "${data.title}" is now active and discoverable by workers.`);
      navigate('/business/tasks');
    } else {
      toast.error('Failed to create task', response.message || 'Please check your inputs.');
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-extrabold text-white">Post New Task Batch</h1>
        <p className="text-xs text-slate-400">
          Define worker task specs, direct reward per worker, seat limits, and required proof formats.
        </p>
      </div>

      <div className="p-8 rounded-3xl glass-panel border border-slate-800 space-y-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Task Title</label>
            <input
              type="text"
              {...register('title')}
              placeholder="e.g. UX Feedback & Usability Review for Mobile App"
              className="w-full glass-input text-xs"
            />
            {errors.title && <p className="text-[10px] text-rose-400 mt-1">{errors.title.message}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
              <select {...register('category')} className="w-full glass-input text-xs">
                <option value="AI & Data Annotation">AI & Data Annotation</option>
                <option value="UX Research">UX Research</option>
                <option value="Translation & Localization">Translation & Localization</option>
                <option value="Software Engineering">Software Engineering</option>
                <option value="Lead Generation">Lead Generation</option>
              </select>
              {errors.category && <p className="text-[10px] text-rose-400 mt-1">{errors.category.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Difficulty Level</label>
              <select {...register('difficulty')} className="w-full glass-input text-xs">
                <option value="BEGINNER">Beginner</option>
                <option value="INTERMEDIATE">Intermediate</option>
                <option value="ADVANCED">Advanced</option>
                <option value="EXPERT">Expert</option>
              </select>
            </div>
          </div>

          {/* Currency selection & reward fields */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">Reward Currency</label>
              <div className="grid grid-cols-2 gap-3 max-w-xs">
                <button
                  type="button"
                  onClick={() => setValue('currency', 'USD')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border ${
                    watchCurrency === 'USD'
                      ? 'bg-brand-600 border-brand-500 text-white shadow-md'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <DollarSign className="w-3.5 h-3.5" /> US Dollars ($)
                </button>
                <button
                  type="button"
                  onClick={() => setValue('currency', 'INR')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border ${
                    watchCurrency === 'INR'
                      ? 'bg-emerald-600 border-emerald-500 text-white shadow-md'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="font-extrabold text-xs">₹</span> Indian Rupees (₹)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Reward per Worker ({watchCurrency === 'INR' ? '₹' : '$'})
                </label>
                <div className="relative">
                  {watchCurrency === 'INR' ? (
                    <span className="text-xs font-bold text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10">₹</span>
                  ) : (
                    <DollarSign className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none z-10" />
                  )}
                  <input
                    type="number"
                    step={watchCurrency === 'INR' ? '1' : '0.50'}
                    {...register('reward', { valueAsNumber: true })}
                    placeholder={watchCurrency === 'INR' ? '500' : '25.00'}
                    className="w-full glass-input !pl-11 !pr-4 text-xs text-emerald-400 font-bold"
                  />
                </div>
                {errors.reward && <p className="text-[10px] text-rose-400 mt-1">{errors.reward.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Worker Seat Limit</label>
                <div className="relative">
                  <Users className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none z-10" />
                  <input
                    type="number"
                    {...register('workerLimit', { valueAsNumber: true })}
                    placeholder="10"
                    className="w-full glass-input !pl-11 !pr-4 text-xs"
                  />
                </div>
                {errors.workerLimit && <p className="text-[10px] text-rose-400 mt-1">{errors.workerLimit.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Deadline Date</label>
                <input
                  type="date"
                  {...register('deadline')}
                  className="w-full glass-input text-xs"
                />
                {errors.deadline && <p className="text-[10px] text-rose-400 mt-1">{errors.deadline.message}</p>}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Overview Description</label>
            <textarea
              rows={2}
              {...register('description')}
              placeholder="High level overview of what workers will execute..."
              className="w-full glass-input text-xs"
            />
            {errors.description && <p className="text-[10px] text-rose-400 mt-1">{errors.description.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Detailed Step-by-Step Instructions</label>
            <textarea
              rows={4}
              {...register('instructions')}
              placeholder="1. Access portal link...&#10;2. Complete test case...&#10;3. Export deliverable..."
              className="w-full glass-input text-xs"
            />
            {errors.instructions && <p className="text-[10px] text-rose-400 mt-1">{errors.instructions.message}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Required Skills (Comma-separated)</label>
              <input
                type="text"
                {...register('requiredSkills')}
                placeholder="Python, Loom, React"
                className="w-full glass-input text-xs"
              />
              {errors.requiredSkills && <p className="text-[10px] text-rose-400 mt-1">{errors.requiredSkills.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Proof Requirements Format</label>
              <input
                type="text"
                {...register('proofRequirements')}
                placeholder="Loom URL link or Markdown text summary"
                className="w-full glass-input text-xs"
              />
              {errors.proofRequirements && <p className="text-[10px] text-rose-400 mt-1">{errors.proofRequirements.message}</p>}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-brand-500/30 flex items-center justify-between text-xs">
            <span className="text-slate-300 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Total Allocated Reward:
            </span>
            <span className="text-base font-extrabold text-emerald-400">{formatCurrency(totalAllocatedReward, watchCurrency)}</span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-brand-600 via-indigo-600 to-brand-accent text-white font-bold text-xs shadow-xl transition-all flex items-center justify-center gap-2 hover:opacity-95"
          >
            {isSubmitting ? 'Posting Task Batch...' : 'Create & Publish Task Batch'} <PlusCircle className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateTask;
