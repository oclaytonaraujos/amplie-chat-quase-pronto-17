
import { useState, useCallback } from 'react';

interface ContactData {
  nome: string;
  telefone: string;
  email?: string;
  ultimoAtendente: string;
  setorUltimoAtendimento: string;
  dataUltimaInteracao: string;
  tags: string[];
  status: 'ativo' | 'inativo' | 'bloqueado';
  totalAtendimentos: number;
  atendentesAssociados: {
    setor: string;
    atendente: string;
  }[];
}

export function useContactCheck() {
  const [pendingContact, setPendingContact] = useState<ContactData | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showNovoContatoDialog, setShowNovoContatoDialog] = useState(false);

  const checkIfContactExists = useCallback((telefone: string, existingContacts: any[]) => {
    return existingContacts.some(contact => contact.telefone === telefone);
  }, []);

  const createContactData = useCallback((selectedAtendimento: any, agenteAtual: string, setorAtual: string): ContactData => {
    return {
      nome: selectedAtendimento.cliente,
      telefone: selectedAtendimento.telefone,
      email: '', // Será preenchido manualmente ou deixado vazio
      ultimoAtendente: agenteAtual,
      setorUltimoAtendimento: setorAtual,
      dataUltimaInteracao: new Date().toISOString(),
      tags: [...(selectedAtendimento.tags || []), 'Novo Contato'],
      status: 'ativo',
      totalAtendimentos: 1,
      atendentesAssociados: [{
        setor: setorAtual,
        atendente: agenteAtual
      }]
    };
  }, []);

  const handleFinalizarWithContactCheck = useCallback((
    selectedAtendimento: any,
    existingContacts: any[],
    agenteAtual: string,
    setorAtual: string,
    onFinalizar: () => void
  ) => {
    // Finaliza o atendimento primeiro
    onFinalizar();

    // Verifica se é um contato novo
    const isNewContact = !checkIfContactExists(selectedAtendimento.telefone, existingContacts);
    
    if (isNewContact) {
      const contactData = createContactData(selectedAtendimento, agenteAtual, setorAtual);
      setPendingContact(contactData);
      setShowConfirmDialog(true);
    }
  }, [checkIfContactExists, createContactData]);

  const handleConfirmSave = useCallback(() => {
    setShowConfirmDialog(false);
    setShowNovoContatoDialog(true);
  }, []);

  const handleCancelSave = useCallback(() => {
    setShowConfirmDialog(false);
    setPendingContact(null);
  }, []);

  const handleContactSaved = useCallback(() => {
    setShowNovoContatoDialog(false);
    setPendingContact(null);
  }, []);

  return {
    pendingContact,
    showConfirmDialog,
    showNovoContatoDialog,
    setShowConfirmDialog,
    setShowNovoContatoDialog,
    handleFinalizarWithContactCheck,
    handleConfirmSave,
    handleCancelSave,
    handleContactSaved
  };
}
