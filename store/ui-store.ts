import { create } from 'zustand'
import type { SerializedAccount, SerializedTransaction } from '@/types'

interface UIStore {
  // Account dialogs
  isAddAccountOpen: boolean
  editingAccount: SerializedAccount | null

  // Transaction dialogs
  isAddTransactionOpen: boolean
  editingTransaction: SerializedTransaction | null
  defaultAccountId: string | null

  // Bulk transaction dialog
  isAddBulkTransactionOpen: boolean

  // Actions
  openAddAccount: () => void
  closeAddAccount: () => void
  openEditAccount: (account: SerializedAccount) => void
  closeEditAccount: () => void

  openAddTransaction: (defaultAccountId?: string) => void
  closeAddTransaction: () => void
  openEditTransaction: (transaction: SerializedTransaction) => void
  closeEditTransaction: () => void

  openAddBulkTransaction: () => void
  closeAddBulkTransaction: () => void
}

export const useUIStore = create<UIStore>((set) => ({
  isAddAccountOpen: false,
  editingAccount: null,
  isAddTransactionOpen: false,
  editingTransaction: null,
  defaultAccountId: null,
  isAddBulkTransactionOpen: false,

  openAddAccount: () => set({ isAddAccountOpen: true, editingAccount: null }),
  closeAddAccount: () => set({ isAddAccountOpen: false }),
  openEditAccount: (account) => set({ editingAccount: account, isAddAccountOpen: true }),
  closeEditAccount: () => set({ editingAccount: null, isAddAccountOpen: false }),

  openAddTransaction: (defaultAccountId) =>
    set({ isAddTransactionOpen: true, editingTransaction: null, defaultAccountId: defaultAccountId ?? null }),
  closeAddTransaction: () => set({ isAddTransactionOpen: false, defaultAccountId: null }),
  openEditTransaction: (transaction) =>
    set({ editingTransaction: transaction, isAddTransactionOpen: true }),
  closeEditTransaction: () => set({ editingTransaction: null, isAddTransactionOpen: false }),

  openAddBulkTransaction: () => set({ isAddBulkTransactionOpen: true }),
  closeAddBulkTransaction: () => set({ isAddBulkTransactionOpen: false }),
}))
