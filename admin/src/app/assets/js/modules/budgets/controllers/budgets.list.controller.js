export default function BudgetsListController($state, BudgetApiService) {
  const vm = this;

  vm.filters = {
    name: '',
    clientName: '',
    fromDate: null,
    toDate: null,
  };
  vm.budgets = [];
  vm.filteredBudgets = [];
  vm.isLoading = false;
  vm.budgetPendingDeletion = null;
  vm.errorMessage = '';

  vm.applyFilters = applyFilters;
  vm.goToCreate = goToCreate;
  vm.goToEdit = goToEdit;
  vm.openDeleteModal = openDeleteModal;
  vm.cancelDelete = cancelDelete;
  vm.confirmDelete = confirmDelete;
  vm.getChaptersSummary = getChaptersSummary;

  activate();

  function activate() {
    loadBudgets();
  }

  function loadBudgets() {
    vm.isLoading = true;
    vm.errorMessage = '';
    BudgetApiService.list()
      .then(function(budgets) {
        vm.budgets = budgets || [];
        applyFilters();
      })
      .catch(function() {
        vm.errorMessage = 'There was an error loading budgets. Please try again.';
      })
      .finally(function() {
        vm.isLoading = false;
      });
  }

  function applyFilters() {
    const filterName = (vm.filters.name || '').trim().toLowerCase();
    const filterClientName = (vm.filters.clientName || '').trim().toLowerCase();
    const fromDate = vm.filters.fromDate ? new Date(vm.filters.fromDate) : null;
    const toDate = vm.filters.toDate ? new Date(vm.filters.toDate) : null;
    if (toDate) toDate.setHours(23, 59, 59, 999);

    if (fromDate && toDate && fromDate > toDate) {
      vm.filteredBudgets = [];
      vm.errorMessage = 'Invalid date range: "From date" must be lower or equal than "To date".';
      return;
    }

    vm.errorMessage = '';

    vm.filteredBudgets = vm.budgets.filter(function(budget) {
      const budgetName = (budget.name || '').toLowerCase();
      const budgetClientName = (budget.clientName || '').toLowerCase();
      const budgetDate = budget.date ? new Date(budget.date) : null;

      const matchName = !filterName || budgetName.includes(filterName);
      const matchClientName = !filterClientName || budgetClientName.includes(filterClientName);
      const matchFromDate = !fromDate || (budgetDate && budgetDate >= fromDate);
      const matchToDate = !toDate || (budgetDate && budgetDate <= toDate);

      return matchName && matchClientName && matchFromDate && matchToDate;
    });
  }

  function goToCreate() {
    $state.go('budgetDetail', { id: 'new' });
  }

  function goToEdit(budgetId) {
    $state.go('budgetDetail', { id: budgetId });
  }

  function openDeleteModal(budget) {
    vm.budgetPendingDeletion = budget;
  }

  function cancelDelete() {
    vm.budgetPendingDeletion = null;
  }

  function confirmDelete() {
    if (!vm.budgetPendingDeletion || !vm.budgetPendingDeletion.id) return;

    BudgetApiService.remove(vm.budgetPendingDeletion.id)
      .then(function() {
        vm.budgetPendingDeletion = null;
        loadBudgets();
      })
      .catch(function() {
        vm.errorMessage = 'There was an error deleting the budget. Please try again.';
      });
  }

  function getChaptersSummary(chapters) {
    const chapterList = (chapters || [])
      .map(function(chapter) {
        const rank = Number.isFinite(Number(chapter.rank)) ? Number(chapter.rank) : '';
        const description = (chapter.description || '').trim();

        if (rank && description) return `${rank}. ${description}`;
        if (rank) return `${rank}.`;
        return description;
      })
      .filter(function(summaryLine) {
        return !!summaryLine;
      });

    if (!chapterList.length) return '-';
    return chapterList.join(' | ');
  }
}

BudgetsListController.$inject = ['$state', 'BudgetApiService'];