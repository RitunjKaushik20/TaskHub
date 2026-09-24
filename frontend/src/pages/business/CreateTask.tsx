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
import { Field, InputControl, SelectControl, TextareaControl } from '../../components/ui/Field';
import Button from '../../components/ui/Button';

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
        <h1 className="text-2xl font-extrabold text-ink-text">Post New Task Batch</h1>
        <p className="text-xs text-ink-muted">
          Define worker task specs, direct reward per worker, seat limits, and required proof formats.
        </p>
      </div>

      <div className="p-8 rounded-3xl bg-paper-bg border border-hairline shadow-sm space-y-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Field label="Task Title" required error={errors.title?.message}>
            <InputControl
              {...register('title')}
              placeholder="e.g. UX Feedback & Usability Review for Mobile App"
              className="bg-paper-bg border border-moss-sage"
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Category" required error={errors.category?.message}>
              <SelectControl {...register('category')} className="bg-paper-bg border border-moss-sage">
                <option value="AI & Data Annotation">AI & Data Annotation</option>
                <option value="UX Research">UX Research</option>
                <option value="Translation & Localization">Translation & Localization</option>
                <option value="Software Engineering">Software Engineering</option>
                <option value="Lead Generation">Lead Generation</option>
              </SelectControl>
            </Field>

            <Field label="Difficulty Level">
              <SelectControl {...register('difficulty')} className="bg-paper-bg border border-moss-sage">
                <option value="BEGINNER">Beginner</option>
                <option value="INTERMEDIATE">Intermediate</option>
                <option value="ADVANCED">Advanced</option>
                <option value="EXPERT">Expert</option>
              </SelectControl>
            </Field>
          </div>

          {/* Currency selection & reward fields */}
          <div className="bg-paper-bg border border-hairline rounded-2xl p-5 space-y-4">
            <div>
              <label className="block text-ink-text font-bold text-xs mb-1.5">Reward Currency</label>
              <div className="grid grid-cols-2 gap-3 max-w-xs">
                <button
                  type="button"
                  onClick={() => setValue('currency', 'USD')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border ${
                    watchCurrency === 'USD'
                      ? 'bg-moss-deep border-moss-primary text-white shadow-md'
                      : 'bg-paper-bg border border-moss-sage text-ink-text font-semibold hover:bg-paper-bg'
                  }`}
                >
                  <DollarSign className="w-3.5 h-3.5" /> US Dollars ($)
                </button>
                <button
                  type="button"
                  onClick={() => setValue('currency', 'INR')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border ${
                    watchCurrency === 'INR'
                      ? 'bg-moss-primary border-moss-primary text-white shadow-md'
                      : 'bg-paper-bg border border-moss-sage text-ink-text font-semibold hover:bg-paper-bg'
                  }`}
                >
                  <span className="font-extrabold text-xs">₹</span> Indian Rupees (₹)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-ink-text font-bold text-xs mb-1.5">
                  Reward per Worker ({watchCurrency === 'INR' ? '₹' : '$'})
                </label>
                <div className="relative">
                  {watchCurrency === 'INR' ? (
                    <span className="text-xs font-bold text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10">₹</span>
                  ) : (
                    <DollarSign className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none z-10" />
                  )}
                  <InputControl
                    type="number"
                    step={watchCurrency === 'INR' ? '1' : '0.50'}
                    {...register('reward', { valueAsNumber: true })}
                    placeholder={watchCurrency === 'INR' ? '500' : '25.00'}
                    className="!pl-11 !pr-4 bg-paper-bg border-moss-sage font-bold"
                    style={{ paddingLeft: '2.75rem' }}
                  />
                </div>
                {errors.reward && <p className="text-[10px] text-moss-deep mt-1">{errors.reward.message}</p>}
              </div>

              <div>
                <label className="block text-ink-text font-bold text-xs mb-1.5">Worker Seat Limit</label>
                <div className="relative">
                  <Users className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none z-10" />
                  <InputControl
                    type="number"
                    {...register('workerLimit', { valueAsNumber: true })}
                    placeholder="10"
                    className="!pl-11 !pr-4 bg-paper-bg border-moss-sage"
                    style={{ paddingLeft: '2.75rem' }}
                  />
                </div>
                {errors.workerLimit && <p className="text-[10px] text-moss-deep mt-1">{errors.workerLimit.message}</p>}
              </div>

              <Field label="Deadline Date" required error={errors.deadline?.message}>
                <InputControl
                  type="date"
                  {...register('deadline')}
                  className="bg-paper-bg border border-moss-sage"
                />
              </Field>
            </div>
          </div>

          <Field label="Overview Description" required error={errors.description?.message}>
            <TextareaControl
              rows={2}
              {...register('description')}
              placeholder="High level overview of what workers will execute..."
              className="bg-paper-bg border border-moss-sage"
            />
          </Field>

          <Field label="Detailed Step-by-Step Instructions" required error={errors.instructions?.message}>
            <TextareaControl
              rows={4}
              {...register('instructions')}
              placeholder={'1. Access portal link...\n2. Complete test case...\n3. Export deliverable...'}
              className="bg-paper-bg border border-moss-sage"
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Required Skills (Comma-separated)" required error={errors.requiredSkills?.message}>
              <InputControl
                {...register('requiredSkills')}
                placeholder="Python, Loom, React"
                className="bg-paper-bg border border-moss-sage"
              />
            </Field>

            <Field label="Proof Requirements Format" required error={errors.proofRequirements?.message}>
              <InputControl
                {...register('proofRequirements')}
                placeholder="Loom URL link or Markdown text summary"
                className="bg-paper-bg border border-moss-sage"
              />
            </Field>
          </div>

          <div className="p-4 rounded-xl bg-paper-bg border border-hairline flex items-center justify-between text-xs">
            <span className="text-ink-text font-semibold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-moss-deep" /> Total Allocated Reward:
            </span>
            <span className="text-base font-extrabold text-moss-deep">{formatCurrency(totalAllocatedReward, watchCurrency)}</span>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            size="lg"
            className="w-full"
          >
            {isSubmitting ? 'Posting Task Batch...' : 'Create & Publish Task Batch'} <PlusCircle className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default CreateTask;
