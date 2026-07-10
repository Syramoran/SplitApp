// Tipos espejo de la API (backend NestJS)

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  useCase: string | null;
  currency: string;
  theme: string;
  remindersEnabled: boolean;
  avatarColor: string;
}

export interface AuthResponse {
  accessToken: string;
  user: { id: string; name: string; email: string };
}

export interface Category {
  id: number;
  name: string;
  icon: string;
  color: string;
  isFixed: boolean;
}

export type GroupType = 'convivencia' | 'pareja' | 'viaje' | 'evento';
export type SplitType = 'equal' | 'shares' | 'percent' | 'exact';

export interface GroupMember {
  id: string;
  groupId: string;
  userId: string | null;
  displayName: string;
  avatarColor: string;
  splitPercent: number | null;
}

export interface Group {
  id: string;
  name: string;
  type: GroupType;
  currency: string;
  defaultSplitType: SplitType;
  color: string;
  members: GroupMember[];
  myBalance?: number;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  currency: string;
  category: Category | null;
  groupId: string | null;
  group: { id: string; name: string } | null;
  paidBy: string | null;
  paidByMember: GroupMember | null;
  createdBy: string;
  splitType: SplitType | null;
  isRecurring: boolean;
  date: string;
  splits?: Array<{ memberId: string; amount: number }>;
}

export interface BalanceItem {
  kind: 'expense' | 'settlement';
  description: string;
  date: string;
  amount: number;
  categoryIcon: string | null;
  categoryColor: string | null;
}

export interface PairBalance {
  fromMemberId: string;
  toMemberId: string;
  amount: number;
  items: BalanceItem[];
}

export interface MemberBalance {
  memberId: string;
  displayName: string;
  avatarColor: string;
  userId: string | null;
  net: number;
}

export interface Transfer {
  fromMemberId: string;
  toMemberId: string;
  amount: number;
}

export interface GroupBalance {
  groupId: string;
  members: MemberBalance[];
  pairs: PairBalance[];
  transfers: Transfer[];
  settled: boolean;
}

export interface SummaryItem {
  description: string;
  groupName: string;
  counterpartyName: string;
  amount: number;
  date: string;
  categoryIcon: string | null;
  categoryColor: string | null;
}

export interface HomeSummary {
  month: string;
  monthTotal: number;
  owedToMe: { total: number; items: SummaryItem[] };
  iOwe: { total: number; items: SummaryItem[] };
}

export interface Goal {
  id: string;
  ownerId: string;
  groupId: string | null;
  group: { id: string; name: string } | null;
  name: string;
  icon: string;
  targetAmount: number;
  targetDate: string | null;
  saved: number;
  percent: number;
}

export interface GoalContribution {
  id: string;
  amount: number;
  label: string | null;
  note: string | null;
  date: string;
}

export interface GoalDetail extends Goal {
  contributions: GoalContribution[];
}

export interface CategoryTotal {
  name: string;
  icon: string;
  color: string;
  total: number;
}

export interface GoalInsight extends Goal {
  projectedDate: string | null;
}

export interface MonthlyInsights {
  month: string;
  monthTotal: number;
  prevMonthTotal: number;
  vsPrevMonthPct: number | null;
  categories: CategoryTotal[];
  fixedTotal: number;
  variableTotal: number;
  savings: { contributed: number; rate: number };
  goals: GoalInsight[];
}

export interface RecurringExpense {
  id: string;
  description: string;
  amount: number;
  dayOfMonth: number;
  active: boolean;
  group: { id: string; name: string } | null;
}

export type SettlementMethod = 'transfer' | 'cash' | 'other';
