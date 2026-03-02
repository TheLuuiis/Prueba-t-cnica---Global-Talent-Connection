import angular from 'angular';
import budgetsListUrl from './views/budgets.list.html';
import budgetDetailUrl from './views/budgets.detail.html';
import BudgetsListController from './controllers/budgets.list.controller';
import BudgetDetailController from './controllers/budgets.detail.controller';
import BudgetApiService from './services/budget.api.service';

export default angular
  .module('app.budgets', [])
  .service('BudgetApiService', BudgetApiService)
  .config(routeConfig)
  .name;

function routeConfig($stateProvider) {
  $stateProvider
    .state('budgets', {
      url: '/budgets',
      templateUrl: budgetsListUrl,
      controller: BudgetsListController,
      controllerAs: 'vm',
    })
    .state('budgetDetail', {
      url: '/budgets/:id',
      templateUrl: budgetDetailUrl,
      controller: BudgetDetailController,
      controllerAs: 'vm',
    });
}

routeConfig.$inject = ['$stateProvider'];