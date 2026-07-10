import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import type {
  Category,
  Expense,
  Goal,
  GoalContribution,
  GoalDetail,
  Group,
  GroupBalance,
  HomeSummary,
  MonthlyInsights,
  PublicUser,
  RecurringExpense,
  SettlementMethod,
  SplitType,
} from './types';

// ---------- queries ----------

export const useMe = () =>
  useQuery({ queryKey: ['me'], queryFn: () => api<PublicUser>('/users/me') });

export const useSummary = () =>
  useQuery({ queryKey: ['summary'], queryFn: () => api<HomeSummary>('/insights/summary') });

export const useMonthly = (month?: string) =>
  useQuery({
    queryKey: ['insights', month ?? 'current'],
    queryFn: () => api<MonthlyInsights>(`/insights/monthly${month ? `?month=${month}` : ''}`),
  });

export const useGroups = () =>
  useQuery({ queryKey: ['groups'], queryFn: () => api<Group[]>('/groups') });

export const useGroup = (id: string | undefined) =>
  useQuery({
    queryKey: ['groups', id],
    queryFn: () => api<Group>(`/groups/${id}`),
    enabled: Boolean(id),
  });

export const useGroupBalance = (id: string | undefined) =>
  useQuery({
    queryKey: ['balance', id],
    queryFn: () => api<GroupBalance>(`/groups/${id}/balance`),
    enabled: Boolean(id),
  });

export const useExpenses = (filters: { groupId?: string; limit?: number } = {}) => {
  const params = new URLSearchParams();
  if (filters.groupId) params.set('groupId', filters.groupId);
  if (filters.limit) params.set('limit', String(filters.limit));
  const qs = params.toString();
  return useQuery({
    queryKey: ['expenses', filters.groupId ?? 'all', filters.limit ?? 20],
    queryFn: () => api<Expense[]>(`/expenses${qs ? `?${qs}` : ''}`),
  });
};

export const useCategories = () =>
  useQuery({
    queryKey: ['categories'],
    queryFn: () => api<Category[]>('/categories'),
    staleTime: Infinity,
  });

export const useGoals = () =>
  useQuery({ queryKey: ['goals'], queryFn: () => api<Goal[]>('/goals') });

export const useGoal = (id: string | undefined) =>
  useQuery({
    queryKey: ['goals', id],
    queryFn: () => api<GoalDetail>(`/goals/${id}`),
    enabled: Boolean(id),
  });

export const useRecurring = () =>
  useQuery({
    queryKey: ['recurring'],
    queryFn: () => api<RecurringExpense[]>('/expenses/recurring'),
  });

export const suggestCategory = (q: string) =>
  api<{ category: Category | null }>(`/categories/suggest?q=${encodeURIComponent(q)}`);

// ---------- mutations ----------

/** Después de tocar datos, refrescamos todo lo derivado (balances, insights). */
const useInvalidateAll = () => {
  const queryClient = useQueryClient();
  return () =>
    Promise.all(
      ['summary', 'groups', 'balance', 'expenses', 'insights', 'goals', 'recurring'].map((key) =>
        queryClient.invalidateQueries({ queryKey: [key] }),
      ),
    );
};

export interface CreateExpensePayload {
  amount: number;
  description: string;
  categoryId?: number;
  groupId?: string;
  paidByMemberId?: string;
  splitType?: SplitType;
  splits?: Array<{ memberId: string; weight?: number; amount?: number }>;
}

export const useCreateExpense = () => {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: (payload: CreateExpensePayload) =>
      api<Expense>('/expenses', { method: 'POST', body: payload }),
    onSuccess: invalidate,
  });
};

export interface CreateGroupPayload {
  name: string;
  type: string;
  members: string[];
  currency?: string;
  defaultSplitType?: SplitType;
  myPercent?: number;
}

export const useCreateGroup = () => {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: (payload: CreateGroupPayload) =>
      api<Group>('/groups', { method: 'POST', body: payload }),
    onSuccess: invalidate,
  });
};

export const useCreateSettlement = () => {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: (payload: {
      groupId: string;
      fromMemberId: string;
      toMemberId: string;
      amount: number;
      method: SettlementMethod;
    }) => api('/settlements', { method: 'POST', body: payload }),
    onSuccess: invalidate,
  });
};

export const useSendReminder = () =>
  useMutation({
    mutationFn: (payload: { groupId: string; toMemberId: string }) =>
      api('/reminders', { method: 'POST', body: payload }),
  });

export const useContribute = () => {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: ({ goalId, ...body }: { goalId: string; amount: number; label?: string }) =>
      api<GoalContribution>(`/goals/${goalId}/contributions`, { method: 'POST', body }),
    onSuccess: invalidate,
  });
};

export const useUpdateMe = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<Pick<PublicUser, 'name' | 'theme' | 'currency' | 'remindersEnabled'>>) =>
      api<PublicUser>('/users/me', { method: 'PATCH', body: payload }),
    onSuccess: (user) => queryClient.setQueryData(['me'], user),
  });
};
