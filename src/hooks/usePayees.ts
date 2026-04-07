import { useState, useEffect, useCallback } from 'react';
import { Payee, Payment, BankAccount } from '@/types/payment';
import { supabase } from '@/integrations/supabase/client';

export function usePayees(payments: Payment[], updatePaymentPayeeId?: (paymentId: string, payeeId: string) => void) {
  const [payees, setPayees] = useState<Payee[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: payeesData } = await supabase.from('payees').select('*').order('created_at');
      const { data: bankData } = await supabase.from('bank_accounts').select('*');
      
      if (payeesData) {
        const accounts = bankData || [];
        setPayees(payeesData.map(r => ({
          id: r.id, name: r.name, type: r.type as Payee['type'],
          bankAccounts: accounts.filter(b => b.payee_id === r.id).map(b => ({
            id: b.id, bank: b.bank, accountHolder: b.account_holder,
            accountNumber: b.account_number, interbankCode: b.interbank_code,
          })),
          createdAt: r.created_at,
        })));
      }
      setIsLoaded(true);
    };
    load();
  }, []);

  const addPayee = useCallback(async (name: string): Promise<Payee> => {
    const { data, error } = await supabase.from('payees').insert({ name: name.trim(), type: 'otro' }).select().single();
    if (error || !data) throw error;
    const newPayee: Payee = { id: data.id, name: data.name, type: data.type as Payee['type'], bankAccounts: [], createdAt: data.created_at };
    setPayees(prev => [...prev, newPayee]);
    return newPayee;
  }, []);

  const deletePayee = useCallback(async (id: string) => {
    await supabase.from('payees').delete().eq('id', id);
    setPayees(prev => prev.filter(p => p.id !== id));
  }, []);

  const updatePayee = useCallback(async (id: string, data: Partial<Pick<Payee, 'name' | 'type' | 'bankAccounts'>>) => {
    // Update payee fields
    const { name, type, bankAccounts } = data;
    if (name || type) {
      await supabase.from('payees').update({ ...(name && { name }), ...(type && { type }) }).eq('id', id);
    }
    // Sync bank accounts if provided
    if (bankAccounts) {
      // Delete existing and re-insert
      await supabase.from('bank_accounts').delete().eq('payee_id', id);
      if (bankAccounts.length > 0) {
        await supabase.from('bank_accounts').insert(
          bankAccounts.map(b => ({
            id: b.id, payee_id: id, bank: b.bank, account_holder: b.accountHolder,
            account_number: b.accountNumber, interbank_code: b.interbankCode,
          }))
        );
      }
    }
    setPayees(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
  }, []);

  const getPayeeById = useCallback((id: string): Payee | undefined => {
    return payees.find(p => p.id === id);
  }, [payees]);

  const getPayeeByName = useCallback((name: string): Payee | undefined => {
    return payees.find(p => p.name.toLowerCase() === name.toLowerCase().trim());
  }, [payees]);

  return { payees, isLoaded, addPayee, deletePayee, updatePayee, getPayeeById, getPayeeByName };
}
