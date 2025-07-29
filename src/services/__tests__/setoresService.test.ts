import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SetoresService } from '../setoresService';

// Mock do Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ 
            data: { empresa_id: 'test-empresa-id' }, 
            error: null 
          })),
          order: vi.fn(() => Promise.resolve({ 
            data: [], 
            error: null 
          }))
        }))
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ 
            data: { id: 'test-id', nome: 'Test Setor' }, 
            error: null 
          }))
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ 
              data: { id: 'test-id', nome: 'Updated Setor' }, 
              error: null 
            }))
          }))
        }))
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null }))
      }))
    })),
    auth: {
      getUser: vi.fn(() => Promise.resolve({ 
        data: { user: { id: 'test-user-id' } }, 
        error: null 
      }))
    }
  }
}));

describe('SetoresService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a setor successfully', async () => {
    const setorData = {
      nome: 'Test Setor',
      cor: '#FF0000',
      capacidade_maxima: 10,
      ativo: true
    };

    const result = await SetoresService.createSetor(setorData);
    
    expect(result).toEqual({
      id: 'test-id',
      nome: 'Test Setor'
    });
  });

  it('should update a setor successfully', async () => {
    const updates = {
      nome: 'Updated Setor'
    };

    const result = await SetoresService.updateSetor('test-id', updates);
    
    expect(result).toEqual({
      id: 'test-id',
      nome: 'Updated Setor'
    });
  });

  it('should delete a setor successfully', async () => {
    await expect(SetoresService.deleteSetor('test-id')).resolves.toBeUndefined();
  });
});