import React, { useEffect, useState } from 'react';
import {
  Users,
  DollarSign,
  PieChart,
  CheckCircle,
  Menu,
  X,
  Moon,
  Sun,
  Trash2,
  UserPlus,
  Receipt,
  TrendingUp,
  Clock,
} from 'lucide-react';

interface Group {
  id: number;
  name: string;
  members: string[];
  total: number;
}

interface Expense {
  id: number;
  groupId: number;
  description: string;
  amount: number;
  paidBy: string;
  date: string;
}

interface NewGroup {
  name: string;
  members: string;
}

interface NewExpense {
  description: string;
  amount: string;
  paidBy: string;
  groupId: number | null;
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

interface Settlement {
  from: string;
  to: string;
  amount: number;
}

interface Activity {
  id: number;
  type: 'group' | 'expense';
  action: string;
  target: string;
  user: string;
  timestamp: Date;
}

export default function DividAiApp() {
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [showCreateGroup, setShowCreateGroup] = useState<boolean>(false);
  const [showAddExpense, setShowAddExpense] = useState<boolean>(false);
  const [showGroupDetails, setShowGroupDetails] = useState<boolean>(false);
  const [showSettlement, setShowSettlement] = useState<boolean>(false);
  const [showActivity, setShowActivity] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

  const [groups, setGroups] = useState<Group[]>([
    { id: 1, name: 'Viagem Praia 2024', members: ['João', 'Maria', 'Pedro'], total: 1250.5 },
    { id: 2, name: 'República', members: ['João', 'Carlos', 'Ana', 'Lucas'], total: 3420 },
  ]);

  const [expenses, setExpenses] = useState<Expense[]>([
    { id: 1, groupId: 1, description: 'Hotel', amount: 800, paidBy: 'João', date: '2024-03-15' },
    { id: 2, groupId: 1, description: 'Mercado', amount: 450.5, paidBy: 'Maria', date: '2024-03-16' },
    { id: 3, groupId: 2, description: 'Aluguel', amount: 2000, paidBy: 'João', date: '2024-03-01' },
    { id: 4, groupId: 2, description: 'Energia', amount: 420, paidBy: 'Carlos', date: '2024-03-05' },
  ]);

  const [activities, setActivities] = useState<Activity[]>([]);
  const [newGroup, setNewGroup] = useState<NewGroup>({ name: '', members: '' });
  const [newExpense, setNewExpense] = useState<NewExpense>({ description: '', amount: '', paidBy: '', groupId: null });

  useEffect(() => {
    const storedTheme = localStorage.getItem('dividai:darkMode');
    if (storedTheme !== null) {
      setDarkMode(storedTheme === 'true');
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('dividai:darkMode', String(darkMode));
  }, [darkMode]);

  const handleCreateGroup = () => {
    if (!newGroup.name.trim() || !newGroup.members.trim()) {
      return;
    }

    const membersArray = newGroup.members
      .split(',')
      .map((member) => member.trim())
      .filter(Boolean);

    if (membersArray.length === 0) {
      return;
    }

    const nextId = groups.length > 0 ? Math.max(...groups.map((group) => group.id)) + 1 : 1;

    const group: Group = {
      id: nextId,
      name: newGroup.name.trim(),
      members: membersArray,
      total: 0,
    };

    setGroups((prev) => [...prev, group]);

    setActivities((prev) => [
      {
        id: Date.now(),
        type: 'group',
        action: 'criou o grupo',
        target: group.name,
        user: 'Você',
        timestamp: new Date(),
      },
      ...prev,
    ]);

    setNewGroup({ name: '', members: '' });
    setShowCreateGroup(false);
  };

  const handleAddExpense = () => {
    if (!newExpense.groupId || !newExpense.description.trim() || !newExpense.amount.trim() || !newExpense.paidBy.trim()) {
      return;
    }

    const amountValue = parseFloat(newExpense.amount);

    if (Number.isNaN(amountValue) || amountValue <= 0) {
      return;
    }

    const nextId = expenses.length > 0 ? Math.max(...expenses.map((expense) => expense.id)) + 1 : 1;

    const expense: Expense = {
      id: nextId,
      groupId: newExpense.groupId,
      description: newExpense.description.trim(),
      amount: amountValue,
      paidBy: newExpense.paidBy.trim(),
      date: new Date().toISOString().split('T')[0],
    };

    setExpenses((prev) => [...prev, expense]);
    setGroups((prev) =>
      prev.map((group) =>
        group.id === expense.groupId ? { ...group, total: group.total + expense.amount } : group,
      ),
    );

    const groupName = groups.find((group) => group.id === expense.groupId)?.name ?? 'Grupo';

    setActivities((prev) => [
      {
        id: Date.now(),
        type: 'expense',
        action: 'adicionou despesa',
        target: `${expense.description} - R$ ${expense.amount.toFixed(2)} (${groupName})`,
        user: expense.paidBy,
        timestamp: new Date(),
      },
      ...prev,
    ]);

    setNewExpense({ description: '', amount: '', paidBy: '', groupId: null });
    setShowAddExpense(false);
  };

  const handleDeleteGroup = (id: number) => {
    setGroups((prev) => prev.filter((group) => group.id !== id));
    setExpenses((prev) => prev.filter((expense) => expense.groupId !== id));
  };

  const calculateSettlement = (group: Group): Record<string, number> => {
    const groupExpenses = expenses.filter((expense) => expense.groupId === group.id);
    const balances: Record<string, number> = {};

    group.members.forEach((member) => {
      balances[member] = 0;
    });

    groupExpenses.forEach((expense) => {
      balances[expense.paidBy] = (balances[expense.paidBy] || 0) + expense.amount;
    });

    const sharePerPerson = group.members.length > 0 ? group.total / group.members.length : 0;

    Object.keys(balances).forEach((member) => {
      balances[member] = balances[member] - sharePerPerson;
    });

    return balances;
  };

  const getSettlementInstructions = (balances: Record<string, number>): Settlement[] => {
    const creditors = Object.entries(balances)
      .filter(([, amount]) => amount > 0)
      .map(([member, amount]) => ({ member, amount }));

    const debtors = Object.entries(balances)
      .filter(([, amount]) => amount < 0)
      .map(([member, amount]) => ({ member, amount: Math.abs(amount) }));

    const instructions: Settlement[] = [];

    debtors.forEach(({ member: debtor, amount }) => {
      let remainingDebt = amount;

      creditors.forEach((creditor) => {
        if (remainingDebt <= 0.01 || creditor.amount <= 0.01) {
          return;
        }

        const payment = Math.min(remainingDebt, creditor.amount);
        instructions.push({ from: debtor, to: creditor.member, amount: payment });
        remainingDebt -= payment;
        creditor.amount -= payment;
      });
    });

    return instructions;
  };

  const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div
          className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl`}
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{title}</h3>
            <button
              onClick={onClose}
              className={`${darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <X size={24} />
            </button>
          </div>
          {children}
        </div>
      </div>
    );
  };

  const renderActivityTime = (timestamp: Date) => {
    const diff = Date.now() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `há ${days} dia${days > 1 ? 's' : ''}`;
    if (hours > 0) return `há ${hours} hora${hours > 1 ? 's' : ''}`;
    if (minutes > 0) return `há ${minutes} minuto${minutes > 1 ? 's' : ''}`;
    return 'agora mesmo';
  };

  if (!isLoggedIn) {
    return (
      <div
        className={`min-h-screen transition-colors duration-300 ${
          darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 via-white to-purple-50'
        }`}
      >
        <div className="absolute top-4 right-4">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`p-3 rounded-full ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-700'} shadow-lg hover:shadow-xl transition`}
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>

        <div className="min-h-screen flex items-center justify-center px-4">
          <div className={`max-w-md w-full p-8 rounded-2xl shadow-2xl ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center justify-center space-x-2 mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <DollarSign className="w-7 h-7 text-white" />
              </div>
              <span className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>DividAí</span>
            </div>

            <h2 className={`text-2xl font-bold mb-6 text-center ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Bem-vindo de volta!
            </h2>

            <button
              onClick={() => setIsLoggedIn(true)}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-xl transition"
            >
              Entrar no Sistema
            </button>

            <p className={`text-center mt-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Divida despesas sem complicação
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <header className={`${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-md`}>
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <button
                className={`md:hidden p-2 rounded-lg border ${
                  darkMode ? 'border-gray-700 text-gray-300' : 'border-gray-200 text-gray-700'
                } transition`}
                onClick={() => setIsMobileMenuOpen((prev) => !prev)}
                aria-label={isMobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
              >
                {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <span className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>DividAí</span>
              </div>
            </div>

            <div className="hidden md:flex items-center space-x-4">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-700'} hover:shadow-lg transition`}
              >
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <button
                onClick={() => setIsLoggedIn(false)}
                className={`px-4 py-2 rounded-lg ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-700'} hover:shadow-lg transition`}
              >
                Sair
              </button>
            </div>
          </div>
          {isMobileMenuOpen && (
            <div className={`md:hidden pb-4 space-y-3 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    setShowCreateGroup(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg"
                >
                  <UserPlus size={18} />
                  <span>Grupo</span>
                </button>
                <button
                  onClick={() => {
                    setShowAddExpense(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-xl font-semibold shadow-lg ${
                    darkMode ? 'bg-gray-800 text-white border border-gray-700' : 'bg-white text-gray-800 border border-gray-200'
                  }`}
                >
                  <DollarSign size={18} />
                  <span>Despesa</span>
                </button>
              </div>
              <div className="flex items-center justify-between">
                <button
                  onClick={() => {
                    setDarkMode((prev) => !prev);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`flex-1 mr-3 py-2 rounded-lg ${
                    darkMode ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-700'
                  } hover:shadow-md transition`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                    <span>{darkMode ? 'Tema Claro' : 'Tema Escuro'}</span>
                  </div>
                </button>
                <button
                  onClick={() => {
                    setIsLoggedIn(false);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`px-4 py-2 rounded-lg ${
                    darkMode ? 'bg-gray-800 text-white border border-gray-700' : 'bg-gray-100 text-gray-700 border border-gray-200'
                  } hover:shadow-md transition`}
                >
                  Sair
                </button>
              </div>
            </div>
          )}
        </nav>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className={`p-6 rounded-2xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total de Grupos</p>
                <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{groups.length}</p>
              </div>
              <Users className="w-12 h-12 text-blue-600" />
            </div>
          </div>

          <div className={`p-6 rounded-2xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total de Despesas</p>
                <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{expenses.length}</p>
              </div>
              <Receipt className="w-12 h-12 text-purple-600" />
            </div>
          </div>

          <div className={`p-6 rounded-2xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Valor Total</p>
                <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  R$ {groups.reduce((sum, g) => sum + g.total, 0).toFixed(2)}
                </p>
              </div>
              <TrendingUp className="w-12 h-12 text-green-600" />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 mb-8">
          <button
            onClick={() => setShowCreateGroup(true)}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-xl transition"
          >
            <UserPlus size={20} />
            <span>Novo Grupo</span>
          </button>

          <button
            onClick={() => setShowAddExpense(true)}
            className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold hover:shadow-xl transition ${
              darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-700 border-2 border-gray-200'
            }`}
          >
            <DollarSign size={20} />
            <span>Adicionar Despesa</span>
          </button>

          <button
            onClick={() => setShowActivity(true)}
            className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold hover:shadow-xl transition ${
              darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-700 border-2 border-gray-200'
            }`}
          >
            <Clock size={20} />
            <span>Atividades</span>
          </button>
        </div>

        {/* Groups List */}
        <div className="space-y-4">
          <h2 className={`text-2xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Meus Grupos</h2>

          {groups.map((group) => (
            <div
              key={group.id}
              className={`p-6 rounded-2xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg hover:shadow-xl transition`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className={`text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{group.name}</h3>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {group.members.length} participantes: {group.members.join(', ')}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    R$ {group.total.toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    setSelectedGroup(group);
                    setShowGroupDetails(true);
                  }}
                  className="flex items-center space-x-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
                >
                  <PieChart size={16} />
                  <span>Ver Detalhes</span>
                </button>

                <button
                  onClick={() => {
                    setSelectedGroup(group);
                    setShowSettlement(true);
                  }}
                  className="flex items-center space-x-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm"
                >
                  <CheckCircle size={16} />
                  <span>Acertar Contas</span>
                </button>

                <button
                  onClick={() => handleDeleteGroup(group.id)}
                  className="flex items-center space-x-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm"
                >
                  <Trash2 size={16} />
                  <span>Excluir</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Create Group Modal */}
      <Modal isOpen={showCreateGroup} onClose={() => setShowCreateGroup(false)} title="Criar Novo Grupo">
        <form onSubmit={(e) => { e.preventDefault(); handleCreateGroup(); }} className="space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Nome do Grupo
            </label>
            <input
              type="text"
              value={newGroup.name}
              onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
              className={`w-full px-4 py-2 rounded-lg border ${
                darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
              } focus:ring-2 focus:ring-blue-600 outline-none`}
              placeholder="Ex: Viagem Praia 2024"
              autoFocus
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Participantes (separados por vírgula)
            </label>
            <input
              type="text"
              value={newGroup.members}
              onChange={(e) => setNewGroup({ ...newGroup, members: e.target.value })}
              className={`w-full px-4 py-2 rounded-lg border ${
                darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
              } focus:ring-2 focus:ring-blue-600 outline-none`}
              placeholder="João, Maria, Pedro"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-xl transition"
          >
            Criar Grupo
          </button>
        </form>
      </Modal>

      {/* Add Expense Modal */}
      <Modal isOpen={showAddExpense} onClose={() => setShowAddExpense(false)} title="Adicionar Despesa">
        <form onSubmit={(e) => { e.preventDefault(); handleAddExpense(); }} className="space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Grupo
            </label>
            <select
              value={newExpense.groupId ?? ''}
              onChange={(e) => setNewExpense({
                ...newExpense,
                groupId: e.target.value ? parseInt(e.target.value, 10) : null
              })}
              className={`w-full px-4 py-2 rounded-lg border ${
                darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
              } focus:ring-2 focus:ring-blue-600 outline-none`}
            >
              <option value="">Selecione um grupo</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>{group.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Descrição
            </label>
            <input
              type="text"
              value={newExpense.description}
              onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
              className={`w-full px-4 py-2 rounded-lg border ${
                darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
              } focus:ring-2 focus:ring-blue-600 outline-none`}
              placeholder="Ex: Aluguel, Mercado, Hotel"
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Valor (R$)
            </label>
            <input
              type="number"
              step="0.01"
              value={newExpense.amount}
              onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
              className={`w-full px-4 py-2 rounded-lg border ${
                darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
              } focus:ring-2 focus:ring-blue-600 outline-none`}
              placeholder="0.00"
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Quem Pagou
            </label>
            <input
              type="text"
              value={newExpense.paidBy}
              onChange={(e) => setNewExpense({ ...newExpense, paidBy: e.target.value })}
              className={`w-full px-4 py-2 rounded-lg border ${
                darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
              } focus:ring-2 focus:ring-blue-600 outline-none`}
              placeholder="Nome do participante"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-xl transition"
          >
            Adicionar Despesa
          </button>
        </form>
      </Modal>

      {/* Group Details Modal */}
      <Modal
        isOpen={showGroupDetails}
        onClose={() => {
          setShowGroupDetails(false);
          setSelectedGroup(null);
        }}
        title={selectedGroup?.name || 'Detalhes do Grupo'}
      >
        {selectedGroup && (
          <div className="space-y-4">
            <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-1`}>Participantes</p>
              <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {selectedGroup.members.join(', ')}
              </p>
            </div>

            <div>
              <h4 className={`font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Despesas</h4>
              <div className="space-y-2">
                {expenses.filter((e) => e.groupId === selectedGroup.id).map((expense) => (
                  <div key={expense.id} className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{expense.description}</p>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          Pago por {expense.paidBy} • {expense.date}
                        </p>
                      </div>
                      <p className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        R$ {expense.amount.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Settlement Modal */}
      <Modal
        isOpen={showSettlement}
        onClose={() => {
          setShowSettlement(false);
          setSelectedGroup(null);
        }}
        title="Acerto de Contas"
      >
        {selectedGroup && (
          <div className="space-y-4">
            <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-1`}>Total de Despesas</p>
              <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                R$ {selectedGroup.total.toFixed(2)}
              </p>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                R$ {(selectedGroup.total / selectedGroup.members.length).toFixed(2)} por pessoa
              </p>
            </div>

            <div>
              <h4 className={`font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Saldo de Cada Pessoa</h4>
              <div className="space-y-2">
                {Object.entries(calculateSettlement(selectedGroup)).map(([member, balance]) => (
                  <div key={member} className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <div className="flex justify-between items-center">
                      <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{member}</p>
                      <p className={`font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {balance >= 0 ? '+' : ''} R$ {balance.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className={`font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Como Acertar</h4>
              <div className="space-y-2">
                {getSettlementInstructions(calculateSettlement(selectedGroup)).map((instruction, index) => (
                  <div key={index} className={`p-3 rounded-lg border-l-4 border-blue-600 ${darkMode ? 'bg-gray-700' : 'bg-blue-50'}`}>
                    <p className={`${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      <span className="font-semibold">{instruction.from}</span> deve pagar{' '}
                      <span className="font-bold text-blue-600">R$ {instruction.amount.toFixed(2)}</span> para{' '}
                      <span className="font-semibold">{instruction.to}</span>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Activity Feed Modal */}
      <Modal
        isOpen={showActivity}
        onClose={() => setShowActivity(false)}
        title="Histórico de Atividades"
      >
        <div className="space-y-3">
          {activities.length === 0 ? (
            <p className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Nenhuma atividade ainda
            </p>
          ) : (
            activities.map((activity) => (
              <div
                key={activity.id}
                className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} hover:shadow-md transition`}
              >
                <div className="flex items-start space-x-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      activity.type === 'group' ? 'bg-blue-100' : 'bg-green-100'
                    }`}
                  >
                    {activity.type === 'group' ? (
                      <Users size={18} className="text-blue-600" />
                    ) : (
                      <Receipt size={18} className="text-green-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className={`${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      <span className="font-semibold">{activity.user}</span>{' '}
                      {activity.action}{' '}
                      <span className="font-semibold">{activity.target}</span>
                    </p>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                      {renderActivityTime(activity.timestamp)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>
    </div>
  );
}