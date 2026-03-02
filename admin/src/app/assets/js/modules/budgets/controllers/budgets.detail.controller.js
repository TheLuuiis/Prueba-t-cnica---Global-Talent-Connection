export default function BudgetDetailController($scope, $state, $stateParams, BudgetApiService) {
  const vm = /** @type {any} */ (this);

  vm.isCreateMode = $stateParams.id === 'new';
  vm.isLoading = false;
  vm.isSaving = false;
  vm.budget = /** @type {any} */ (createEmptyBudget());
  vm.errorMessage = '';
  vm.successMessage = '';

  vm.goBack = goBack;
  vm.addChapter = addChapter;
  vm.deleteChapter = deleteChapter;
  vm.addBatch = addBatch;
  vm.deleteBatch = deleteBatch;
  vm.recalculate = recalculate;
  vm.removeThumbnail = removeThumbnail;
  vm.onThumbnailSelected = onThumbnailSelected;
  vm.saveBudget = saveBudget;
  vm.canSave = canSave;

  activate();

  function activate() {
    if (vm.isCreateMode) {
      recalculate();
      return;
    }

    vm.isLoading = true;
    vm.errorMessage = '';
    BudgetApiService.getById($stateParams.id)
      .then(function(budget) {
        vm.budget = normalizeBudgetForEdition(budget || createEmptyBudget());
        recalculate();
      })
      .catch(function() {
        vm.errorMessage = 'There was an error loading this budget.';
      })
      .finally(function() {
        vm.isLoading = false;
      });
  }

  function goBack() {
    $state.go('budgets');
  }

  function addChapter() {
    vm.budget.chapters = /** @type {any[]} */ (vm.budget.chapters || []);
    vm.budget.chapters.push({
      rank: vm.budget.chapters.length + 1,
      description: '',
      materialSaleCoefficient: 1,
      labourSaleCoefficient: 1,
      totalCostImport: 0,
      totalSaleImport: 0,
      batches: [],
    });

    recalculate();
  }

  function deleteChapter(chapterIndex) {
    vm.budget.chapters.splice(chapterIndex, 1);
    recalculate();
  }

  function addBatch(chapter) {
    chapter.batches = chapter.batches || [];
    chapter.batches.push({
      rank: chapter.batches.length + 1,
      description: '',
      amount: 0,
      materialCostImport: 0,
      labourCostImport: 0,
      unitaryCostImport: 0,
      totalCostImport: 0,
      unitarySaleCost: 0,
      totalSaleImport: 0,
    });

    recalculate();
  }

  function deleteBatch(chapter, batchIndex) {
    chapter.batches.splice(batchIndex, 1);
    recalculate();
  }

  function recalculate() {
    vm.budget.chapters = /** @type {any[]} */ (vm.budget.chapters || []);

    let totalCostImport = 0;
    let totalSaleImport = 0;

    vm.budget.chapters.forEach(function(chapter, chapterIndex) {
      chapter.rank = chapterIndex + 1;
      chapter.materialSaleCoefficient = toNumber(chapter.materialSaleCoefficient, 1);
      chapter.labourSaleCoefficient = toNumber(chapter.labourSaleCoefficient, 1);
      chapter.batches = chapter.batches || [];

      let chapterTotalCostImport = 0;
      let chapterTotalSaleImport = 0;

      chapter.batches.forEach(function(batch, batchIndex) {
        batch.rank = batchIndex + 1;
        batch.amount = toNumber(batch.amount, 0);
        batch.materialCostImport = toNumber(batch.materialCostImport, 0);
        batch.labourCostImport = toNumber(batch.labourCostImport, 0);

        batch.unitaryCostImport = roundToCents(batch.materialCostImport + batch.labourCostImport);
        batch.totalCostImport = roundToCents(batch.unitaryCostImport * batch.amount);
        batch.unitarySaleCost = roundToCents(
          batch.materialCostImport * chapter.materialSaleCoefficient +
          batch.labourCostImport * chapter.labourSaleCoefficient
        );
        batch.totalSaleImport = roundToCents(batch.unitarySaleCost * batch.amount);

        chapterTotalCostImport += batch.totalCostImport;
        chapterTotalSaleImport += batch.totalSaleImport;
      });

      chapter.totalCostImport = roundToCents(chapterTotalCostImport);
      chapter.totalSaleImport = roundToCents(chapterTotalSaleImport);

      totalCostImport += chapter.totalCostImport;
      totalSaleImport += chapter.totalSaleImport;
    });

    vm.budget.totalCostImport = roundToCents(totalCostImport);
    vm.budget.totalSaleImport = roundToCents(totalSaleImport);
  }

  function removeThumbnail() {
    vm.budget.thumbnail = '';
  }

  function onThumbnailSelected(fileList) {
    if (!fileList || !fileList.length) return;

    const selectedFile = fileList[0];
    const fileReader = new FileReader();
    fileReader.onload = function(loadEvent) {
      $scope.$applyAsync(function() {
        const target = loadEvent.target;
        const imageResult = target ? target.result : '';
        vm.budget.thumbnail = typeof imageResult === 'string' ? imageResult : '';
      });
    };
    fileReader.readAsDataURL(selectedFile);
  }

  function saveBudget() {
    vm.errorMessage = '';
    vm.successMessage = '';

    const validationError = validateBudget(vm.budget);
    if (validationError) {
      vm.errorMessage = validationError;
      return;
    }

    vm.isSaving = true;
    recalculate();

    const payload = buildPayload(vm.budget);
    const savePromise = vm.isCreateMode
      ? BudgetApiService.create(payload)
      : BudgetApiService.update(vm.budget.id, payload);

    savePromise
      .then(function(savedBudget) {
        const targetBudgetId = savedBudget && savedBudget.id ? savedBudget.id : vm.budget.id;
        vm.successMessage = 'Budget saved successfully.';
        $state.go('budgetDetail', { id: targetBudgetId }, { reload: true });
      })
      .catch(function() {
        vm.errorMessage = 'There was an error saving the budget.';
      })
      .finally(function() {
        vm.isSaving = false;
      });
  }

  function canSave() {
    return !validateBudget(vm.budget);
  }
}

BudgetDetailController.$inject = ['$scope', '$state', '$stateParams', 'BudgetApiService'];

function createEmptyBudget() {
  return {
    name: '',
    thumbnail: '',
    date: new Date(),
    clientName: '',
    totalCostImport: 0,
    totalSaleImport: 0,
    chapters: [],
  };
}

function normalizeBudgetForEdition(rawBudget) {
  const editionBudget = {
    id: rawBudget.id,
    name: rawBudget.name || '',
    thumbnail: rawBudget.thumbnail || '',
    date: rawBudget.date ? new Date(rawBudget.date) : new Date(),
    clientName: rawBudget.clientName || '',
    totalCostImport: toNumber(rawBudget.totalCostImport, 0),
    totalSaleImport: toNumber(rawBudget.totalSaleImport, 0),
    chapters: (rawBudget.chapters || []).map(function(chapter) {
      return {
        rank: toNumber(chapter.rank, 0),
        description: chapter.description || '',
        materialSaleCoefficient: toNumber(chapter.materialSaleCoefficient, 1),
        labourSaleCoefficient: toNumber(chapter.labourSaleCoefficient, 1),
        totalCostImport: toNumber(chapter.totalCostImport, 0),
        totalSaleImport: toNumber(chapter.totalSaleImport, 0),
        batches: (chapter.batches || []).map(function(batch) {
          return {
            rank: toNumber(batch.rank, 0),
            description: batch.description || '',
            amount: toNumber(batch.amount, 0),
            materialCostImport: toNumber(batch.materialCostImport, 0),
            labourCostImport: toNumber(batch.labourCostImport, 0),
            unitaryCostImport: toNumber(batch.unitaryCostImport, 0),
            totalCostImport: toNumber(batch.totalCostImport, 0),
            unitarySaleCost: toNumber(batch.unitarySaleCost, 0),
            totalSaleImport: toNumber(batch.totalSaleImport, 0),
          };
        }),
      };
    }),
  };

  return editionBudget;
}

function buildPayload(budget) {
  return {
    name: budget.name,
    thumbnail: budget.thumbnail,
    date: budget.date,
    clientName: budget.clientName,
    totalCostImport: budget.totalCostImport,
    totalSaleImport: budget.totalSaleImport,
    chapters: budget.chapters,
  };
}

function toNumber(value, defaultValue) {
  const parsedNumber = Number(value);
  return Number.isFinite(parsedNumber) ? parsedNumber : defaultValue;
}

function roundToCents(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function validateBudget(budget) {
  if (!budget.name || !budget.name.trim()) return 'Budget name is required.';
  if (!budget.clientName || !budget.clientName.trim()) return 'Client name is required.';
  if (!budget.date) return 'Budget date is required.';

  const parsedDate = new Date(budget.date);
  if (Number.isNaN(parsedDate.getTime())) return 'Budget date is invalid.';

  const hasInvalidChapter = (budget.chapters || []).some(function(chapter) {
    if (toNumber(chapter.materialSaleCoefficient, -1) < 0) return true;
    if (toNumber(chapter.labourSaleCoefficient, -1) < 0) return true;

    return (chapter.batches || []).some(function(batch) {
      return (
        toNumber(batch.amount, -1) < 0 ||
        toNumber(batch.materialCostImport, -1) < 0 ||
        toNumber(batch.labourCostImport, -1) < 0
      );
    });
  });

  if (hasInvalidChapter) {
    return 'Numeric fields must be zero or greater.';
  }

  return '';
}