import { render } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SetorCard } from '../SetorCard';
import { type SetorData } from '@/services/setoresService';

const mockSetor: SetorData = {
  id: '1',
  nome: 'Vendas',
  descricao: 'Setor de vendas da empresa',
  cor: '#3B82F6',
  ativo: true,
  empresa_id: 'test-empresa',
  capacidade_maxima: 10,
  agentes_ativos: 5,
  atendimentos_ativos: 3,
  created_at: '2023-01-01T00:00:00.000Z'
};

describe('SetorCard', () => {
  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders setor information correctly', () => {
    const { getByText } = render(
      <SetorCard 
        setor={mockSetor} 
        onEdit={mockOnEdit} 
        onDelete={mockOnDelete} 
      />
    );

    expect(getByText('Vendas')).toBeInTheDocument();
    expect(getByText('Setor de vendas da empresa')).toBeInTheDocument();
    expect(getByText('5/10 agentes')).toBeInTheDocument();
    expect(getByText('Ativo')).toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked', async () => {
    const user = userEvent.setup();
    
    const { getByRole } = render(
      <SetorCard 
        setor={mockSetor} 
        onEdit={mockOnEdit} 
        onDelete={mockOnDelete} 
      />
    );

    const editButton = getByRole('button', { name: /edit/i });
    await user.click(editButton);

    expect(mockOnEdit).toHaveBeenCalledWith(mockSetor);
  });

  it('calls onDelete when delete button is clicked', async () => {
    const user = userEvent.setup();
    
    const { getByRole } = render(
      <SetorCard 
        setor={mockSetor} 
        onEdit={mockOnEdit} 
        onDelete={mockOnDelete} 
      />
    );

    const deleteButton = getByRole('button', { name: /trash/i });
    await user.click(deleteButton);

    expect(mockOnDelete).toHaveBeenCalledWith(mockSetor);
  });

  it('shows inactive badge for inactive setores', () => {
    const inactiveSetor = { ...mockSetor, ativo: false };
    
    const { getByText } = render(
      <SetorCard 
        setor={inactiveSetor} 
        onEdit={mockOnEdit} 
        onDelete={mockOnDelete} 
      />
    );

    expect(getByText('Inativo')).toBeInTheDocument();
  });
});