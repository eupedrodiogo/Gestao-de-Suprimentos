
import { User, UserRole, WarehouseType } from '../types';

const MOCK_USERS: User[] = [
  {
    id: 'u1',
    name: 'Dr. Roberto Diretoria',
    email: 'diretoria@nexus.com',
    role: 'DIRETORIA',
    department: 'Diretoria Executiva',
    allowedWarehouses: 'ALL',
    phone: '5511999990001',
    avatar: 'https://i.pravatar.cc/150?u=dir'
  },
  {
    id: 'u2',
    name: 'Amanda Ger. Suprimentos',
    email: 'gerencia@nexus.com',
    role: 'GERENCIA_SUPRIMENTOS',
    department: 'Gestão de Cadeia de Suprimentos',
    allowedWarehouses: 'ALL',
    phone: '5511999990002',
    avatar: 'https://i.pravatar.cc/150?u=ger'
  },
  {
    id: 'u3',
    name: 'Carlos Compras',
    email: 'compras@nexus.com',
    role: 'COMPRAS',
    department: 'Departamento de Compras',
    allowedWarehouses: 'ALL',
    phone: '5511999990003',
    avatar: 'https://i.pravatar.cc/150?u=compras'
  },
  {
    id: 'u4',
    name: 'Helena Coord. Almoxarifado',
    email: 'almoxarifado@nexus.com',
    role: 'COORD_ALMOXARIFADO',
    department: 'Logística e Estoque',
    allowedWarehouses: ['ALMOXARIFADO CENTRAL', 'FARMÁCIA', 'NUTRIÇÃO & DIETÉTICA'],
    phone: '5511999990004',
    avatar: 'https://i.pravatar.cc/150?u=almox'
  },
  {
    id: 'u5',
    name: 'Ricardo Coord. Financeiro',
    email: 'financeiro@nexus.com',
    role: 'COORD_FINANCEIRO',
    department: 'Contas a Pagar',
    allowedWarehouses: 'ALL',
    phone: '5511999990005',
    avatar: 'https://i.pravatar.cc/150?u=fin'
  },
  {
    id: 'u6',
    name: 'Ana Solicitante (UTI)',
    email: 'solicitante@nexus.com',
    role: 'SOLICITANTE',
    department: 'UTI Adulto',
    allowedWarehouses: ['ALMOXARIFADO CENTRAL'],
    phone: '5511999990006',
    avatar: 'https://i.pravatar.cc/150?u=sol'
  }
];

export const login = async (email: string, password: string): Promise<User> => {
  // Simulação de delay de rede
  await new Promise(resolve => setTimeout(resolve, 800));

  const user = MOCK_USERS.find(u => u.email === email);
  
  if (!user) {
    throw new Error('Usuário não encontrado.');
  }

  // Senha mockada universal para demo: "123456"
  if (password !== '123456') {
    throw new Error('Senha incorreta.');
  }

  localStorage.setItem('nexus_user', JSON.stringify(user));
  return user;
};

export const logout = () => {
  localStorage.removeItem('nexus_user');
};

export const getCurrentUser = (): User | null => {
  const stored = localStorage.getItem('nexus_user');
  if (stored) return JSON.parse(stored);
  return null;
};

// Função auxiliar para verificar permissão baseada apenas em setor (legado, mantido para compatibilidade)
export const checkPermission = (user: User, warehouse: WarehouseType): boolean => {
  if (user.role === 'DIRETORIA' || user.role === 'GERENCIA_SUPRIMENTOS') return true;
  if (user.allowedWarehouses === 'ALL') return true;
  return user.allowedWarehouses.includes(warehouse);
};
